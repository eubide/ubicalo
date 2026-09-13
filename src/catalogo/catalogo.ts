import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import comunidadesTopo from 'es-atlas/es/autonomous_regions.json'

export interface Elemento {
  id: string
  nombre: string
  alias: string[]
}

const GIBRALTAR = '20'

const NOMBRES_DOBLES: Record<string, Pick<Elemento, 'nombre' | 'alias'>> = {
  '09': { nombre: 'Cataluña', alias: ['Catalunya'] },
  '16': { nombre: 'País Vasco', alias: ['Euskadi'] },
}

type Comunidades = GeometryCollection<{ name: string }>

const topologia = comunidadesTopo as unknown as Topology<{ autonomous_regions: Comunidades }>

const comunidades: Comunidades = {
  ...topologia.objects.autonomous_regions,
  geometries: topologia.objects.autonomous_regions.geometries.filter((geometria) => geometria.id !== GIBRALTAR),
}

export function catalogo(): Elemento[] {
  return comunidades.geometries.map((geometria) => {
    const id = String(geometria.id)
    return { id, ...(NOMBRES_DOBLES[id] ?? { nombre: (geometria.properties as { name: string }).name, alias: [] }) }
  })
}

export function contornos(): Feature<Geometry>[] {
  return (feature(topologia, comunidades) as FeatureCollection).features
}
