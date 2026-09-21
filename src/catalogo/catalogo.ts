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
  type Papel,
  type AlcanceDeRelieve,
} from './relieve'
import {
  catalogoDeHidrografia,
  contextoDeHidrografia,
  contornosDeHidrografia,
  esDeHidrografia,
  etiquetaDeClaseDeRio,
  tocablesDeHidrografia,
  type ClaseDeRio,
  type AlcanceDeHidrografia,
} from './hidrografia'
import {
  catalogoDeCostas,
  contextoDeCostas,
  contornosDeCostas,
  esDeCostas,
  etiquetaDeClaseDeCosta,
  tocablesDeCostas,
  type ClaseDeCosta,
  type AlcanceDeCostas,
} from './costas'

type AlcancePolitico = 'comunidades' | 'provincias'
export type Alcance = AlcancePolitico | AlcanceDeRelieve | AlcanceDeHidrografia | AlcanceDeCostas

export type ClaseDelMapa = Clase | ClaseDeRio | ClaseDeCosta

export const etiquetaDeClase: Record<ClaseDelMapa, string> = {
  ...etiquetaDeClaseDeRelieve,
  ...etiquetaDeClaseDeRio,
  ...etiquetaDeClaseDeCosta,
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
  papel?: Papel
  cordillera?: string
  altura?: number
  vertiente?: string
  tramo?: string
  // Río en el que desemboca de verdad un Afluente, que puede ser otro Afluente.
  desembocaEn?: string
  // Río principal del final de esa cadena: lo que se pregunta en Pertenencia de la hidrografía.
  cuenca?: string
  // Frase que distingue este elemento del que se le parece, para la Corrección.
  desambiguacion?: string
  // Lo que ilumina la Pista de área cuando no basta con los Vecinos.
  pistaDeArea?: string[]
  fueraDeApuntes?: true
  // Id que hay que tocar cuando no es el propio elemento (Pertenencia).
  respuesta?: string
  // Enunciado que acompaña al nombre; sin él, se muestra la clase.
  pregunta?: string
  // Texto del rótulo en el Repaso cuando el nombre mostrado no basta (Alturas).
  rotulo?: string
  // La respuesta es una cifra, así que se escribe aunque la Prueba vaya en dirección de localizar.
  seEscribe?: true
  destacar?: true
  // Ids que deben estar entre los Acertados antes de poder tocar este elemento (Todo).
  desbloqueaCon?: string[]
}

type Nombres = Pick<Elemento, 'nombre' | 'nombreMostrado' | 'alias'>

const CIUDADES_AUTONOMAS = ['Ceuta', 'Melilla', 'Ciudad Autónoma de Ceuta', 'Ciudad Autónoma de Melilla']

// Solo las capas del IGN traen `name`, así que un Cabo o un Golfo nunca lo cumple por accidente.
export function esCiudadAutonoma(contorno: Feature<Geometry>): boolean {
  const { name } = (contorno.properties ?? {}) as { name?: string }
  return name !== undefined && CIUDADES_AUTONOMAS.includes(name)
}

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

// Lo que basta escribir cuando sobra un sustantivo entero que la normalización no puede quitar.
const BASTA_ESCRIBIR: Record<string, string> = {
  'Principado de Asturias': 'Asturias',
  'Illes Balears': 'Baleares',
  'Comunitat Valenciana': 'Valencia',
  'Comunidad de Madrid': 'Madrid',
  'Región de Murcia': 'Murcia',
  'Comunidad Foral de Navarra': 'Navarra',
  'Ciudad Autónoma de Ceuta': 'Ceuta',
  'Ciudad Autónoma de Melilla': 'Melilla',
  'A Coruña': 'Coruña',
  'Santa Cruz de Tenerife': 'Tenerife',
  'Vertiente Cantábrica': 'Cantábrica',
  'Vertiente Atlántica': 'Atlántica',
  'Vertiente Mediterránea': 'Mediterránea',
  'Depresión del Guadalquivir': 'Guadalquivir',
  'Depresión del Ebro': 'Ebro',
  "Turó de l'Home": 'Turó',
  'Golfo de Vizcaya': 'Vizcaya',
  'Golfo de Cádiz': 'Cádiz',
  'Golfo de Almería': 'Almería',
  'Golfo de Valencia': 'Valencia',
  'Golfo de San Jorge': 'San Jorge',
  'Golfo de Rosas': 'Rosas',
  'Estrecho de Gibraltar': 'Gibraltar',
  'Punta de Estaca de Bares': 'Estaca de Bares',
}

function nombresOficialYCastellano(nombreEnAtlas: string): Nombres {
  const doble = NOMBRES_DOBLES[nombreEnAtlas]
  if (doble) return { nombre: doble.castellano, nombreMostrado: doble.castellano, alias: [doble.otraForma] }
  const castellano = FORMAS_CASTELLANAS[nombreEnAtlas]
  if (castellano) return { nombre: nombreEnAtlas, nombreMostrado: `${nombreEnAtlas} (${castellano})`, alias: [castellano] }
  return { nombre: nombreEnAtlas, nombreMostrado: nombreEnAtlas, alias: [] }
}

function conFormaCorta(elemento: Elemento): Elemento {
  const corta = BASTA_ESCRIBIR[elemento.nombre]
  return corta ? { ...elemento, alias: [...elemento.alias, corta] } : elemento
}

type Geometrias = GeometryCollection<{ name: string }>

function geometriasSinGibraltar(topologia: Topology, objeto: string, gibraltar: string) {
  const geometrias = topologia.objects[objeto] as Geometrias
  return {
    topologia,
    geometrias: { ...geometrias, geometries: geometrias.geometries.filter((geometria) => geometria.id !== gibraltar) },
  }
}

const topologias: Record<AlcancePolitico, ReturnType<typeof geometriasSinGibraltar>> = {
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

// Elementos que se tocan en el mapa; en Pertenencia no coinciden con los preguntados.
export function catalogoDelMapa(alcance: Alcance): Elemento[] {
  if (esDeRelieve(alcance)) return tocablesDeRelieve(alcance).map(conFormaCorta)
  if (esDeHidrografia(alcance)) return tocablesDeHidrografia(alcance).map(conFormaCorta)
  if (esDeCostas(alcance)) return tocablesDeCostas(alcance).map(conFormaCorta)
  return catalogo(alcance)
}

export function catalogo(alcance: Alcance): Elemento[] {
  return catalogoSinFormasCortas(alcance).map(conFormaCorta)
}

function catalogoSinFormasCortas(alcance: Alcance): Elemento[] {
  if (esDeRelieve(alcance)) return catalogoDeRelieve(alcance)
  if (esDeHidrografia(alcance)) return catalogoDeHidrografia(alcance)
  if (esDeCostas(alcance)) return catalogoDeCostas(alcance)
  const { geometries } = topologias[alcance].geometrias
  const vecinosPorIndice = neighbors(geometries)
  const provincias = alcance === 'provincias' ? contornos('provincias') : []
  const comunidades = alcance === 'provincias' ? contornos('comunidades') : []
  return geometries.map((geometria, indice) => {
    const { name } = geometria.properties as { name: string }
    return {
      id: String(geometria.id),
      ...nombresOficialYCastellano(name),
      vecinos: vecinosPorIndice[indice].map((vecino) => String(geometries[vecino].id)),
      ...(alcance === 'provincias' && { comunidad: comunidadQueContiene(provincias[indice], comunidades) }),
      ...(CIUDADES_AUTONOMAS.includes(name) && { ciudadAutonoma: true as const }),
    }
  })
}

const contornosPorAlcance: Partial<Record<AlcancePolitico, Feature<Geometry>[]>> = {}

export function contornos(alcance: Alcance): Feature<Geometry>[] {
  if (esDeRelieve(alcance)) return contornosDeRelieve(alcance)
  if (esDeHidrografia(alcance)) return contornosDeHidrografia(alcance)
  if (esDeCostas(alcance)) return contornosDeCostas(alcance)
  const { topologia, geometrias } = topologias[alcance]
  return (contornosPorAlcance[alcance] ??= (feature(topologia, geometrias) as FeatureCollection).features)
}

let contornoDeEspana: Feature<Geometry> | undefined

export function siluetaDeEspana(): Feature<Geometry> {
  const { topologia, geometrias } = topologias.comunidades
  const poligonos = geometrias.geometries as MultiPolygon[]
  return (contornoDeEspana ??= { type: 'Feature', properties: {}, geometry: merge(topologia, poligonos) })
}

export function contextoDe(alcance: Alcance): ContextoGeografico | null {
  const espana = siluetaDeEspana()
  if (esDeRelieve(alcance)) return contextoDeRelieve(alcance, espana)
  if (esDeHidrografia(alcance)) return contextoDeHidrografia(espana)
  if (esDeCostas(alcance)) return contextoDeCostas(espana)
  return null
}
