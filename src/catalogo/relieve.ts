import { geoCentroid, geoDistance } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import cordillerasGeo from '../datos/cordilleras.json'
import sierrasGeo from '../datos/sierras.json'
import picosGeo from '../datos/picos.json'
import unidadesGeo from '../datos/unidades.json'
import riosGeo from '../datos/rios.json'
import type { ContextoGeografico, Elemento } from './catalogo'

export type AlcanceDeRelieve =
  | 'cordilleras-y-sierras'
  | 'picos'
  | 'pertenencia-relieve'
  | 'todo-relieve'
  | 'unidades'

export type Clase = 'cordillera' | 'sierra' | 'pico' | 'meseta' | 'depresion'

// El lugar que ocupa cada unidad respecto a la Meseta, tal como lo clasifica la capa del IGN.
export type Papel = 'meseta' | 'interior' | 'reborde' | 'depresion' | 'exterior' | 'volcanico'

export const etiquetaDeClaseDeRelieve: Record<Clase, string> = {
  cordillera: 'Cordillera o macizo',
  sierra: 'Sierra',
  pico: 'Pico',
  meseta: 'Meseta',
  depresion: 'Depresión',
}

export const PAPELES: Papel[] = ['meseta', 'interior', 'reborde', 'depresion', 'exterior', 'volcanico']

export const etiquetaDePapel: Record<Papel, string> = {
  meseta: 'El núcleo de la Península',
  interior: 'Cordillera interior de la Meseta',
  reborde: 'Reborde que envuelve la Meseta',
  depresion: 'Depresión entre el reborde y la cordillera exterior',
  exterior: 'Cordillera exterior, lejos de la Meseta',
  volcanico: 'Relieve volcánico',
}

export const nombreDePapel: Record<Papel, string> = {
  meseta: 'Meseta',
  interior: 'Interiores',
  reborde: 'Rebordes',
  depresion: 'Depresiones',
  exterior: 'Exteriores',
  volcanico: 'Volcánico',
}

export interface PropiedadesDeRelieve {
  nombre: string
  clase: Clase
  papel?: Papel
  cordillera?: string
  altura?: number
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

const unidadesMayores = (unidadesGeo as FeatureCollection).features

const contornosPorClase: Record<Clase, Feature<Geometry>[]> = {
  cordillera: (cordillerasGeo as FeatureCollection).features,
  sierra: (sierrasGeo as FeatureCollection).features,
  pico: (picosGeo as FeatureCollection).features,
  meseta: unidadesMayores.filter((contorno) => propiedadesDe(contorno).clase === 'meseta'),
  depresion: unidadesMayores.filter((contorno) => propiedadesDe(contorno).clase === 'depresion'),
}

const rios = (riosGeo as FeatureCollection).features

// Clases que se dibujan y se tocan en cada Alcance; lo que no se toca se ve en tenue.
const CLASES_DEL_MAPA: Record<AlcanceDeRelieve, Clase[]> = {
  'cordilleras-y-sierras': ['cordillera', 'sierra'],
  picos: ['pico'],
  'pertenencia-relieve': ['cordillera', 'pico'],
  'todo-relieve': ['cordillera', 'sierra', 'pico'],
  // La Meseta primero: es la mancha mayor y las demás se dibujan encima.
  unidades: ['meseta', 'depresion', 'cordillera'],
}

export function esDeRelieve(alcance: string): alcance is AlcanceDeRelieve {
  return alcance in CLASES_DEL_MAPA
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
    const { nombre, clase, papel, cordillera, altura } = propiedadesDe(contorno)
    const examinada = altura !== undefined && ALTURAS_EXAMINADAS.includes(id)
    return {
      id,
      nombre,
      nombreMostrado: nombre,
      alias: ALIAS[id] ?? [],
      vecinos: vecinosPorIndice[indice],
      clase,
      ...(papel && { papel }),
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
function catalogoDePertenencia(): Elemento[] {
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
    seEscribe: true,
  }
}

function alturasDe(picos: Elemento[]): Elemento[] {
  const alturas = ALTURAS_EXAMINADAS.map((id) => {
    const pico = picos.find((candidato) => candidato.id === id)
    if (!pico) throw new Error(`Altura examinada sin pico: ${id}`)
    return elementoDeAltura(pico, idDeAltura(pico.id))
  })
  // Una cifra no tiene vecinos en el mapa, y sin ellos su Pista se llena de nombres de pico: lo único
  // que se le parece son las otras tres cifras.
  return alturas.map((altura) => ({
    ...altura,
    vecinos: alturas.filter((otra) => otra.id !== altura.id).map((otra) => otra.id),
  }))
}

function catalogoDePicos(): Elemento[] {
  const picos = elementosDe(contornosPorClase.pico)
  return [...picos, ...alturasDe(picos)]
}

// Cada Elemento sabe qué debe estar Acertado antes de poder tocarse; las cordilleras no dependen de nada.
function catalogoDeTodo(): Elemento[] {
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
  const alturas = alturasDe(picos).map((altura) => ({ ...altura, desbloqueaCon: [picoDeAltura(altura.id)] }))
  return [...cordilleras, ...sierras, ...picos, ...alturas]
}

// Cada depresión queda encajada entre un reborde de la Meseta y una cordillera exterior, así que la rama
// se pregunta en ese orden; lo que no está aquí cuelga directamente de la Meseta.
const DESBLOQUEA_CON: Record<string, string[]> = {
  'depresion-del-ebro': ['sistema-iberico'],
  'depresion-del-guadalquivir': ['sierra-morena'],
  pirineos: ['depresion-del-ebro'],
  'montes-vascos': ['depresion-del-ebro'],
  'cordillera-costero-catalana': ['depresion-del-ebro'],
  'cordilleras-beticas': ['depresion-del-guadalquivir'],
}

function desbloqueaConDeUnidad({ id, papel }: Elemento, peninsulares: string[]): string[] {
  // Canarias no se define respecto a la Meseta, así que cierra la partida con la Península ya entera.
  if (papel === 'volcanico') return peninsulares
  return DESBLOQUEA_CON[id] ?? (papel === 'meseta' ? [] : ['meseta'])
}

function catalogoDeUnidades(): Elemento[] {
  const unidades = elementosDeClases(CLASES_DEL_MAPA.unidades)
  const peninsulares = unidades.filter(({ papel }) => papel !== 'volcanico').map(({ id }) => id)
  return unidades.map((elemento) => {
    const { papel } = elemento
    if (!papel) throw new Error(`${elemento.id} sin papel`)
    return {
      ...elemento,
      pregunta: etiquetaDePapel[papel],
      desbloqueaCon: desbloqueaConDeUnidad(elemento, peninsulares),
    }
  })
}

export function catalogoDeRelieve(alcance: AlcanceDeRelieve): Elemento[] {
  if (alcance === 'unidades') return catalogoDeUnidades()
  if (alcance === 'pertenencia-relieve') return catalogoDePertenencia()
  if (alcance === 'picos') return catalogoDePicos()
  if (alcance === 'todo-relieve') return catalogoDeTodo()
  return elementosDeClases(CLASES_DEL_MAPA[alcance])
}

// Elementos que se tocan en el mapa, cada clase con sus propios vecinos; en Pertenencia, Picos y Todo no
// coinciden con el catálogo de preguntas (Pertenencia pregunta sierras que no están en el mapa; Picos y
// Todo preguntan también las alturas, que no tienen forma propia).
export function tocablesDeRelieve(alcance: AlcanceDeRelieve): Elemento[] {
  if (alcance === 'pertenencia-relieve') {
    return CLASES_DEL_MAPA['pertenencia-relieve'].flatMap((clase) => elementosDe(contornosPorClase[clase]))
  }
  if (alcance === 'picos') return elementosDe(contornosPorClase.pico)
  if (alcance === 'todo-relieve') return elementosDeClases(CLASES_DEL_MAPA['todo-relieve'])
  return catalogoDeRelieve(alcance)
}

const contornosPorAlcance: Partial<Record<AlcanceDeRelieve, Feature<Geometry>[]>> = {}

export function contornosDeRelieve(alcance: AlcanceDeRelieve): Feature<Geometry>[] {
  return (contornosPorAlcance[alcance] ??= CLASES_DEL_MAPA[alcance].flatMap((clase) => contornosPorClase[clase]))
}

export function contextoDeRelieve(alcance: AlcanceDeRelieve, contorno: Feature<Geometry>): ContextoGeografico {
  const tenues = CLASES_DEL_MAPA[alcance].includes('cordillera') ? [] : contornosPorClase.cordillera
  return { contorno, tenues, rios }
}

// Id de la pregunta de Altura de un pico: distinto del id del propio pico, para que acertar uno y
// acertar el otro queden como dos entradas independientes en Acertados.
const PREFIJO_DE_ALTURA = 'altura-'

export function idDeAltura(idDelPico: string): string {
  return `${PREFIJO_DE_ALTURA}${idDelPico}`
}

export function esIdDeAltura(id: string): boolean {
  return id.startsWith(PREFIJO_DE_ALTURA)
}

// El pico al que le falta la cifra: es su forma la que se remarca y la que se rotula en el Repaso.
export function picoDeAltura(id: string): string {
  return id.slice(PREFIJO_DE_ALTURA.length)
}

export function textoDeAltura(altura: number): string {
  return alturaMostrada(altura)
}
