import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import comunidadesTopo from 'es-atlas/es/autonomous_regions.json'
import provinciasTopo from 'es-atlas/es/provinces.json'

export type Tipo = 'comunidades' | 'provincias'

export interface Elemento {
  id: string
  nombre: string
  alias: string[]
}

const NOMBRES_DOBLES: Record<string, Pick<Elemento, 'nombre' | 'alias'>> = {
  'Cataluña/Catalunya': { nombre: 'Cataluña', alias: ['Catalunya'] },
  'País Vasco/Euskadi': { nombre: 'País Vasco', alias: ['Euskadi'] },
  'Alacant/Alicante': { nombre: 'Alicante', alias: ['Alacant'] },
  'Castelló/Castellón': { nombre: 'Castellón', alias: ['Castelló'] },
  'València/Valencia': { nombre: 'Valencia', alias: ['València'] },
  'Araba/Álava': { nombre: 'Álava', alias: ['Araba'] },
}

const FORMAS_CASTELLANAS: Record<string, string> = {
  'A Coruña': 'La Coruña',
  Bizkaia: 'Vizcaya',
  'Comunitat Valenciana': 'Comunidad Valenciana',
  Gipuzkoa: 'Guipúzcoa',
  Girona: 'Gerona',
  'Illes Balears': 'Islas Baleares',
  Lleida: 'Lérida',
  Ourense: 'Orense',
}

function nombres(nombreOficial: string): Pick<Elemento, 'nombre' | 'alias'> {
  const castellano = FORMAS_CASTELLANAS[nombreOficial]
  if (castellano) return { nombre: `${nombreOficial} (${castellano})`, alias: [castellano] }
  return NOMBRES_DOBLES[nombreOficial] ?? { nombre: nombreOficial, alias: [] }
}

type Geometrias = GeometryCollection<{ name: string }>

function sinGibraltar(topologia: Topology, objeto: string, gibraltar: string) {
  const geometrias = topologia.objects[objeto] as Geometrias
  return {
    topologia,
    geometrias: { ...geometrias, geometries: geometrias.geometries.filter((geometria) => geometria.id !== gibraltar) },
  }
}

const tipos = {
  comunidades: sinGibraltar(comunidadesTopo as unknown as Topology, 'autonomous_regions', '20'),
  provincias: sinGibraltar(provinciasTopo as unknown as Topology, 'provinces', '54'),
}

export function catalogo(tipo: Tipo): Elemento[] {
  return tipos[tipo].geometrias.geometries.map((geometria) => ({
    id: String(geometria.id),
    ...nombres((geometria.properties as { name: string }).name),
  }))
}

export function contornos(tipo: Tipo): Feature<Geometry>[] {
  const { topologia, geometrias } = tipos[tipo]
  return (feature(topologia, geometrias) as FeatureCollection).features
}
