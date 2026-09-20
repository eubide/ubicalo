import { geoCentroid, geoDistance } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import costasGeo from '../datos/costas.json'
import riosGeo from '../datos/rios.json'
import type { ContextoGeografico, Elemento } from './catalogo'

export type AlcanceDeCostas = 'cabos' | 'golfos' | 'pertenencia-costas' | 'todo-costas'

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
  // Los Cabos que un Golfo baña, es decir, los que están sobre el arco de costa del que nace su
  // mancha. Distinguen al Cabo que el Golfo contiene con razón del que se tragaría por error.
  cabos?: string[]
  alias?: string[]
  desambiguacion?: string
}

const costas = (costasGeo as FeatureCollection).features
const esTramo = (forma: Feature<Geometry>) => propiedadesDeCosta(forma).clase === 'tramo-de-costa'
const tramos = costas.filter(esTramo)
const cabos = costas.filter((forma) => propiedadesDeCosta(forma).clase === 'cabo')
const golfos = costas.filter((forma) => ['golfo', 'estrecho'].includes(propiedadesDeCosta(forma).clase))
const cabosYGolfos = [...cabos, ...golfos]
const laCostaEntera = [...tramos, ...cabosYGolfos]
const rios = (riosGeo as FeatureCollection).features

export function propiedadesDeCosta(contorno: Feature<Geometry>): PropiedadesDeCosta {
  return contorno.properties as PropiedadesDeCosta
}

const CONTORNOS_DEL_MAPA: Record<AlcanceDeCostas, Feature<Geometry>[]> = {
  cabos,
  golfos,
  // En Pertenencia se toca el Tramo, y dibujar encima los Cabos y los Golfos le robaba el toque a
  // casi la mitad de la Costa Cantábrica: el blanco fino gana al grueso y el alumno fallaba tocando
  // donde debía. Aquí no hay nada más que tocar, así que no se dibuja nada más.
  'pertenencia-costas': tramos,
  'todo-costas': laCostaEntera,
}

export function esDeCostas(alcance: string): alcance is AlcanceDeCostas {
  return alcance in CONTORNOS_DEL_MAPA
}

const VECINOS_POR_CERCANIA = 3

// Los Vecinos son los más cercanos de su propia Clase, como en el relieve. Por Tramo no salían: la
// Costa Gallega no tiene ningún Golfo y la Cantábrica tiene uno, así que no daban tres Distractores.
function vecinosDe(id: string, { clase }: PropiedadesDeCosta): string[] {
  if (clase === 'tramo-de-costa') return tramos.map((otro) => String(otro.id)).filter((otro) => otro !== id)
  const familia = clase === 'cabo' ? cabos : golfos
  const suyo = familia.find((forma) => String(forma.id) === id)!
  const centro = geoCentroid(suyo)
  return familia
    .filter((otro) => String(otro.id) !== id)
    .map((otro) => ({ id: String(otro.id), lejos: geoDistance(centro, geoCentroid(otro)) }))
    .sort((uno, otro) => uno.lejos - otro.lejos)
    .slice(0, VECINOS_POR_CERCANIA)
    .map(({ id: cercano }) => cercano)
}

function elementoDeCosta(contorno: Feature<Geometry>): Elemento {
  const id = String(contorno.id)
  const propiedades = propiedadesDeCosta(contorno)
  const { nombre, clase, tramo, alias, desambiguacion } = propiedades
  const hermanos = vecinosDe(id, propiedades)
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

// Sin relieve de fondo, que taparía las manchas, y con los ríos en tenue: el delta del Ebro y la
// desembocadura del Guadiana son límites de Tramo y de Golfo, así que orientan en vez de estorbar.
export function contextoDeCostas(contorno: Feature<Geometry>): ContextoGeografico {
  return { contorno, tenues: [], rios }
}
