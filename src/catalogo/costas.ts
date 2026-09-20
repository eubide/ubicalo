import type { Feature, FeatureCollection, Geometry } from 'geojson'
import costasGeo from '../datos/costas.json'
import riosGeo from '../datos/rios.json'
import type { ContextoGeografico, Elemento } from './catalogo'

export type AlcanceDeCostas = 'cabos-y-golfos'

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
const cabosYGolfos = costas.filter((forma) => propiedadesDeCosta(forma).clase !== 'tramo-de-costa')
const rios = (riosGeo as FeatureCollection).features

export function propiedadesDeCosta(contorno: Feature<Geometry>): PropiedadesDeCosta {
  return contorno.properties as PropiedadesDeCosta
}

const CONTORNOS_DEL_MAPA: Record<AlcanceDeCostas, Feature<Geometry>[]> = {
  'cabos-y-golfos': cabosYGolfos,
}

export function esDeCostas(alcance: string): alcance is AlcanceDeCostas {
  return alcance in CONTORNOS_DEL_MAPA
}

function hermanosDe(id: string, tramo: string | undefined): string[] {
  return cabosYGolfos
    .filter((otro) => String(otro.id) !== id && propiedadesDeCosta(otro).tramo === tramo)
    .map((otro) => String(otro.id))
}

function elementoDeCosta(contorno: Feature<Geometry>): Elemento {
  const id = String(contorno.id)
  const { nombre, clase, tramo, alias, desambiguacion } = propiedadesDeCosta(contorno)
  const hermanos = hermanosDe(id, tramo)
  return {
    id,
    nombre,
    nombreMostrado: nombre,
    alias: alias ?? [],
    vecinos: hermanos,
    // El Tramo no se dibuja en este Alcance, así que iluminarlo es iluminar lo suyo que sí se ve.
    pistaDeArea: [id, ...hermanos],
    clase,
    ...(tramo && { tramo }),
    ...(desambiguacion && { desambiguacion }),
  }
}

export function catalogoDeCostas(alcance: AlcanceDeCostas): Elemento[] {
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
