import { readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { merge } from 'topojson-client'
import { distancia, elemento, escribir, largoDe, simplificar } from './geometria.mjs'

// Nomenclátor Geográfico Básico de España del IGN, CC BY 4.0 (ADR-0010).
const WFS = 'https://www.ign.es/wfs-inspire/ngbe'

const TOLERANCIA_DE_TRAMOS = 0.015

// Gibraltar no pertenece a ninguna provincia ni comunidad, y la silueta que dibuja la aplicación lo
// deja fuera; los arcos se recortan de esa misma silueta, así que aquí se quita igual.
const GIBRALTAR_COMUNIDADES = '20'

const TRAMOS = [
  { id: 'costa-cantabrica', nombre: 'Costa Cantábrica', provincias: ['20', '48', '39', '33', '27'] },
  { id: 'costa-gallega', nombre: 'Costa Gallega', provincias: ['15', '36'] },
  { id: 'costa-de-la-luz', nombre: 'Costa de la Luz', provincias: ['21', '11'] },
  { id: 'costa-levantina', nombre: 'Costa Levantina', provincias: ['29', '18', '04', '30', '03', '46', '12'] },
  { id: 'costa-catalana', nombre: 'Costa Catalana', provincias: ['43', '08', '17'] },
]

// El Nombre oficial es el del listado del alumno; `enElNomenclator` es la grafía con la que el IGN
// rotula ese mismo saliente, y las dos no siempre coinciden: el Nomenclátor trae los nombres en la
// lengua del sitio, así que el Cabo de Creus es allí el Cap de Creus.
const CABOS = [
  { id: 'cabo-machichaco', nombre: 'Cabo Machichaco', tramo: 'costa-cantabrica', enElNomenclator: 'Cabo Matxitxako', alias: ['Matxitxako'] },
  { id: 'cabo-de-ajo', nombre: 'Cabo de Ajo', tramo: 'costa-cantabrica', enElNomenclator: 'Cabo de Ajo' },
  { id: 'cabo-de-penas', nombre: 'Cabo de Peñas', tramo: 'costa-cantabrica', enElNomenclator: 'Cabo de Peñas' },

  { id: 'punta-de-estaca-de-bares', nombre: 'Punta de Estaca de Bares', tramo: 'costa-gallega', enElNomenclator: 'Punta da Estaca de Bares' },
  { id: 'cabo-ortegal', nombre: 'Cabo Ortegal', tramo: 'costa-gallega', enElNomenclator: 'Cabo Ortegal' },
  { id: 'cabo-de-finisterre', nombre: 'Cabo de Finisterre', tramo: 'costa-gallega', enElNomenclator: 'Cabo Fisterra', alias: ['Fisterra'] },

  { id: 'cabo-de-trafalgar', nombre: 'Cabo de Trafalgar', tramo: 'costa-de-la-luz', enElNomenclator: 'Cabo de Trafalgar' },
  { id: 'punta-de-tarifa', nombre: 'Punta de Tarifa', tramo: 'costa-de-la-luz', enElNomenclator: 'Punta de Tarifa', desambiguacion: 'El Estrecho de Gibraltar no es esta punta: es el arco de costa que arranca en ella' },

  { id: 'cabo-de-gata', nombre: 'Cabo de Gata', tramo: 'costa-levantina', enElNomenclator: 'Cabo de Gata' },
  { id: 'cabo-de-palos', nombre: 'Cabo de Palos', tramo: 'costa-levantina', enElNomenclator: 'Cabo de Palos' },
  { id: 'cabo-de-san-antonio', nombre: 'Cabo de San Antonio', tramo: 'costa-levantina', enElNomenclator: 'Cap de Sant Antoni', desambiguacion: 'El Cabo de la Nao no es este: es el siguiente cabo hacia el sur' },
  { id: 'cabo-de-la-nao', nombre: 'Cabo de la Nao', tramo: 'costa-levantina', enElNomenclator: 'Cap de la Nau', desambiguacion: 'El Cabo de San Antonio no es este: es el que cierra el Golfo de Valencia por el sur' },

  { id: 'cabo-de-creus', nombre: 'Cabo de Creus', tramo: 'costa-catalana', enElNomenclator: 'Cap de Creus', desambiguacion: 'El Golfo de Rosas no es este cabo: es el arco de costa que el cabo cierra por el norte' },
]

// Límites de arco que no son ninguno de los 20 Elementos, así que van a mano (ADR-0010).
const LIMITES = {
  bidasoa: { nombre: 'la desembocadura del Bidasoa', punto: [-1.7936, 43.3836] },
  guadiana: { nombre: 'la desembocadura del Guadiana', punto: [-7.4083, 37.1733] },
  'punta-carnero': { nombre: 'Punta Carnero', punto: [-5.4425, 36.0833] },
  'punta-entinas': { nombre: 'Punta Entinas', punto: [-2.7276, 36.679] },
  'delta-del-ebro': { nombre: 'el delta del Ebro', punto: [0.8697, 40.7186] },
  'cabo-de-salou': { nombre: 'el cabo de Salou', punto: [1.1614, 41.0519] },
  'punta-del-montgo': { nombre: 'la punta del Montgó', punto: [3.171, 42.1214] },
}

// Cada Golfo y el Estrecho son el trozo de costa entre sus dos límites, que es un Cabo del listado o
// una entrada de LIMITES. El Golfo de Vizcaya acaba en Estaca de Bares y el de Valencia en el delta
// del Ebro, los dos ya en el Tramo siguiente: la pertenencia es dato declarado, no geometría.
const ARCOS = [
  { id: 'golfo-de-vizcaya', nombre: 'Golfo de Vizcaya', clase: 'golfo', tramo: 'costa-cantabrica', entre: ['bidasoa', 'punta-de-estaca-de-bares'] },
  { id: 'golfo-de-cadiz', nombre: 'Golfo de Cádiz', clase: 'golfo', tramo: 'costa-de-la-luz', entre: ['guadiana', 'punta-de-tarifa'] },
  { id: 'estrecho-de-gibraltar', nombre: 'Estrecho de Gibraltar', clase: 'estrecho', tramo: 'costa-de-la-luz', entre: ['punta-de-tarifa', 'punta-carnero'], desambiguacion: 'La Punta de Tarifa no es el estrecho: es el cabo donde el estrecho arranca' },
  { id: 'golfo-de-almeria', nombre: 'Golfo de Almería', clase: 'golfo', tramo: 'costa-levantina', entre: ['punta-entinas', 'cabo-de-gata'] },
  { id: 'golfo-de-valencia', nombre: 'Golfo de Valencia', clase: 'golfo', tramo: 'costa-levantina', entre: ['cabo-de-san-antonio', 'delta-del-ebro'] },
  { id: 'golfo-de-san-jorge', nombre: 'Golfo de San Jorge', clase: 'golfo', tramo: 'costa-catalana', entre: ['delta-del-ebro', 'cabo-de-salou'], alias: ['Sant Jordi'] },
  { id: 'golfo-de-rosas', nombre: 'Golfo de Rosas', clase: 'golfo', tramo: 'costa-catalana', entre: ['cabo-de-creus', 'punta-del-montgo'], alias: ['Roses'], desambiguacion: 'El Cabo de Creus no es el golfo: es el cabo que lo cierra por el norte' },
]

const require = createRequire(import.meta.url)

function topologiaDe(fichero) {
  return JSON.parse(readFileSync(require.resolve(`es-atlas/es/${fichero}.json`), 'utf8'))
}

const RUTA_DEL_NOMBRE = 'gn:name/gn:GeographicalName/gn:spelling/gn:SpellingOfName/gn:text'

// El servicio deja sin contestar la mayoría de las búsquedas por igualdad, y las pocas que contesta
// solo comparan la primera grafía del lugar: el Cabo de Peñas también se llama El Cabu Peñes y por
// ese nombre no vuelve. La búsqueda por parecido sí es fiable, así que la igualdad se comprueba aquí.
function filtroPorParecido(nombre) {
  return `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gn="http://inspire.ec.europa.eu/schemas/gn/4.0"><fes:PropertyIsLike wildCard="%" singleChar="_" escapeChar="!"><fes:ValueReference>${RUTA_DEL_NOMBRE}</fes:ValueReference><fes:Literal>%${nombre}%</fes:Literal></fes:PropertyIsLike></fes:Filter>`
}

async function lugaresParecidosA(nombre) {
  const url = new URL(WFS)
  for (const [clave, valor] of Object.entries({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typenames: 'gn:NamedPlace',
    srsname: 'EPSG:4326',
    count: '200',
    filter: filtroPorParecido(nombre),
  })) {
    url.searchParams.set(clave, valor)
  }
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`«${nombre}» respondió ${respuesta.status} en el Nomenclátor`)
  const xml = await respuesta.text()
  return xml.split('<wfs:member>').slice(1).map((lugar) => ({
    grafias: [...lugar.matchAll(/<gn:text>([^<]*)<\/gn:text>/g)].map(([, grafia]) => grafia),
    tipo: lugar.match(/<gmd:LocalisedCharacterString[^>]*>([^<]*)</)?.[1],
    forma: lugar.match(/<gn:geometry>[\s\S]*?<gml:(\w+) gml:id/)?.[1],
    posicion: lugar.match(/<gml:pos>([^<]*)<\/gml:pos>/)?.[1],
  }))
}

// El Nomenclátor mete cabos y puntas en la misma categoría, que es la razón por la que las dos Puntas
// del listado se juegan como Cabos (ADR-0010).
const SALIENTE = 'Saliente costero'

async function puntoDelCabo({ nombre, enElNomenclator }) {
  const parecidos = await lugaresParecidosA(enElNomenclator)
  const suyos = parecidos.filter((lugar) => lugar.grafias.includes(enElNomenclator) && lugar.tipo === SALIENTE)
  if (suyos.length === 0) throw new Error(`El Nomenclátor ya no trae ningún ${SALIENTE.toLowerCase()} llamado «${enElNomenclator}», que es ${nombre}`)
  if (suyos.length > 1) throw new Error(`El Nomenclátor trae ${suyos.length} lugares llamados «${enElNomenclator}» en ${SALIENTE}: ${nombre} ha quedado ambiguo`)
  const [suyo] = suyos
  if (suyo.forma !== 'Point') throw new Error(`«${enElNomenclator}» ya no vuelve como punto sino como ${suyo.forma}`)
  return suyo.posicion.trim().split(/\s+/).map(Number)
}

// La silueta que recorta los arcos es la misma que dibuja `siluetaDeEspana()`, sin simplificar: un
// arco que no cayera sobre la línea que se ve dejaría al alumno tocando donde no hay costa.
function anilloDeLaPeninsula() {
  const topologia = topologiaDe('autonomous_regions')
  const comunidades = topologia.objects.autonomous_regions.geometries.filter(
    (geometria) => geometria.id !== GIBRALTAR_COMUNIDADES,
  )
  const silueta = merge(topologia, comunidades)
  const anillos = silueta.coordinates.map(([exterior]) => exterior)
  const mayor = anillos.reduce((uno, otro) => (otro.length > uno.length ? otro : uno))
  return mayor.slice(0, -1)
}

const SEPARACION_MAXIMA = 0.05

function verticeMasCercano(anillo, { nombre, punto }) {
  const cerca = anillo.reduce((mejor, vertice, indice) => {
    const separacion = distancia(punto, vertice)
    return separacion < mejor.separacion ? { separacion, indice } : mejor
  }, { separacion: Infinity, indice: -1 })
  if (cerca.separacion > SEPARACION_MAXIMA) {
    throw new Error(`${nombre} cae a ${(cerca.separacion * 111).toFixed(0)} km de la costa que dibuja la silueta`)
  }
  return cerca
}

// Un Golfo es el lado corto de la costa entre sus dos límites: el largo sería la vuelta al país.
function arcoEntre(anillo, desde, hasta) {
  const recorrer = (paso) => {
    const linea = []
    for (let indice = desde; ; indice = (indice + paso + anillo.length) % anillo.length) {
      linea.push(anillo[indice])
      if (indice === hasta) return linea
    }
  }
  const [adelante, atras] = [recorrer(1), recorrer(-1)]
  return largoDe(adelante) <= largoDe(atras) ? adelante : atras
}

// Un arco de tres rectas no se lee como un golfo. Los dos umbrales miden lo mismo por los dos lados:
// que la silueta siga teniendo resolución para dibujar este trozo de costa.
const VERTICES_MINIMOS = 6
const SALTO_MAXIMO = 0.25

function comprobarArco(id, linea) {
  if (linea.length < VERTICES_MINIMOS) throw new Error(`El arco de ${id} sale con ${linea.length} vértices y se leería como rectas`)
  for (let i = 1; i < linea.length; i++) {
    if (distancia(linea[i], linea[i - 1]) > SALTO_MAXIMO) {
      throw new Error(`El arco de ${id} salta ${(distancia(linea[i], linea[i - 1]) * 111).toFixed(0)} km en el punto ${i}`)
    }
  }
}

const provinciasTopo = topologiaDe('provinces')

function manchaDelTramo({ id, provincias }) {
  const suyas = provinciasTopo.objects.provinces.geometries.filter((geometria) => provincias.includes(geometria.id))
  if (suyas.length !== provincias.length) {
    throw new Error(`${id} pide ${provincias.length} provincias y es-atlas solo trae ${suyas.length}`)
  }
  return simplificar(merge(provinciasTopo, suyas), TOLERANCIA_DE_TRAMOS)
}

const tramos = TRAMOS.map((tramo) =>
  elemento(tramo.id, { nombre: tramo.nombre, clase: 'tramo-de-costa' }, manchaDelTramo(tramo)),
)
console.log(`${tramos.length} tramos de costa`)

const puntos = new Map()
for (const cabo of CABOS) {
  puntos.set(cabo.id, await puntoDelCabo(cabo))
  console.log(`${cabo.nombre}: «${cabo.enElNomenclator}» en ${puntos.get(cabo.id).map((grado) => grado.toFixed(4)).join(', ')}`)
}

const cabos = CABOS.map(({ id, nombre, tramo, alias, desambiguacion }) =>
  elemento(
    id,
    { nombre, clase: 'cabo', tramo, ...(alias && { alias }), ...(desambiguacion && { desambiguacion }) },
    { type: 'Point', coordinates: puntos.get(id) },
  ),
)

const anillo = anilloDeLaPeninsula()

function limite(cual) {
  const cabo = CABOS.find(({ id }) => id === cual)
  if (cabo) return { nombre: cabo.nombre, punto: puntos.get(cual) }
  if (!LIMITES[cual]) throw new Error(`El arco pide el límite «${cual}», que no es un Cabo ni está declarado`)
  return LIMITES[cual]
}

const arcos = ARCOS.map(({ id, nombre, clase, tramo, alias, desambiguacion, entre: [uno, otro] }) => {
  const cortes = [limite(uno), limite(otro)].map((cual) => ({ ...cual, ...verticeMasCercano(anillo, cual) }))
  const linea = arcoEntre(anillo, cortes[0].indice, cortes[1].indice)
  comprobarArco(id, linea)
  const entre = cortes.map(({ nombre: donde, separacion }) => `${donde} (a ${(separacion * 111).toFixed(1)} km)`)
  console.log(`${nombre}: ${linea.length} vértices entre ${entre[0]} y ${entre[1]}`)
  return elemento(
    id,
    { nombre, clase, tramo, ...(alias && { alias }), ...(desambiguacion && { desambiguacion }) },
    { type: 'LineString', coordinates: linea },
  )
})

mkdirSync('src/datos', { recursive: true })
escribir('costas', [...tramos, ...cabos, ...arcos])
