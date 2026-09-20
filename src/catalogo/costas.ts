import type { Feature, FeatureCollection, Geometry } from 'geojson'
import costasGeo from '../datos/costas.json'
import riosGeo from '../datos/rios.json'
import type { ContextoGeografico, Elemento } from './catalogo'

export type AlcanceDeCostas = 'cabos-y-golfos' | 'pertenencia-costas' | 'todo-costas'

export type ClaseDeCosta = 'tramo-de-costa' | 'cabo' | 'golfo' | 'estrecho'

export const etiquetaDeClaseDeCosta: Record<ClaseDeCosta, string> = {
  'tramo-de-costa': 'Tramo de costa',
  cabo: 'Cabo',
  golfo: 'Golfo',
  estrecho: 'Estrecho',
}

export interface PropiedadesDeCosta {
  nombre: string
  clase: ClaseDeCosta
  tramo?: string
  alias?: string[]
  desambiguacion?: string
}

const costas = (costasGeo as FeatureCollection).features
const esTramo = (forma: Feature<Geometry>) => propiedadesDeCosta(forma).clase === 'tramo-de-costa'
const tramos = costas.filter(esTramo)
const cabosYGolfos = costas.filter((forma) => !esTramo(forma))
const laCostaEntera = [...tramos, ...cabosYGolfos]
const rios = (riosGeo as FeatureCollection).features

export function propiedadesDeCosta(contorno: Feature<Geometry>): PropiedadesDeCosta {
  return contorno.properties as PropiedadesDeCosta
}

const CONTORNOS_DEL_MAPA: Record<AlcanceDeCostas, Feature<Geometry>[]> = {
  'cabos-y-golfos': cabosYGolfos,
  'pertenencia-costas': laCostaEntera,
  'todo-costas': laCostaEntera,
}

export function esDeCostas(alcance: string): alcance is AlcanceDeCostas {
  return alcance in CONTORNOS_DEL_MAPA
}

function hermanosDe(id: string, { clase, tramo }: PropiedadesDeCosta): string[] {
  const familia =
    clase === 'tramo-de-costa' ? tramos : cabosYGolfos.filter((otro) => propiedadesDeCosta(otro).tramo === tramo)
  return familia.map((otro) => String(otro.id)).filter((otro) => otro !== id)
}

function elementoDeCosta(contorno: Feature<Geometry>): Elemento {
  const id = String(contorno.id)
  const propiedades = propiedadesDeCosta(contorno)
  const { nombre, clase, tramo, alias, desambiguacion } = propiedades
  const hermanos = hermanosDe(id, propiedades)
  return {
    id,
    nombre,
    nombreMostrado: nombre,
    alias: alias ?? [],
    vecinos: hermanos,
    pistaDeArea: [id, ...hermanos],
    clase,
    ...(tramo && { tramo }),
    ...(desambiguacion && { desambiguacion }),
  }
}

// Cada Cabo, Golfo y el Estrecho se responden tocando su Tramo. No se pregunta en los dos sentidos
// como en Relieve: un Tramo tiene hasta seis y ninguno lo representa.
function catalogoDePertenenciaDeCostas(): Elemento[] {
  const porId = new Map(tramos.map(elementoDeCosta).map((tramo) => [tramo.id, tramo]))
  return cabosYGolfos.map(elementoDeCosta).map((elemento) => {
    const tramo = porId.get(elemento.tramo!)!
    return {
      ...elemento,
      vecinos: tramo.vecinos,
      pistaDeArea: [tramo.id],
      respuesta: tramo.id,
      pregunta: 'Toca su tramo de costa',
    }
  })
}

function catalogoDeTodoDeCostas(): Elemento[] {
  return laCostaEntera
    .map(elementoDeCosta)
    .map((elemento) => ({
      ...elemento,
      desbloqueaCon: elemento.clase === 'tramo-de-costa' ? [] : [elemento.tramo!],
    }))
}

export function catalogoDeCostas(alcance: AlcanceDeCostas): Elemento[] {
  if (alcance === 'pertenencia-costas') return catalogoDePertenenciaDeCostas()
  if (alcance === 'todo-costas') return catalogoDeTodoDeCostas()
  return CONTORNOS_DEL_MAPA[alcance].map(elementoDeCosta)
}

export function tocablesDeCostas(alcance: AlcanceDeCostas): Elemento[] {
  return CONTORNOS_DEL_MAPA[alcance].map(elementoDeCosta)
}

export function contornosDeCostas(alcance: AlcanceDeCostas): Feature<Geometry>[] {
  return CONTORNOS_DEL_MAPA[alcance]
}

// Sin relieve de fondo, que taparía los arcos, y con los ríos en tenue: el delta del Ebro y la
// desembocadura del Guadiana son límites de Tramo y de Golfo, así que orientan en vez de estorbar.
export function contextoDeCostas(contorno: Feature<Geometry>): ContextoGeografico {
  return { contorno, tenues: [], rios }
}
