import { readFileSync, mkdirSync } from 'node:fs'
import { geoContains } from 'd3-geo'
import { descargar, distancia, douglasPeucker, elemento, escribir, largoDe, simplificar } from './geometria.mjs'

// Hidrografía del IGN por el WFS INSPIRE de IDEE, CC BY 4.0 (ADR-0004).
const WFS = 'https://servicios.idee.es/wfs-inspire/hidrografia'

// Capa «Vertientes hidrográficas» del Atlas Didáctico del IGN, CC BY 4.0 (ADR-0004).
const CAPA_VERTIENTES =
  'https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1314/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'

const TOLERANCIA_DE_RIOS = 0.004
const TOLERANCIA_DE_VERTIENTES = 0.015

const VERTIENTES = [
  { id: 'vertiente-cantabrica', nombre: 'Vertiente Cantábrica', enLaCapa: 'Vertiente Cantábrica' },
  { id: 'vertiente-atlantica', nombre: 'Vertiente Atlántica', enLaCapa: 'Vertiente Atlántica' },
  { id: 'vertiente-mediterranea', nombre: 'Vertiente Mediterránea', enLaCapa: 'Vertiente Mediterránea' },
]

// El nombre canónico es el de los apuntes; `enElIgn` son las formas exactas con las que el IGN rotula
// ese mismo cauce, y hay que darlas a mano porque el servicio no distingue el río de sus homónimos:
// buscar «Ter» devuelve el Tera y doscientos arroyos, y el Cigüela allí se escribe Gigüela.
const RIOS = [
  { id: 'ebro', nombre: 'Ebro', clase: 'rio-principal', vertiente: 'vertiente-mediterranea', enElIgn: ['Río Ebro', "L'Ebre/Río Ebro"] },
  { id: 'duero', nombre: 'Duero', clase: 'rio-principal', vertiente: 'vertiente-atlantica', enElIgn: ['Río Duero'] },
  { id: 'tajo', nombre: 'Tajo', clase: 'rio-principal', vertiente: 'vertiente-atlantica', enElIgn: ['Río Tajo'] },
  { id: 'guadiana', nombre: 'Guadiana', clase: 'rio-principal', vertiente: 'vertiente-atlantica', enElIgn: ['Río Guadiana'], desambiguacion: 'El Guadiana Menor no es este río: es un afluente del Guadalquivir' },
  { id: 'guadalquivir', nombre: 'Guadalquivir', clase: 'rio-principal', vertiente: 'vertiente-atlantica', enElIgn: ['Río Guadalquivir'] },
  { id: 'mino', nombre: 'Miño', clase: 'rio-principal', vertiente: 'vertiente-atlantica', enElIgn: ['Río Miño'] },

  { id: 'ter', nombre: 'Ter', clase: 'rio-propio', vertiente: 'vertiente-mediterranea', enElIgn: ['El Ter', 'Riu Ter'] },
  { id: 'llobregat', nombre: 'Llobregat', clase: 'rio-propio', vertiente: 'vertiente-mediterranea', enElIgn: ['Riu Llobregat', 'El Llobregat'] },
  { id: 'turia', nombre: 'Turia', clase: 'rio-propio', vertiente: 'vertiente-mediterranea', enElIgn: ['Río Turia', 'Río Turia o Guadalaviar'], alias: ['Guadalaviar'] },
  { id: 'jucar', nombre: 'Júcar', clase: 'rio-propio', vertiente: 'vertiente-mediterranea', enElIgn: ['Río Júcar', 'Riu Xúquer/Río Júcar'], alias: ['Xúquer'] },
  { id: 'segura', nombre: 'Segura', clase: 'rio-propio', vertiente: 'vertiente-mediterranea', enElIgn: ['Río Segura'] },
  { id: 'nalon', nombre: 'Nalón', clase: 'rio-propio', vertiente: 'vertiente-cantabrica', enElIgn: ['Río Nalón'] },
  { id: 'nervion', nombre: 'Nervión', clase: 'rio-propio', vertiente: 'vertiente-cantabrica', enElIgn: ['Río Nervión/Nerbioi Ibaia'], alias: ['Nerbioi'] },
  { id: 'bidasoa', nombre: 'Bidasoa', clase: 'rio-propio', vertiente: 'vertiente-cantabrica', enElIgn: ['Río Bidasoa'] },
  { id: 'tambre', nombre: 'Tambre', clase: 'rio-propio', vertiente: 'vertiente-atlantica', enElIgn: ['Río Tambre'] },
  { id: 'odiel', nombre: 'Odiel', clase: 'rio-propio', vertiente: 'vertiente-atlantica', enElIgn: ['Río Odiel'] },
  { id: 'tinto', nombre: 'Tinto', clase: 'rio-propio', vertiente: 'vertiente-atlantica', enElIgn: ['Río Tinto'] },

  { id: 'aragon', nombre: 'Aragón', clase: 'afluente', desembocaEn: 'ebro', enElIgn: ['Río Aragón'], desambiguacion: 'El Alagón no es este río: es un afluente del Tajo' },
  { id: 'gallego', nombre: 'Gállego', clase: 'afluente', desembocaEn: 'ebro', enElIgn: ['Río Gállego'] },
  { id: 'cinca', nombre: 'Cinca', clase: 'afluente', desembocaEn: 'segre', enElIgn: ['Río Cinca'] },
  { id: 'segre', nombre: 'Segre', clase: 'afluente', desembocaEn: 'ebro', enElIgn: ['Riu Segre', 'El Segre'] },
  { id: 'guadalope', nombre: 'Guadalope', clase: 'afluente', desembocaEn: 'ebro', enElIgn: ['Río Guadalope'] },
  { id: 'jalon', nombre: 'Jalón', clase: 'afluente', desembocaEn: 'ebro', enElIgn: ['Río Jalón'] },
  { id: 'huerva', nombre: 'Huerva', clase: 'afluente', desembocaEn: 'ebro', enElIgn: ['Río Huerva'] },
  { id: 'jiloca', nombre: 'Jiloca', clase: 'afluente', desembocaEn: 'jalon', enElIgn: ['Río Jiloca'] },

  { id: 'tormes', nombre: 'Tormes', clase: 'afluente', desembocaEn: 'duero', enElIgn: ['Río Tormes'] },
  { id: 'adaja', nombre: 'Adaja', clase: 'afluente', desembocaEn: 'duero', enElIgn: ['Río Adaja'] },
  { id: 'esla', nombre: 'Esla', clase: 'afluente', desembocaEn: 'duero', enElIgn: ['Río Esla'] },
  { id: 'pisuerga', nombre: 'Pisuerga', clase: 'afluente', desembocaEn: 'duero', enElIgn: ['Río Pisuerga'] },

  { id: 'almonte', nombre: 'Almonte', clase: 'afluente', desembocaEn: 'tajo', enElIgn: ['Río Almonte'] },
  { id: 'alagon', nombre: 'Alagón', clase: 'afluente', desembocaEn: 'tajo', enElIgn: ['Río Alagón'], desambiguacion: 'El Aragón no es este río: es un afluente del Ebro' },
  { id: 'jarama', nombre: 'Jarama', clase: 'afluente', desembocaEn: 'tajo', enElIgn: ['Río Jarama'] },
  { id: 'tietar', nombre: 'Tiétar', clase: 'afluente', desembocaEn: 'tajo', enElIgn: ['Río Tiétar'], fueraDeApuntes: true },

  { id: 'zujar', nombre: 'Zújar', clase: 'afluente', desembocaEn: 'guadiana', enElIgn: ['Río Zújar'] },
  { id: 'jabalon', nombre: 'Jabalón', clase: 'afluente', desembocaEn: 'guadiana', enElIgn: ['Río Jabalón'] },
  { id: 'ciguela', nombre: 'Cigüela', clase: 'afluente', desembocaEn: 'guadiana', enElIgn: ['Río Gigüela'], alias: ['Gigüela'], desambiguacion: 'El Záncara no es este río: desemboca en el Cigüela' },
  { id: 'zancara', nombre: 'Záncara', clase: 'afluente', desembocaEn: 'ciguela', enElIgn: ['Río Záncara'], desambiguacion: 'El Cigüela no es este río: es el que recoge al Záncara' },

  { id: 'genil', nombre: 'Genil', clase: 'afluente', desembocaEn: 'guadalquivir', enElIgn: ['Río Genil'] },
  { id: 'guadiana-menor', nombre: 'Guadiana Menor', clase: 'afluente', desembocaEn: 'guadalquivir', enElIgn: ['Río Guadiana Menor'], desambiguacion: 'El Guadiana no es este río: el Guadiana Menor es afluente del Guadalquivir' },
  { id: 'guadalimar', nombre: 'Guadalimar', clase: 'afluente', desembocaEn: 'guadalquivir', enElIgn: ['Río Guadalimar'] },

  { id: 'sil', nombre: 'Sil', clase: 'afluente', desembocaEn: 'mino', enElIgn: ['Río Sil'] },
]

const TAMANO_DE_PAGINA = 1000

function filtroPorNombre(nombre) {
  return `<fes:Filter xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:hy-p="http://inspire.ec.europa.eu/schemas/hy-p/4.0" xmlns:gn="http://inspire.ec.europa.eu/schemas/gn/4.0"><fes:PropertyIsEqualTo><fes:ValueReference>hy-p:geographicalName/gn:GeographicalName/gn:spelling/gn:SpellingOfName/gn:text</fes:ValueReference><fes:Literal>${nombre}</fes:Literal></fes:PropertyIsEqualTo></fes:Filter>`
}

async function paginaDe(nombre, desde) {
  const url = new URL(WFS)
  for (const [clave, valor] of Object.entries({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typenames: 'hy-p:Watercourse',
    srsname: 'EPSG:4326',
    count: String(TAMANO_DE_PAGINA),
    startindex: String(desde),
    filter: filtroPorNombre(nombre),
  })) {
    url.searchParams.set(clave, valor)
  }
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`«${nombre}» respondió ${respuesta.status} en el WFS de hidrografía`)
  return respuesta.text()
}

// El posList del WFS viene en lon lat pese a declarar EPSG:4326.
function lineasDe(xml) {
  return [...xml.matchAll(/<gml:posList[^>]*>([^<]*)<\/gml:posList>/g)]
    .map(([, crudo]) => {
      const numeros = crudo.trim().split(/\s+/).map(Number)
      const linea = []
      for (let i = 0; i < numeros.length; i += 2) linea.push([numeros[i], numeros[i + 1]])
      return linea
    })
    .filter((linea) => linea.length > 1)
}

// El servicio declara un `numberMatched` poco fiable, así que se pagina por lo que de verdad llega.
async function unaPasada(nombre) {
  const tramos = []
  for (let desde = 0; ; desde += TAMANO_DE_PAGINA) {
    const xml = await paginaDe(nombre, desde)
    const devueltos = Number(xml.match(/numberReturned="(\d+)"/)?.[1] ?? 0)
    tramos.push(...lineasDe(xml))
    if (devueltos < TAMANO_DE_PAGINA) return tramos
  }
}

const INTENTOS = 4

// El servicio se queda mudo a ratos y devuelve cero tramos para un nombre que sí existe.
async function tramosDe(nombre) {
  for (let intento = 1; intento <= INTENTOS; intento++) {
    const tramos = await unaPasada(nombre)
    if (tramos.length > 0) return tramos
    if (intento < INTENTOS) await new Promise((seguir) => setTimeout(seguir, intento * 2_000))
  }
  throw new Error(`El IGN ya no rotula ningún cauce como «${nombre}»`)
}

const PRECISION_DEL_NODO = 7

function nodoDe([lon, lat]) {
  return `${lon.toFixed(PRECISION_DEL_NODO)},${lat.toFixed(PRECISION_DEL_NODO)}`
}

function grafoDe(tramos) {
  const nodos = new Map()
  tramos.forEach((linea, indice) => {
    const largo = largoDe(linea)
    const extremos = [nodoDe(linea[0]), nodoDe(linea.at(-1))]
    extremos.forEach((nodo, lado) => {
      if (!nodos.has(nodo)) nodos.set(nodo, [])
      nodos.get(nodo).push({ indice, largo, otro: extremos[1 - lado], invertido: lado === 1 })
    })
  })
  return nodos
}

function masLejanoDesde(nodos, origen) {
  const distancias = new Map([[origen, 0]])
  const desde = new Map()
  const porVisitar = new Set(nodos.keys())
  while (porVisitar.size > 0) {
    let actual = null
    for (const nodo of porVisitar) {
      if (!distancias.has(nodo)) continue
      if (actual === null || distancias.get(nodo) < distancias.get(actual)) actual = nodo
    }
    if (actual === null) break
    porVisitar.delete(actual)
    for (const arista of nodos.get(actual)) {
      const candidata = distancias.get(actual) + arista.largo
      if (!distancias.has(arista.otro) || candidata < distancias.get(arista.otro)) {
        distancias.set(arista.otro, candidata)
        desde.set(arista.otro, { nodo: actual, arista })
      }
    }
  }
  let lejano = origen
  for (const [nodo, recorrido] of distancias) if (recorrido > distancias.get(lejano)) lejano = nodo
  return { lejano, desde }
}

function componentesDe(tramos) {
  const padre = new Map()
  const raiz = (nodo) => {
    while (padre.get(nodo) !== nodo) {
      padre.set(nodo, padre.get(padre.get(nodo)))
      nodo = padre.get(nodo)
    }
    return nodo
  }
  for (const linea of tramos) {
    for (const punto of [linea[0], linea.at(-1)]) if (!padre.has(nodoDe(punto))) padre.set(nodoDe(punto), nodoDe(punto))
  }
  for (const linea of tramos) {
    const [uno, otro] = [raiz(nodoDe(linea[0])), raiz(nodoDe(linea.at(-1)))]
    if (uno !== otro) padre.set(uno, otro)
  }
  const grupos = new Map()
  for (const linea of tramos) {
    const grupo = raiz(nodoDe(linea[0]))
    grupos.set(grupo, [...(grupos.get(grupo) ?? []), linea])
  }
  return [...grupos.values()]
}

// Dentro de una componente, el cauce es el camino más largo entre dos de sus extremos.
function caminoMasLargo(tramos) {
  const nodos = grafoDe(tramos)
  const { lejano: unExtremo } = masLejanoDesde(nodos, nodoDe(tramos[0][0]))
  const { lejano: otroExtremo, desde } = masLejanoDesde(nodos, unExtremo)
  const camino = []
  for (let nodo = otroExtremo; desde.has(nodo); nodo = desde.get(nodo).nodo) camino.unshift(desde.get(nodo).arista)
  const linea = []
  for (const { indice, invertido } of camino) {
    const puntos = invertido ? [...tramos[indice]].reverse() : tramos[indice]
    linea.push(...(linea.length > 0 ? puntos.slice(1) : puntos))
  }
  return linea
}

// Los embalses parten el cauce en componentes sueltas, hasta un centenar en el Tajo. Se cose la más
// larga con las que quedan a tiro y se descartan las que no: son brazos y acequias del mismo nombre.
const PUENTE_MAXIMO = 0.12

function cauceDe(tramos) {
  const trozos = componentesDe(tramos)
    .map(caminoMasLargo)
    .sort((uno, otro) => largoDe(otro) - largoDe(uno))
  let cauce = trozos.shift()
  let puentes = 0
  for (;;) {
    let mejor = null
    trozos.forEach((trozo, indice) => {
      for (const [extremo, alFinal] of [[cauce.at(-1), true], [cauce[0], false]]) {
        for (const [suyo, invertido] of [[trozo[0], false], [trozo.at(-1), true]]) {
          const salto = distancia(extremo, suyo)
          if (mejor === null || salto < mejor.salto) mejor = { indice, alFinal, invertido, salto }
        }
      }
    })
    if (mejor === null || mejor.salto > PUENTE_MAXIMO) break
    const [trozo] = trozos.splice(mejor.indice, 1)
    const puesto = mejor.invertido ? [...trozo].reverse() : trozo
    cauce = mejor.alFinal ? [...cauce, ...puesto] : [...puesto.reverse(), ...cauce]
    puentes += 1
  }
  return { cauce, puentes, sueltos: trozos.length }
}

function comprobarContinuidad(id, linea) {
  for (let i = 1; i < linea.length; i++) {
    if (distancia(linea[i], linea[i - 1]) > PUENTE_MAXIMO) {
      throw new Error(`El cauce de ${id} tiene un salto de ${distancia(linea[i], linea[i - 1]).toFixed(3)}° en el punto ${i}`)
    }
  }
}

const RADIO_DE_SONDEO = 0.05
const RUMBOS = 12

// La desembocadura de un Río principal o propio es el extremo que da al mar: el que tiene agua abierta
// alrededor. Los de tierra adentro quedan rodeados por España o por el país vecino.
function daAlMar(punto, tierras) {
  for (let rumbo = 0; rumbo < RUMBOS; rumbo++) {
    const angulo = (rumbo / RUMBOS) * 2 * Math.PI
    const sonda = [punto[0] + RADIO_DE_SONDEO * Math.cos(angulo), punto[1] + RADIO_DE_SONDEO * Math.sin(angulo)]
    if (!tierras.some((tierra) => geoContains(tierra, sonda))) return true
  }
  return false
}

function haciaLaDesembocadura(linea, esDesembocadura) {
  if (esDesembocadura(linea.at(-1))) return linea
  if (esDesembocadura(linea[0])) return [...linea].reverse()
  throw new Error('Ningún extremo del cauce parece la desembocadura')
}

function vertientesDe(capa) {
  return VERTIENTES.map(({ id, nombre, enLaCapa }) => {
    const rasgo = capa.features.find(({ properties }) => properties.Vertiente === enLaCapa)
    if (!rasgo) throw new Error(`La capa del IGN ya no trae «${enLaCapa}»`)
    return elemento(
      id,
      { nombre, clase: 'vertiente' },
      simplificar(rasgo.geometry, TOLERANCIA_DE_VERTIENTES, true),
    )
  })
}

const capaDeVertientes = await descargar(CAPA_VERTIENTES)
const vertientes = vertientesDe(capaDeVertientes)

const paisesVecinos = JSON.parse(readFileSync('src/datos/contexto-geografico.json', 'utf8')).features
const tierras = [...vertientes, ...paisesVecinos]

const cauces = new Map()
for (const rio of RIOS) {
  const tramos = []
  for (const nombre of rio.enElIgn) tramos.push(...(await tramosDe(nombre)))
  const { cauce, puentes, sueltos } = cauceDe(tramos)
  comprobarContinuidad(rio.id, cauce)
  cauces.set(rio.id, cauce)
  console.log(`${rio.nombre}: ${tramos.length} tramos → ${cauce.length} puntos, ${puentes} embalses cruzados, ${sueltos} trozos descartados`)
}

const CONFLUENCIA = 0.05

// Un afluente termina donde toca al río que lo recoge. No basta el extremo más cercano: el Záncara
// nace a tres kilómetros del nacimiento del Cigüela, así que entre dos extremos que lo tocan gana el
// que cae más abajo en el receptor, que ya viene orientado hacia su propia desembocadura.
function haciaElReceptor(id, cauce, receptor) {
  const encuentro = (punto) =>
    receptor.reduce(
      (mejor, otro, indice) => (distancia(punto, otro) < mejor.separacion ? { separacion: distancia(punto, otro), indice } : mejor),
      { separacion: Infinity, indice: -1 },
    )
  const candidatos = [
    { encuentro: encuentro(cauce.at(-1)), derecho: true },
    { encuentro: encuentro(cauce[0]), derecho: false },
  ].filter(({ encuentro: { separacion } }) => separacion < CONFLUENCIA)
  if (candidatos.length === 0) throw new Error(`El cauce de ${id} no llega a tocar al río que lo recoge`)
  const desembocadura = candidatos.reduce((mejor, cual) => (cual.encuentro.indice > mejor.encuentro.indice ? cual : mejor))
  return desembocadura.derecho ? cauce : [...cauce].reverse()
}

// Un afluente se orienta contra su receptor, así que los receptores van antes: primero los que llegan
// al mar, después los afluentes de esos, y así hasta el Jiloca y el Záncara, que cuelgan de un afluente.
const orientados = new Set()
while (orientados.size < RIOS.length) {
  const toca = RIOS.filter((rio) => !orientados.has(rio.id) && (!rio.desembocaEn || orientados.has(rio.desembocaEn)))
  if (toca.length === 0) throw new Error('Hay afluentes que se recogen en círculo')
  for (const rio of toca) {
    const cauce = cauces.get(rio.id)
    cauces.set(
      rio.id,
      rio.desembocaEn
        ? haciaElReceptor(rio.id, cauce, cauces.get(rio.desembocaEn))
        : haciaLaDesembocadura(cauce, (punto) => daAlMar(punto, tierras)),
    )
    orientados.add(rio.id)
  }
}

const rios = RIOS.map(({ id, nombre, clase, vertiente, desembocaEn, alias, desambiguacion, fueraDeApuntes }) =>
  elemento(
    id,
    {
      nombre,
      clase,
      ...(vertiente && { vertiente }),
      ...(desembocaEn && { desembocaEn }),
      ...(alias && { alias }),
      ...(desambiguacion && { desambiguacion }),
      ...(fueraDeApuntes && { fueraDeApuntes }),
    },
    { type: 'LineString', coordinates: douglasPeucker(cauces.get(id), TOLERANCIA_DE_RIOS) },
  ),
)

mkdirSync('src/datos', { recursive: true })
escribir('rios', rios)
escribir('vertientes', vertientes)
