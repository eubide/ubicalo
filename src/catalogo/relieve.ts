import { geoCentroid, geoDistance } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import cordillerasGeo from '../datos/cordilleras.json'
import sierrasGeo from '../datos/sierras.json'
import picosGeo from '../datos/picos.json'
import riosGeo from '../datos/rios.json'
import type { Elemento } from './catalogo'

export type TipoDeRelieve = 'cordilleras-y-sierras' | 'picos' | 'jerarquia' | 'alturas' | 'simulacro'

export type Clase = 'cordillera' | 'sierra' | 'pico'

export const etiquetaDeClase: Record<Clase, string> = {
  cordillera: 'Cordillera o macizo',
  sierra: 'Sierra',
  pico: 'Pico',
}

export interface PropiedadesDeRelieve {
  nombre: string
  clase: Clase
  cordillera?: string
  altura?: number
}

export interface ContextoDeRelieve {
  contorno: Feature<Geometry>
  tenues: Feature<Geometry>[]
  rios: Feature<Geometry>[]
}

export function propiedadesDe(contorno: Feature<Geometry>): PropiedadesDeRelieve {
  return contorno.properties as PropiedadesDeRelieve
}

const ALIAS: Record<string, string[]> = {
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

// Los apuntes solo examinan estas cuatro alturas, en este orden.
const ALTURAS_EXAMINADAS = ['moncayo', 'aneto', 'teide', 'mulhacen']

const contornosPorClase: Record<Clase, Feature<Geometry>[]> = {
  cordillera: (cordillerasGeo as FeatureCollection).features,
  sierra: (sierrasGeo as FeatureCollection).features,
  pico: (picosGeo as FeatureCollection).features,
}

const rios = (riosGeo as FeatureCollection).features

// Clases que se dibujan y se tocan en cada Tipo; lo que no se toca se ve en tenue.
const CLASES_DEL_MAPA: Record<TipoDeRelieve, Clase[]> = {
  'cordilleras-y-sierras': ['cordillera', 'sierra'],
  picos: ['pico'],
  jerarquia: ['cordillera', 'pico'],
  alturas: ['pico'],
  simulacro: ['cordillera', 'sierra', 'pico'],
}

export function esDeRelieve(tipo: string): tipo is TipoDeRelieve {
  return tipo in CLASES_DEL_MAPA
}

// Nada del relieve comparte frontera: los vecinos son los más cercanos por centroide.
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

function conPuntoDeMillar(altura: number): string {
  return String(altura).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function alturaMostrada(altura: number): string {
  return `${conPuntoDeMillar(altura)} m`
}

function elementosDe(contornos: Feature<Geometry>[]): Elemento[] {
  const vecinosPorIndice = vecinosPorCercania(contornos)
  return contornos.map((contorno, indice) => {
    const id = String(contorno.id)
    const { nombre, clase, cordillera, altura } = propiedadesDe(contorno)
    const examinada = altura !== undefined && ALTURAS_EXAMINADAS.includes(id)
    return {
      id,
      nombre,
      nombreMostrado: nombre,
      alias: ALIAS[id] ?? [],
      vecinos: vecinosPorIndice[indice],
      clase,
      ...(cordillera && { cordillera }),
      ...(examinada && { altura }),
    }
  })
}

function elementosDeClases(clases: Clase[]): Elemento[] {
  return elementosDe(clases.flatMap((clase) => contornosPorClase[clase]))
}

// Cada sierra y cada pico se responde tocando su cordillera, y cada cordillera tocando su pico; los
// vecinos son los del elemento que se toca, para que la Pista de área ilumine lo tocable.
function catalogoDeJerarquia(): Elemento[] {
  const cordilleras = elementosDe(contornosPorClase.cordillera)
  const picos = elementosDe(contornosPorClase.pico)
  const haciaLaCordillera = [...elementosDe(contornosPorClase.sierra), ...picos].map((elemento) => {
    const cordillera = cordilleras.find((candidata) => candidata.id === elemento.cordillera)
    if (!cordillera) throw new Error(`${elemento.id} sin cordillera`)
    const nombreMostrado = `${elemento.nombre} (${elemento.clase})`
    return { ...elemento, nombreMostrado, vecinos: cordillera.vecinos, respuesta: cordillera.id, pregunta: 'Toca su cordillera' }
  })
  const haciaElPico = cordilleras.map((cordillera) => {
    const pico = picos.find((candidato) => candidato.cordillera === cordillera.id)
    if (!pico) throw new Error(`${cordillera.id} sin pico`)
    return { ...cordillera, vecinos: pico.vecinos, respuesta: pico.id, pregunta: 'Toca su pico', destacar: true as const }
  })
  return [...haciaLaCordillera, ...haciaElPico]
}

// La cifra es la respuesta escrita: no se muestra ni en el nombre ni bajo el icono, solo en el Repaso.
function elementoDeAltura(pico: Elemento, id: string): Elemento {
  const altura = pico.altura
  if (altura === undefined) throw new Error(`${pico.id} sin altura`)
  return {
    id,
    nombre: String(altura),
    nombreMostrado: alturaMostrada(altura),
    alias: [conPuntoDeMillar(altura), `${altura} m`, alturaMostrada(altura)],
    vecinos: [],
    clase: 'pico',
    ...(pico.cordillera && { cordillera: pico.cordillera }),
    pregunta: `Altura del ${pico.nombre}`,
    rotulo: `${pico.nombre} · ${alturaMostrada(altura)}`,
  }
}

function catalogoDeAlturas(): Elemento[] {
  return elementosDe(contornosDeRelieve('alturas')).map((pico) => elementoDeAltura(pico, pico.id))
}

// Cada Elemento sabe qué debe estar Acertado antes de poder tocarse; las cordilleras no dependen de nada.
function catalogoDeSimulacro(): Elemento[] {
  const cordilleras = elementosDe(contornosPorClase.cordillera).map((elemento) => ({
    ...elemento,
    desbloqueaCon: [] as string[],
  }))
  const sierras = elementosDe(contornosPorClase.sierra).map((elemento) => ({
    ...elemento,
    desbloqueaCon: [elemento.cordillera!],
  }))
  const sierrasPorCordillera = new Map<string, string[]>()
  for (const sierra of sierras) {
    sierrasPorCordillera.set(sierra.cordillera!, [...(sierrasPorCordillera.get(sierra.cordillera!) ?? []), sierra.id])
  }
  const picos = elementosDe(contornosPorClase.pico).map((elemento) => ({
    ...elemento,
    desbloqueaCon: [elemento.cordillera!, ...(sierrasPorCordillera.get(elemento.cordillera!) ?? [])],
  }))
  const alturas = picos
    .filter((pico) => pico.altura !== undefined)
    .map((pico) => ({ ...elementoDeAltura(pico, idDeAltura(pico.id)), desbloqueaCon: [pico.id] }))
  return [...cordilleras, ...sierras, ...picos, ...alturas]
}

export function catalogoDeRelieve(tipo: TipoDeRelieve): Elemento[] {
  if (tipo === 'jerarquia') return catalogoDeJerarquia()
  if (tipo === 'alturas') return catalogoDeAlturas()
  if (tipo === 'simulacro') return catalogoDeSimulacro()
  return elementosDeClases(CLASES_DEL_MAPA[tipo])
}

// Elementos que se tocan en el mapa, cada clase con sus propios vecinos; en Jerarquía y Simulacro no
// coinciden con el catálogo de preguntas (Jerarquía pregunta sierras que no están en el mapa; Simulacro
// pregunta también las cuatro alturas, que no tienen forma propia).
export function tocablesDeRelieve(tipo: TipoDeRelieve): Elemento[] {
  if (tipo === 'jerarquia') return CLASES_DEL_MAPA.jerarquia.flatMap((clase) => elementosDe(contornosPorClase[clase]))
  if (tipo === 'simulacro') return elementosDeClases(CLASES_DEL_MAPA.simulacro)
  return catalogoDeRelieve(tipo)
}

const contornosPorTipo: Partial<Record<TipoDeRelieve, Feature<Geometry>[]>> = {}

export function contornosDeRelieve(tipo: TipoDeRelieve): Feature<Geometry>[] {
  if (tipo === 'alturas') {
    return (contornosPorTipo.alturas ??= ALTURAS_EXAMINADAS.map(
      (id) => contornosPorClase.pico.find((pico) => String(pico.id) === id)!,
    ))
  }
  return (contornosPorTipo[tipo] ??= CLASES_DEL_MAPA[tipo].flatMap((clase) => contornosPorClase[clase]))
}

export function contextoDeRelieve(tipo: TipoDeRelieve, contorno: Feature<Geometry>): ContextoDeRelieve {
  const tenues = CLASES_DEL_MAPA[tipo].includes('cordillera') ? [] : contornosPorClase.cordillera
  return { contorno, tenues, rios }
}

// Id de la pregunta de Altura de un pico dentro del Simulacro: distinto del id del propio pico, para
// que acertar uno y acertar el otro queden como dos entradas independientes en Acertados.
export function idDeAltura(idDelPico: string): string {
  return `altura-${idDelPico}`
}

export function esIdDeAltura(id: string): boolean {
  return id.startsWith('altura-')
}

export function textoDeAltura(altura: number): string {
  return alturaMostrada(altura)
}
