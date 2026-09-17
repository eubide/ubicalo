import type { Feature, FeatureCollection, Geometry } from 'geojson'
import riosGeo from '../datos/rios.json'
import type { ContextoGeografico, Elemento } from './catalogo'

export type TipoDeHidrografia = 'rios'

export type ClaseDeRio = 'vertiente' | 'rio-principal' | 'rio-propio' | 'afluente'

export const etiquetaDeClaseDeRio: Record<ClaseDeRio, string> = {
  vertiente: 'Vertiente',
  'rio-principal': 'Río principal',
  'rio-propio': 'Río',
  afluente: 'Afluente',
}

export interface PropiedadesDeRio {
  nombre: string
  clase: ClaseDeRio
  vertiente?: string
  desembocaEn?: string
  alias?: string[]
  desambiguacion?: string
  fueraDeApuntes?: true
}

const rios = (riosGeo as FeatureCollection).features

export function propiedadesDeRio(contorno: Feature<Geometry>): PropiedadesDeRio {
  return contorno.properties as PropiedadesDeRio
}

const CONTORNOS_DEL_MAPA: Record<TipoDeHidrografia, Feature<Geometry>[]> = {
  rios,
}

export function esDeHidrografia(tipo: string): tipo is TipoDeHidrografia {
  return tipo in CONTORNOS_DEL_MAPA
}

const propiedadesPorId = new Map(rios.map((rio) => [String(rio.id), propiedadesDeRio(rio)]))

// Un afluente puede desembocar en otro afluente, pero su cuenca es siempre el Río principal del final
// de la cadena: es lo que pregunta el examen.
function cuencaDe(id: string): string {
  let actual = id
  for (;;) {
    const siguiente = propiedadesPorId.get(actual)?.desembocaEn
    if (!siguiente) return actual
    actual = siguiente
  }
}

// Los Vecinos de un río son sus hermanos de cuenca, no los más cercanos: es lo que de verdad confunde
// el alumno, y de ahí salen los Distractores y lo que ilumina la Pista de área.
function hermanosDe(id: string, propiedades: PropiedadesDeRio): string[] {
  const mismaFamilia =
    propiedades.clase === 'afluente'
      ? (otras: PropiedadesDeRio, otroId: string) => otras.clase === 'afluente' && cuencaDe(otroId) === cuencaDe(id)
      : (otras: PropiedadesDeRio) => otras.clase !== 'afluente' && otras.vertiente === propiedades.vertiente
  return [...propiedadesPorId]
    .filter(([otroId, otras]) => otroId !== id && mismaFamilia(otras, otroId))
    .map(([otroId]) => otroId)
}

function elementoDeRio(contorno: Feature<Geometry>): Elemento {
  const id = String(contorno.id)
  const { nombre, clase, vertiente, desembocaEn, alias, desambiguacion, fueraDeApuntes } = propiedadesDeRio(contorno)
  return {
    id,
    nombre,
    nombreMostrado: nombre,
    alias: alias ?? [],
    vecinos: hermanosDe(id, propiedadesPorId.get(id)!),
    clase,
    ...(vertiente && { vertiente }),
    ...(desembocaEn && { desembocaEn, cuenca: cuencaDe(id) }),
    ...(desambiguacion && { desambiguacion }),
    ...(fueraDeApuntes && { fueraDeApuntes }),
  }
}

export function catalogoDeHidrografia(tipo: TipoDeHidrografia): Elemento[] {
  return CONTORNOS_DEL_MAPA[tipo].map(elementoDeRio)
}

export function tocablesDeHidrografia(tipo: TipoDeHidrografia): Elemento[] {
  return catalogoDeHidrografia(tipo)
}

export function contornosDeHidrografia(tipo: TipoDeHidrografia): Feature<Geometry>[] {
  return CONTORNOS_DEL_MAPA[tipo]
}

// Los ríos se juegan sobre el mapa pelado: con 41 líneas encima, las manchas de cordillera taparían
// justo lo que hay que tocar.
export function contextoDeHidrografia(contorno: Feature<Geometry>): ContextoGeografico {
  return { contorno, tenues: [], rios: [] }
}
