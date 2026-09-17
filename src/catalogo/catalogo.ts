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
  etiquetaDeClaseDeRelieve,
  tocablesDeRelieve,
  type Clase,
  type TipoDeRelieve,
} from './relieve'
import {
  catalogoDeHidrografia,
  contextoDeHidrografia,
  contornosDeHidrografia,
  esDeHidrografia,
  etiquetaDeClaseDeRio,
  tocablesDeHidrografia,
  type ClaseDeRio,
  type TipoDeHidrografia,
} from './hidrografia'

type TipoPolitico = 'comunidades' | 'provincias'
export type Tipo = TipoPolitico | TipoDeRelieve | TipoDeHidrografia

export type ClaseDelMapa = Clase | ClaseDeRio

export const etiquetaDeClase: Record<ClaseDelMapa, string> = {
  ...etiquetaDeClaseDeRelieve,
  ...etiquetaDeClaseDeRio,
}

export interface ContextoGeografico {
  contorno: Feature<Geometry>
  tenues: Feature<Geometry>[]
  rios: Feature<Geometry>[]
}

export interface Elemento {
  id: string
  nombre: string
  nombreMostrado: string
  alias: string[]
  vecinos: string[]
  comunidad?: string
  ciudadAutonoma?: true
  clase?: ClaseDelMapa
  cordillera?: string
  altura?: number
  vertiente?: string
  // Río en el que desemboca de verdad un Afluente, que puede ser otro Afluente.
  desembocaEn?: string
  // Río principal del final de esa cadena: lo que se pregunta en Jerarquía de ríos.
  cuenca?: string
  // Frase que distingue este elemento del que se le parece, para la Corrección.
  desambiguacion?: string
  // Lo que ilumina la Pista de área cuando no basta con los Vecinos.
  pistaDeArea?: string[]
  fueraDeApuntes?: true
  // Id que hay que tocar cuando no es el propio elemento (Jerarquía).
  respuesta?: string
  // Enunciado que acompaña al nombre; sin él, se muestra la clase.
  pregunta?: string
  // Texto del rótulo en el Repaso cuando el nombre mostrado no basta (Alturas).
  rotulo?: string
  destacar?: true
  // Ids que deben estar entre los Acertados antes de poder tocar este elemento (Simulacro).
  desbloqueaCon?: string[]
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
  if (esDeRelieve(tipo)) return tocablesDeRelieve(tipo)
  if (esDeHidrografia(tipo)) return tocablesDeHidrografia(tipo)
  return catalogo(tipo)
}

export function catalogo(tipo: Tipo): Elemento[] {
  if (esDeRelieve(tipo)) return catalogoDeRelieve(tipo)
  if (esDeHidrografia(tipo)) return catalogoDeHidrografia(tipo)
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
  if (esDeHidrografia(tipo)) return contornosDeHidrografia(tipo)
  const { topologia, geometrias } = topologias[tipo]
  return (contornosPorTipo[tipo] ??= (feature(topologia, geometrias) as FeatureCollection).features)
}

let contornoDeEspana: Feature<Geometry> | undefined

export function contextoDe(tipo: Tipo): ContextoGeografico | null {
  if (!esDeRelieve(tipo) && !esDeHidrografia(tipo)) return null
  const { topologia, geometrias } = topologias.comunidades
  const poligonos = geometrias.geometries as MultiPolygon[]
  contornoDeEspana ??= { type: 'Feature', properties: {}, geometry: merge(topologia, poligonos) }
  return esDeRelieve(tipo) ? contextoDeRelieve(tipo, contornoDeEspana) : contextoDeHidrografia(contornoDeEspana)
}
