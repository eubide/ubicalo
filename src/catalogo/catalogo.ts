import { geoArea, geoCentroid, geoContains, geoDistance } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson'
import { feature, merge, neighbors } from 'topojson-client'
import type { GeometryCollection, MultiPolygon, Topology } from 'topojson-specification'
import comunidadesTopo from 'es-atlas/es/autonomous_regions.json'
import provinciasTopo from 'es-atlas/es/provinces.json'
import cordillerasGeo from '../datos/cordilleras.json'
import sierrasGeo from '../datos/sierras.json'
import picosGeo from '../datos/picos.json'
import riosGeo from '../datos/rios.json'

type TipoAdministrativo = 'comunidades' | 'provincias'
type TipoDeRelieve = 'cordilleras-y-sierras' | 'picos' | 'jerarquia' | 'alturas'
export type Tipo = TipoAdministrativo | TipoDeRelieve

type Capa = 'cordilleras' | 'sierras' | 'picos'

export interface Fondo {
  contorno: Feature<Geometry>
  relieve: Feature<Geometry>[]
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
  cordillera?: string
  respuesta?: string
  pregunta?: string
  clase?: Clase
}

export type Clase = 'cordillera' | 'sierra' | 'pico'

export const etiquetaDeClase: Record<Clase, string> = {
  cordillera: 'Cordillera o macizo',
  sierra: 'Sierra',
  pico: 'Pico',
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

const ALIAS_DE_RELIEVE: Record<string, string[]> = {
  pirineos: ['Pirineo'],
  'cordillera-cantabrica': ['Cantábrica', 'Montes Cantábricos'],
  'macizo-galaico-leones': ['Macizo Galaico', 'Galaico'],
  'sistema-iberico': ['Ibérico', 'Cordillera Ibérica'],
  'sistema-central': ['Central'],
  'montes-de-toledo': ['Toledo'],
  'sierra-morena': ['Morena'],
  'cordilleras-beticas': ['Béticas', 'Sistema Bético', 'Sistemas Béticos'],
  'cordillera-costero-catalana': ['Costero-Catalana', 'Cordilleras Costeras Catalanas', 'Cordillera Litoral Catalana'],
  'montanas-de-canarias': ['Canarias'],
  'sierra-nevada': ['Nevada'],
  'sierra-de-cazorla': ['Cazorla'],
  'sierra-de-gata': ['Gata'],
  'sierra-de-gredos': ['Gredos'],
  'sierra-de-guadarrama': ['Guadarrama'],
  'sierra-de-bejar': ['Béjar'],
  'sierra-del-moncayo': ['Moncayo'],
  'sierra-de-albarracin': ['Albarracín'],
  'serrania-de-cuenca': ['Cuenca', 'Sierra de Cuenca'],
  'picos-de-urbion': ['Urbión', 'Sierra de Urbión'],
  'sierra-de-la-demanda': ['Demanda'],
  'montes-de-leon': ['León'],
  'pirineo-navarro': ['Navarro'],
  'pirineo-aragones': ['Aragonés'],
  'pirineo-catalan': ['Catalán'],
  'torre-cerredo': ['Torrecerredo', 'Torre de Cerredo'],
  'pena-trevinca': ['Trevinca'],
  aizkorri: ['Aketegi'],
  almanzor: ['Pico Almanzor'],
  moncayo: ['Pico Moncayo'],
  banuela: ['Cerro Bañuela'],
  teide: ['Pico del Teide'],
}

const VECINOS_POR_CERCANIA = 3

const ALTURAS_EXAMINADAS = ['moncayo', 'aneto', 'teide', 'mulhacen']

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

const topologias: Record<TipoAdministrativo, ReturnType<typeof geometriasSinGibraltar>> = {
  comunidades: geometriasSinGibraltar(
    comunidadesTopo as unknown as Topology,
    'autonomous_regions',
    GIBRALTAR_COMUNIDADES,
  ),
  provincias: geometriasSinGibraltar(provinciasTopo as unknown as Topology, 'provinces', GIBRALTAR_PROVINCIAS),
}

const relieve: Record<Capa, FeatureCollection> = {
  cordilleras: cordillerasGeo as FeatureCollection,
  sierras: sierrasGeo as FeatureCollection,
  picos: picosGeo as FeatureCollection,
}

const rios = (riosGeo as FeatureCollection).features

const TIPOS_DE_RELIEVE: TipoDeRelieve[] = ['cordilleras-y-sierras', 'picos', 'jerarquia', 'alturas']

function esDeRelieve(tipo: Tipo): tipo is TipoDeRelieve {
  return (TIPOS_DE_RELIEVE as Tipo[]).includes(tipo)
}

// Capas que se dibujan y se tocan en cada tipo de relieve.
const CAPAS_DEL_MAPA: Record<TipoDeRelieve, Capa[]> = {
  'cordilleras-y-sierras': ['cordilleras', 'sierras'],
  picos: ['picos'],
  jerarquia: ['cordilleras', 'picos'],
  alturas: ['picos'],
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

// Cordilleras y picos no comparten frontera: sus vecinos son los más cercanos por centroide.
function vecinosPorCercania(contornos: Feature<Geometry>[]): string[][] {
  const centros = contornos.map((contorno) => geoCentroid(contorno))
  return centros.map((centro, indice) =>
    centros
      .map((otro, otroIndice) => ({ id: String(contornos[otroIndice].id), distancia: geoDistance(centro, otro) }))
      .filter((_, otroIndice) => otroIndice !== indice)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, VECINOS_POR_CERCANIA)
      .map(({ id }) => id),
  )
}

function elementosDe(contornosDeCapa: Feature<Geometry>[], claseFija?: Clase): Elemento[] {
  const vecinosPorIndice = vecinosPorCercania(contornosDeCapa)
  return contornosDeCapa.map((contorno, indice) => {
    const id = String(contorno.id)
    const { nombre, cordillera, clase } = contorno.properties as { nombre: string; cordillera?: string; clase?: Clase }
    return {
      id,
      nombre,
      nombreMostrado: nombre,
      alias: ALIAS_DE_RELIEVE[id] ?? [],
      vecinos: vecinosPorIndice[indice],
      clase: claseFija ?? clase ?? 'cordillera',
      ...(cordillera && { cordillera }),
    }
  })
}

function contornosDeCapas(capas: Capa[]): Feature<Geometry>[] {
  return capas.flatMap((capa) => relieve[capa].features)
}

// El enunciado dice qué clase de elemento se busca; en el mapa cada clase tiene su icono.
function conEnunciadoDeClase(elementos: Elemento[]): Elemento[] {
  return elementos.map((elemento) => ({ ...elemento, pregunta: etiquetaDeClase[elemento.clase ?? 'cordillera'] }))
}

// Cada sierra y cada pico se responde tocando su cordillera, y cada cordillera tocando su pico; los
// vecinos son los del elemento que se toca, para que la Pista de área ilumine lo tocable.
function catalogoDeJerarquia(): Elemento[] {
  const cordilleras = elementosDe(relieve.cordilleras.features)
  const picos = elementosDe(relieve.picos.features)
  const hijos = [...elementosDe(relieve.sierras.features), ...picos].map((elemento) => {
    const madre = cordilleras.find((cordillera) => cordillera.id === elemento.cordillera)
    if (!madre) throw new Error(`${elemento.id} sin cordillera madre`)
    const nombreMostrado = `${elemento.nombre} (${elemento.clase})`
    return { ...elemento, nombreMostrado, vecinos: madre.vecinos, respuesta: madre.id, pregunta: 'Toca su cordillera' }
  })
  const madres = cordilleras.map((cordillera) => {
    const pico = picos.find((candidato) => candidato.cordillera === cordillera.id)
    if (!pico) throw new Error(`${cordillera.id} sin pico`)
    return { ...cordillera, vecinos: pico.vecinos, respuesta: pico.id, pregunta: 'Toca su pico' }
  })
  return [...hijos, ...madres]
}

function conPuntoDeMillar(altitud: number): string {
  return String(altitud).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function catalogoDeAlturas(): Elemento[] {
  const examinados = contornos('alturas')
  const vecinosPorIndice = vecinosPorCercania(examinados)
  return examinados.map((contorno, indice) => {
    const { nombre, altitud, cordillera } = contorno.properties as { nombre: string; altitud: number; cordillera: string }
    const cifra = String(altitud)
    const conPunto = conPuntoDeMillar(altitud)
    return {
      id: String(contorno.id),
      nombre: cifra,
      nombreMostrado: `${conPunto} m`,
      alias: [conPunto, `${cifra} m`, `${conPunto} m`],
      vecinos: vecinosPorIndice[indice],
      clase: 'pico' as const,
      cordillera,
      pregunta: `Altura del ${nombre}`,
    }
  })
}

function catalogoDeRelieve(tipo: TipoDeRelieve): Elemento[] {
  if (tipo === 'jerarquia') return catalogoDeJerarquia()
  if (tipo === 'alturas') return catalogoDeAlturas()
  return conEnunciadoDeClase(elementosDe(contornosDeCapas(CAPAS_DEL_MAPA[tipo])))
}

// Elementos cuyo id coincide con lo que se toca en el mapa: en Jerarquía, cordilleras y picos, cada
// capa con sus propios vecinos.
export function catalogoDelMapa(tipo: Tipo): Elemento[] {
  if (tipo === 'jerarquia') return CAPAS_DEL_MAPA.jerarquia.flatMap((capa) => elementosDe(relieve[capa].features))
  return catalogo(tipo)
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

const contornosPorTipo: Partial<Record<Tipo, Feature<Geometry>[]>> = {}

function contornosDeRelieve(tipo: TipoDeRelieve): Feature<Geometry>[] {
  if (tipo === 'alturas') {
    return (contornosPorTipo.alturas ??= relieve.picos.features.filter((pico) => ALTURAS_EXAMINADAS.includes(String(pico.id))))
  }
  return (contornosPorTipo[tipo] ??= contornosDeCapas(CAPAS_DEL_MAPA[tipo]))
}

export function contornos(tipo: Tipo): Feature<Geometry>[] {
  if (esDeRelieve(tipo)) return contornosDeRelieve(tipo)
  const { topologia, geometrias } = topologias[tipo]
  return (contornosPorTipo[tipo] ??= (feature(topologia, geometrias) as FeatureCollection).features)
}

let contornoDeEspana: Feature<Geometry> | undefined

// El relieve se juega sobre un mapa físico: contorno de España y ríos; cuando las cordilleras no se
// tocan, se ven en tenue para situarse.
export function fondoDe(tipo: Tipo): Fondo | null {
  if (!esDeRelieve(tipo)) return null
  const { topologia, geometrias } = topologias.comunidades
  const poligonos = geometrias.geometries as MultiPolygon[]
  contornoDeEspana ??= { type: 'Feature', properties: {}, geometry: merge(topologia, poligonos) }
  const conCordilleras = !CAPAS_DEL_MAPA[tipo].includes('cordilleras')
  return { contorno: contornoDeEspana, relieve: conCordilleras ? relieve.cordilleras.features : [], rios }
}
