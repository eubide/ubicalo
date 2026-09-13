import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import comunidadesTopo from 'es-atlas/es/autonomous_regions.json'

export type Tipo = 'comunidades'

export interface Elemento {
  id: string
  nombre: string
}

const GIBRALTAR = '20'

export function catalogo(_tipo: Tipo): Elemento[] {
  return comunidadesTopo.objects.autonomous_regions.geometries
    .filter((geometria) => geometria.id !== GIBRALTAR)
    .map((geometria) => ({ id: geometria.id, nombre: geometria.properties.name }))
}

export function geometrias(_tipo: Tipo): Feature<Geometry>[] {
  const topologia = comunidadesTopo as unknown as Topology<{ autonomous_regions: GeometryCollection }>
  const coleccion = feature(topologia, topologia.objects.autonomous_regions) as FeatureCollection
  return coleccion.features.filter((rasgo) => rasgo.id !== GIBRALTAR)
}
