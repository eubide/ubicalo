import { geoArea, geoCentroid, geoContains } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
import { feature, merge, neighbors } from 'topojson-client'
import type { GeometryCollection, MultiPolygon, Topology } from 'topojson-specification'
import comunidadesTopo from 'es-atlas/es/autonomous_regions.json'
import provinciasTopo from 'es-atlas/es/provinces.json'
import {
  catalogoDeRelieve,
  contextoDeRelieve,
  contornosDeRelieve,
  esDeRelieve,
  tocablesDeRelieve,
  type Clase,
  type ContextoDeRelieve,
  type TipoDeRelieve,
} from './relieve'

type TipoPolitico = 'comunidades' | 'provincias'
export type Tipo = TipoPolitico | TipoDeRelieve

export interface Elemento {
  id: string
  nombre: string
  nombreMostrado: string
  alias: string[]
  vecinos: string[]
  comunidad?: string
  ciudadAutonoma?: true
  clase?: Clase
  cordillera?: string
  altura?: number
  // Id que hay que tocar cuando no es el propio elemento (Jerarquía).
  respuesta?: string
  // Enunciado que acompaña al nombre; sin él, se muestra la clase.
  pregunta?: string
  // Texto del rótulo en el Repaso cuando el nombre mostrado no basta (Alturas).
  rotulo?: string
  destacar?: true
}

type Nombres = Pick<Elemento, 'nombre' | 'nombreMostrado' | 'alias'>

const CIUDADES_AUTONOMAS = ['Ceuta', 'Melilla', 'Ciudad Autónoma de Ceuta', 'Ciudad Autónoma de Melilla']

const GIBRALTAR_COMUNIDADES = '20'
const GIBRALTAR_PROVINCIAS = '54'

const NOMBRES_DOBLES: Record<string, { castellano: string; otraForma: string }> = {
  'Cataluña/Catalunya': { castellano: 'Cataluña', otraForma: 'Catalunya' },
  'País Vasco/Euskadi': { castellano: 'País Vasco', otraForma: 'Euskadi' },
  'Alacant/Alicante': { castellano: 'Alicante', otraForma: 'Alacant' },
  'Castelló/Castellón': { castellano: 'Castellón', otraForma: 'Castelló' },
  'València/Valencia': { castellano: 'Valencia', otraForma: 'València' },
  'Araba/Álava': { castellano: 'Álava', otraForma: 'Araba' },
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

const FORMAS_CORTAS: Record<string, string> = {
  'Principado de Asturias': 'Asturias',
  'Illes Balears': 'Baleares',
  'Comunitat Valenciana': 'Valencia',
  'Comunidad de Madrid': 'Madrid',
  'Región de Murcia': 'Murcia',
  'Comunidad Foral de Navarra': 'Navarra',
  'La Rioja': 'Rioja',
  'Ciudad Autónoma de Ceuta': 'Ceuta',
  'Ciudad Autónoma de Melilla': 'Melilla',
  'A Coruña': 'Coruña',
  'Santa Cruz de Tenerife': 'Tenerife',
}

function nombresOficialYCastellano(nombreEnAtlas: string): Nombres {
  const doble = NOMBRES_DOBLES[nombreEnAtlas]
  if (doble) return { nombre: doble.castellano, nombreMostrado: doble.castellano, alias: [doble.otraForma] }
  const castellano = FORMAS_CASTELLANAS[nombreEnAtlas]
  if (castellano) return { nombre: nombreEnAtlas, nombreMostrado: `${nombreEnAtlas} (${castellano})`, alias: [castellano] }
  return { nombre: nombreEnAtlas, nombreMostrado: nombreEnAtlas, alias: [] }
}

function nombresDelElemento(nombreEnAtlas: string): Nombres {
  const nombres = nombresOficialYCastellano(nombreEnAtlas)
  const formaCorta = FORMAS_CORTAS[nombreEnAtlas]
  return formaCorta ? { ...nombres, alias: [...nombres.alias, formaCorta] } : nombres
}

type Geometrias = GeometryCollection<{ name: string }>

function geometriasSinGibraltar(topologia: Topology, objeto: string, gibraltar: string) {
  const geometrias = topologia.objects[objeto] as Geometrias
  return {
    topologia,
    geometrias: { ...geometrias, geometries: geometrias.geometries.filter((geometria) => geometria.id !== gibraltar) },
  }
}

const topologias: Record<TipoPolitico, ReturnType<typeof geometriasSinGibraltar>> = {
  comunidades: geometriasSinGibraltar(
    comunidadesTopo as unknown as Topology,
    'autonomous_regions',
    GIBRALTAR_COMUNIDADES,
  ),
  provincias: geometriasSinGibraltar(provinciasTopo as unknown as Topology, 'provinces', GIBRALTAR_PROVINCIAS),
}

function poligonoMayor(geometria: Geometry): Polygon {
  if (geometria.type === 'Polygon') return geometria
  if (geometria.type !== 'MultiPolygon') throw new Error(`Geometría inesperada: ${geometria.type}`)
  const poligonos = geometria.coordinates.map((coordinates): Polygon => ({ type: 'Polygon', coordinates }))
  return poligonos.reduce((mayor, poligono) => (geoArea(poligono) > geoArea(mayor) ? poligono : mayor))
}

// El centroide de un archipiélago cae en el mar; el de su isla mayor, dentro de la comunidad.
function comunidadQueContiene(provincia: Feature<Geometry>, comunidades: Feature<Geometry>[]): string {
  const punto = geoCentroid(poligonoMayor(provincia.geometry))
  const comunidad = comunidades.find((candidata) => geoContains(candidata, punto))
  if (!comunidad) throw new Error(`Provincia ${provincia.id} fuera de toda comunidad autónoma`)
  return String(comunidad.id)
}

// Elementos que se tocan en el mapa; en Jerarquía no coinciden con los preguntados.
export function catalogoDelMapa(tipo: Tipo): Elemento[] {
  return esDeRelieve(tipo) ? tocablesDeRelieve(tipo) : catalogo(tipo)
}

export function catalogo(tipo: Tipo): Elemento[] {
  if (esDeRelieve(tipo)) return catalogoDeRelieve(tipo)
  const { geometries } = topologias[tipo].geometrias
  const vecinosPorIndice = neighbors(geometries)
  const provincias = tipo === 'provincias' ? contornos('provincias') : []
  const comunidades = tipo === 'provincias' ? contornos('comunidades') : []
  return geometries.map((geometria, indice) => {
    const { name } = geometria.properties as { name: string }
    return {
      id: String(geometria.id),
      ...nombresDelElemento(name),
      vecinos: vecinosPorIndice[indice].map((vecino) => String(geometries[vecino].id)),
      ...(tipo === 'provincias' && { comunidad: comunidadQueContiene(provincias[indice], comunidades) }),
      ...(CIUDADES_AUTONOMAS.includes(name) && { ciudadAutonoma: true as const }),
    }
  })
}

const contornosPorTipo: Partial<Record<TipoPolitico, Feature<Geometry>[]>> = {}

export function contornos(tipo: Tipo): Feature<Geometry>[] {
  if (esDeRelieve(tipo)) return contornosDeRelieve(tipo)
  const { topologia, geometrias } = topologias[tipo]
  return (contornosPorTipo[tipo] ??= (feature(topologia, geometrias) as FeatureCollection).features)
}

let contornoDeEspana: Feature<Geometry> | undefined

// El relieve se juega sobre un mapa físico: contorno de España, ríos y, cuando no se tocan, las
// cordilleras en tenue. Nada de eso se pregunta.
export function contextoDe(tipo: Tipo): ContextoDeRelieve | null {
  if (!esDeRelieve(tipo)) return null
  const { topologia, geometrias } = topologias.comunidades
  const poligonos = geometrias.geometries as MultiPolygon[]
  contornoDeEspana ??= { type: 'Feature', properties: {}, geometry: merge(topologia, poligonos) }
  return contextoDeRelieve(tipo, contornoDeEspana)
}
