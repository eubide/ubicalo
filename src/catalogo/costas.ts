import { geoCentroid, geoDistance } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import costasGeo from '../datos/costas.json'
import riosGeo from '../datos/rios.json'
import type { ContextoGeografico, Elemento } from './catalogo'

export type AlcanceDeCostas = 'cabos' | 'golfos' | 'todo-costas'

export type ClaseDeCosta = 'cabo' | 'golfo' | 'estrecho'

export const etiquetaDeClaseDeCosta: Record<ClaseDeCosta, string> = {
  cabo: 'Cabo',
  golfo: 'Golfo',
  estrecho: 'Estrecho',
}

export interface PropiedadesDeCosta {
  nombre: string
  clase: ClaseDeCosta
  // Los Cabos que un Golfo baña, es decir, los que están sobre el arco de costa del que nace su
  // mancha. Distinguen al Cabo que el Golfo contiene con razón del que se tragaría por error.
  cabos?: string[]
  alias?: string[]
  desambiguacion?: string
}

const costas = (costasGeo as FeatureCollection).features
const cabos = costas.filter((forma) => propiedadesDeCosta(forma).clase === 'cabo')
const golfos = costas.filter((forma) => ['golfo', 'estrecho'].includes(propiedadesDeCosta(forma).clase))
// Los Cabos van delante de los Golfos, y ese orden es el que la Tanda usa para traer los nuevos.
const laCostaEntera = [...cabos, ...golfos]
const rios = (riosGeo as FeatureCollection).features

export function propiedadesDeCosta(contorno: Feature<Geometry>): PropiedadesDeCosta {
  return contorno.properties as PropiedadesDeCosta
}

const CONTORNOS_DEL_MAPA: Record<AlcanceDeCostas, Feature<Geometry>[]> = {
  cabos,
  golfos,
  'todo-costas': laCostaEntera,
}

export function esDeCostas(alcance: string): alcance is AlcanceDeCostas {
  return Object.hasOwn(CONTORNOS_DEL_MAPA, alcance)
}

const VECINOS_POR_CERCANIA = 3

// Los Vecinos son los más cercanos de su propia Clase, como en el relieve.
function vecinosDe(id: string, { clase }: PropiedadesDeCosta): string[] {
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
  const { nombre, clase, alias, desambiguacion } = propiedades
  const hermanos = vecinosDe(id, propiedades)
  return {
    id,
    nombre,
    nombreMostrado: nombre,
    alias: alias ?? [],
    vecinos: hermanos,
    pistaDeArea: [id, ...hermanos],
    clase,
    ...(desambiguacion && { desambiguacion }),
  }
}

// Costas es la única Familia plana: lo único que le hacía de jerarquía era el Tramo de costa, que no
// tenía canon y se fue con él. Los veinte se ven desde el principio.
export function catalogoDeCostas(alcance: AlcanceDeCostas): Elemento[] {
  const elementos = CONTORNOS_DEL_MAPA[alcance].map(elementoDeCosta)
  return alcance === 'todo-costas' ? elementos.map((elemento) => ({ ...elemento, desbloqueaCon: [] })) : elementos
}

export function tocablesDeCostas(alcance: AlcanceDeCostas): Elemento[] {
  return CONTORNOS_DEL_MAPA[alcance].map(elementoDeCosta)
}

export function contornosDeCostas(alcance: AlcanceDeCostas): Feature<Geometry>[] {
  return CONTORNOS_DEL_MAPA[alcance]
}

// Sin relieve de fondo, que taparía las manchas, y sin el reparto de la tierra en zonas, que se probó
// y competía con el agua. Los ríos sí, en tenue: el delta del Ebro y la desembocadura del Guadiana
// son límites de Golfo, así que orientan en vez de estorbar.
export function contextoDeCostas(contorno: Feature<Geometry>): ContextoGeografico {
  return { contorno, tenues: [], rios }
}
