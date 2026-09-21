import { readFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature, merge } from 'topojson-client'
import areaDe from '@turf/area'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import buffer from '@turf/buffer'
import difference from '@turf/difference'
import { featureCollection } from '@turf/helpers'
import intersect from '@turf/intersect'
import { distancia, elemento, escribir, largoDe, orientada } from './geometria.mjs'

// Nomenclátor Geográfico Básico de España del IGN, CC BY 4.0 (ADR-0010).
const WFS = 'https://www.ign.es/wfs-inspire/ngbe'

// Gibraltar no pertenece a ninguna provincia ni comunidad, y la silueta que dibuja la aplicación lo
// deja fuera; los arcos se recortan de esa misma silueta, así que aquí se quita igual.
const GIBRALTAR_COMUNIDADES = '20'

// ISO 3166-1 numérico en world-atlas.
const MARRUECOS = '504'
const COSTAS_DE_FUERA = { francia: '250' }

// El Nombre oficial es el del listado del alumno; `enElNomenclator` es la grafía con la que el IGN
// rotula ese mismo saliente, y las dos no siempre coinciden: el Nomenclátor trae los nombres en la
// lengua del sitio, así que el Cabo de Creus es allí el Cap de Creus. Los que quedan fuera de España
// no están en el Nomenclátor y traen `punto` a mano.
const CABOS = [
  { id: 'cabo-machichaco', nombre: 'Cabo Machichaco', enElNomenclator: 'Cabo Matxitxako', alias: ['Matxitxako'] },
  { id: 'cabo-de-ajo', nombre: 'Cabo de Ajo', enElNomenclator: 'Cabo de Ajo' },
  { id: 'cabo-de-penas', nombre: 'Cabo de Peñas', enElNomenclator: 'Cabo de Peñas' },

  { id: 'punta-de-estaca-de-bares', nombre: 'Punta de Estaca de Bares', enElNomenclator: 'Punta da Estaca de Bares' },
  { id: 'cabo-ortegal', nombre: 'Cabo Ortegal', enElNomenclator: 'Cabo Ortegal' },
  { id: 'cabo-tourinan', nombre: 'Cabo Touriñán', enElNomenclator: 'Cabo Touriñán' },
  { id: 'cabo-de-finisterre', nombre: 'Cabo de Finisterre', enElNomenclator: 'Cabo Fisterra', alias: ['Fisterra'] },

  { id: 'cabo-da-roca', nombre: 'Cabo da Roca', punto: [-9.4989, 38.7804] },
  { id: 'cabo-de-san-vicente', nombre: 'Cabo de San Vicente', punto: [-8.9965, 37.0226] },

  { id: 'cabo-de-trafalgar', nombre: 'Cabo de Trafalgar', enElNomenclator: 'Cabo de Trafalgar' },
  { id: 'punta-de-tarifa', nombre: 'Punta de Tarifa', enElNomenclator: 'Punta de Tarifa', desambiguacion: 'El Estrecho de Gibraltar no es esta punta: es el mar que la baña, y la punta es su parte más angosta' },
  { id: 'punta-de-europa', nombre: 'Punta de Europa', punto: [-5.3456, 36.1097] },

  { id: 'cabo-de-gata', nombre: 'Cabo de Gata', enElNomenclator: 'Cabo de Gata' },
  { id: 'cabo-de-palos', nombre: 'Cabo de Palos', enElNomenclator: 'Cabo de Palos' },
  { id: 'cabo-de-la-nao', nombre: 'Cabo de la Nao', enElNomenclator: 'Cap de la Nau' },
  { id: 'cabo-de-tortosa', nombre: 'Cabo de Tortosa', enElNomenclator: 'Cap de Tortosa' },

  { id: 'cabo-de-begur', nombre: 'Cabo de Begur', enElNomenclator: 'Cap de Begur' },

  { id: 'cabo-de-creus', nombre: 'Cabo de Creus', enElNomenclator: 'Cap de Creus', desambiguacion: 'El Golfo de Rosas no es este cabo: es el arco de costa que el cabo cierra por el norte' },
]

// Límites de arco que no son ningún Elemento, así que van a mano (ADR-0010).
const LIMITES = {
  'punta-carnero': { nombre: 'Punta Carnero', punto: [-5.4425, 36.0833] },
  'punta-camarinal': { nombre: 'Punta Camarinal', punto: [-5.8106, 36.0847] },
  'punta-entinas': { nombre: 'Punta Entinas', punto: [-2.7276, 36.679] },
  'cabo-de-salou': { nombre: 'el cabo de Salou', punto: [1.1614, 41.0519] },
  'punta-del-montgo': { nombre: 'la punta del Montgó', punto: [3.171, 42.1214] },
  cerbere: { nombre: 'la frontera en Cerbère', punto: [3.1667, 42.4431] },
  'cabo-sicie': { nombre: 'el cabo Sicié, junto a Tolón', punto: [5.8625, 43.0503] },
  'punta-de-louro': { nombre: 'la Punta de Louro', punto: [-9.0833, 42.7501] },
  'punta-de-aguieira-en-muros': { nombre: 'la Punta de Aguieira, en Muros', punto: [-8.9745, 42.7445] },
  'punta-falcoeiro': { nombre: 'la Punta Falcoeiro', punto: [-9.0427, 42.5175] },
  'punta-de-aguieira-en-o-grove': { nombre: 'la Punta de Aguieira, en O Grove', punto: [-8.9411, 42.4651] },
  'punta-de-cabicastro': { nombre: 'la Punta de Cabicastro', punto: [-8.8388, 42.3845] },
  'punta-couso': { nombre: 'la Punta Couso', punto: [-8.8541, 42.3093] },
  'cabo-home': { nombre: 'el Cabo Home', punto: [-8.8739, 42.2543] },
  'cabo-silleiro': { nombre: 'el Cabo Silleiro', punto: [-8.9005, 42.1123] },
  'punta-candor': { nombre: 'la Punta Candor', punto: [-6.3949, 36.6359] },
  'punta-de-san-felipe': { nombre: 'la Punta de San Felipe', punto: [-6.2796, 36.5431] },
  'encanizadas-norte': { nombre: 'la orilla norte de las Encañizadas', punto: [-0.753, 37.7887] },
  'encanizadas-sur': { nombre: 'la orilla sur de las Encañizadas', punto: [-0.7575, 37.7806] },
}

// El trozo de costa entre los dos límites de cada uno, que es un Cabo del listado o una entrada de
// LIMITES. De ahí nace la mancha de mar de un Golfo, y en el Estrecho es todavía lo que se dibuja.
// El Golfo de León baña Francia, así que su arco sale de la costa francesa y no de la silueta; el
// Cabo de Creus que lo abre queda en España, fuera de ese arco, y por eso se declara.
const ARCOS = [
  // El Estrecho empieza en Punta Camarinal y no en Tarifa. Tarifa es lo más angosto del paso, no su
  // borde: el límite occidental es la línea de Camarinal a la orilla africana de enfrente. Mientras
  // el Estrecho fue una línea que arrancaba en Tarifa daba igual; como mancha, empezarlo ahí lo deja
  // en 186 km² y once píxeles, que es menos que el Golfo más pequeño y poco más que un Cabo.
  { id: 'estrecho-de-gibraltar', nombre: 'Estrecho de Gibraltar', clase: 'estrecho', entre: ['punta-camarinal', 'punta-carnero'], desambiguacion: 'La Punta de Tarifa no es el estrecho: es el cabo de su parte más angosta' },
  { id: 'golfo-de-almeria', nombre: 'Golfo de Almería', clase: 'golfo', entre: ['punta-entinas', 'cabo-de-gata'] },
  { id: 'golfo-de-mazarron', nombre: 'Golfo de Mazarrón', clase: 'golfo', entre: ['cabo-de-gata', 'cabo-de-palos'] },
  { id: 'golfo-de-valencia', nombre: 'Golfo de Valencia', clase: 'golfo', entre: ['cabo-de-la-nao', 'cabo-de-tortosa'] },
  { id: 'golfo-de-san-jorge', nombre: 'Golfo de San Jorge', clase: 'golfo', entre: ['cabo-de-tortosa', 'cabo-de-salou'], alias: ['Sant Jordi'] },
  { id: 'golfo-de-rosas', nombre: 'Golfo de Rosas', clase: 'golfo', entre: ['cabo-de-creus', 'punta-del-montgo'], alias: ['Roses'], desambiguacion: 'El Cabo de Creus no es el golfo: es el cabo que lo cierra por el norte' },
  { id: 'golfo-de-leon', nombre: 'Golfo de León', clase: 'golfo', entre: ['cerbere', 'cabo-sicie'], costa: 'francia', cabos: ['cabo-de-creus'] },
]

// Un Entrante es mar casi cerrado por la tierra: ría, bahía o laguna. La banda de 40 km de los Golfos
// se lo comería entero y se saldría a mar abierto, así que su agua es la que queda entre la costa y la
// recta que cruza su boca. Los límites de la boca salen del Nomenclátor, salvo las Encañizadas, que
// son vértices de la propia silueta. La Ría de Villaviciosa no entra en la silueta, y la de Bilbao y
// la Bahía de Santander cerradas por su boca se quedan en migas: las tres son un disco de mar en su
// desembocadura, que en Santander es la península de la Magdalena.
const ENTRANTES = [
  { id: 'ria-de-muros-y-noia', nombre: 'Ría de Muros y Noia', clase: 'ria', boca: ['punta-de-louro', 'punta-de-aguieira-en-muros'], alias: ['Muros e Noia'] },
  { id: 'ria-de-arousa', nombre: 'Ría de Arousa', clase: 'ria', boca: ['punta-falcoeiro', 'punta-de-aguieira-en-o-grove'], alias: ['Arosa'] },
  { id: 'ria-de-pontevedra', nombre: 'Ría de Pontevedra', clase: 'ria', boca: ['punta-de-cabicastro', 'punta-couso'] },
  { id: 'ria-de-vigo', nombre: 'Ría de Vigo', clase: 'ria', boca: ['cabo-home', 'cabo-silleiro'] },
  { id: 'ria-de-villaviciosa', nombre: 'Ría de Villaviciosa', clase: 'ria', desembocadura: [-5.3849, 43.5447] },
  { id: 'ria-de-bilbao', nombre: 'Ría de Bilbao', clase: 'ria', desembocadura: [-3.0746, 43.3688] },
  { id: 'bahia-de-santander', nombre: 'Bahía de Santander', clase: 'bahia', desembocadura: [-3.7685, 43.4693] },
  { id: 'bahia-de-cadiz', nombre: 'Bahía de Cádiz', clase: 'bahia', boca: ['punta-candor', 'punta-de-san-felipe'] },
  { id: 'mar-menor', nombre: 'Mar Menor', clase: 'golfo', boca: ['encanizadas-norte', 'encanizadas-sur'] },
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

async function puntoDelCabo({ nombre, enElNomenclator, punto }) {
  if (punto) return punto
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

const puntos = new Map()
for (const cabo of CABOS) {
  puntos.set(cabo.id, await puntoDelCabo(cabo))
  console.log(`${cabo.nombre}: «${cabo.enElNomenclator ?? 'a mano'}» en ${puntos.get(cabo.id).map((grado) => grado.toFixed(4)).join(', ')}`)
}

const cabos = CABOS.map(({ id, nombre, alias, desambiguacion }) =>
  elemento(
    id,
    { nombre, clase: 'cabo', ...(alias && { alias }), ...(desambiguacion && { desambiguacion }) },
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

// Un Cabo está sobre un arco cuando el vértice de la costa que le queda más cerca es uno de los del
// arco. Distingue a los que el Golfo baña, como la Punta de Tarifa dentro del Estrecho, del que solo le
// cae cerca por detrás del límite, como el Cabo de Begur respecto al de Rosas.
function losCabosDe(linea) {
  const suyos = new Set(linea.map((vertice) => vertice.join()))
  return CABOS.filter(({ id }) => {
    const cerca = anillo.reduce(
      (mejor, vertice) => (distancia(puntos.get(id), vertice) < mejor.separacion
        ? { separacion: distancia(puntos.get(id), vertice), vertice }
        : mejor),
      { separacion: Infinity, vertice: null },
    )
    // Un Cabo que cayera lejos de la silueta no estaría sobre ningún arco, que es la respuesta que
    // toca: solo los cinco que cierran un arco tienen que estar cerca, y eso ya lo exige su corte.
    return cerca.separacion <= SEPARACION_MAXIMA && suyos.has(cerca.vertice.join())
  }).map(({ id }) => id)
}

const arcos = ARCOS.map(({ id, nombre, clase, alias, desambiguacion, costa, cabos: declarados = [], entre: [uno, otro] }) => {
  const suCosta = costa ? anilloDelPais(COSTAS_DE_FUERA[costa]) : anillo
  const cortes = [limite(uno), limite(otro)].map((cual) => ({ ...cual, ...verticeMasCercano(suCosta, cual) }))
  const linea = arcoEntre(suCosta, cortes[0].indice, cortes[1].indice)
  comprobarArco(id, linea)
  const entre = cortes.map(({ nombre: donde, separacion }) => `${donde} (a ${(separacion * 111).toFixed(1)} km)`)
  console.log(`${nombre}: ${linea.length} vértices entre ${entre[0]} y ${entre[1]}`)
  return elemento(
    id,
    { nombre, clase, cabos: [...declarados, ...losCabosDe(linea)], ...(alias && { alias }), ...(desambiguacion && { desambiguacion }) },
    { type: 'LineString', coordinates: linea },
  )
})

// El Estrecho no es la orla de una costa sino el agua entre dos, así que no sale del buffer: por él
// daba la décima parte que el Golfo más pequeño. Se cierra con su arco de la costa de Cádiz y el
// trozo de orilla africana que tiene enfrente, unidos por sus dos extremos.
//
// Los dos límites africanos van a mano, como los de LIMITES, y no llevan topónimo: el Nomenclátor
// del IGN no cubre Marruecos y ninguna de las fuentes del proyecto nombra esa orilla.
const ORILLA_AFRICANA = [
  { nombre: 'la orilla africana frente a Punta Camarinal', punto: [-5.9095, 35.7967] },
  { nombre: 'la orilla africana frente a Punta Carnero', punto: [-5.4055, 35.9267] },
]

function anilloDelPais(codigo) {
  const mundo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'))
  const pais = feature(mundo, mundo.objects.countries).features.find(({ id }) => id === codigo)
  const anillos =
    pais.geometry.type === 'Polygon'
      ? [pais.geometry.coordinates[0]]
      : pais.geometry.coordinates.map(([exterior]) => exterior)
  return anillos.reduce((uno, otro) => (otro.length > uno.length ? otro : uno)).slice(0, -1)
}

function manchaDelEstrecho(arco) {
  const orilla = anilloDelPais(MARRUECOS)
  const cortes = ORILLA_AFRICANA.map((cual) => ({ ...cual, ...verticeMasCercano(orilla, cual) }))
  const enfrente = arcoEntre(orilla, cortes[0].indice, cortes[1].indice)
  // Las dos orillas se recorren en sentidos opuestos, así que la africana se da la vuelta para que
  // el anillo cierre sin cruzarse consigo mismo.
  const anillo = [...arco.geometry.coordinates, ...[...enfrente].reverse()]
  const cerrado = { type: 'Polygon', coordinates: [[...anillo, anillo[0]]] }
  let agua = enFeature(cerrado)
  for (const suelo of tierra) {
    agua = quitar(agua, suelo)
    if (!agua) throw new Error(`${arco.id} se queda sin agua al recortar contra la tierra`)
  }
  console.log(`${arco.properties.nombre}: entre ${cortes[0].nombre} y ${cortes[1].nombre}`)
  return { ...agua, id: arco.id, properties: arco.properties }
}

// El fondo lo decide el Golfo más pequeño, no el más grande: a 30 km Rosas y San Jorge se leen como
// costa resaltada (ADR-0012).
const FONDO = 40

// Recortar contra la costa deja trozos de mar entre islotes y dentro de las rías; el mayor no llega
// a un píxel a escala nacional.
const MIGA = 20

const enFeature = (geometry) => ({ type: 'Feature', properties: {}, geometry })

// El Golfo se recorta contra los cuatro vecinos además de contra España: a 40 km la banda se mete
// 1.435 km² en Portugal, 990 en Francia y 969 en Marruecos.
function tierraDelMapa() {
  const topologia = topologiaDe('autonomous_regions')
  const espana = merge(
    topologia,
    topologia.objects.autonomous_regions.geometries.filter((geometria) => geometria.id !== GIBRALTAR_COMUNIDADES),
  )
  const mundo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'))
  const VECINOS = new Set(['620', '250', '020', '504'])
  const paises = feature(mundo, mundo.objects.countries).features.filter((pais) => VECINOS.has(pais.id))
  return [enFeature(espana), ...paises]
}

const tierra = tierraDelMapa()

// El casquete redondo del buffer dobla la esquina del arco y se come lo que hay al otro lado del
// límite: sin esto, el Golfo de Valencia se traga el Cabo de la Nao, que no lo cierra. El corte va
// perpendicular a la cuerda del arco y no a la costa, porque en un cabo la costa gira y su
// perpendicular entraría en el propio golfo.
const LARGO_DEL_CORTE = 3

function semiplanoTras(punto, [tx, ty]) {
  const k = Math.cos((punto[1] * Math.PI) / 180)
  const [nx, ny] = [-ty, tx]
  const L = LARGO_DEL_CORTE
  const mover = (a, b) => [punto[0] + (a * tx + b * nx) / k, punto[1] + a * ty + b * ny]
  const esquinas = [mover(0, -L), mover(L, -L), mover(L, L), mover(0, L)]
  return enFeature({ type: 'Polygon', coordinates: [[...esquinas, esquinas[0]]] })
}

function cortesDe(id, linea) {
  const [inicio, fin] = [linea[0], linea.at(-1)]
  const k = Math.cos((((inicio[1] + fin[1]) / 2) * Math.PI) / 180)
  const [dx, dy] = [(fin[0] - inicio[0]) * k, fin[1] - inicio[1]]
  const largo = Math.hypot(dx, dy)
  if (largo === 0) throw new Error(`${id} empieza y acaba en el mismo punto, así que no tiene cuerda que cortar`)
  const cuerda = [dx / largo, dy / largo]
  return [semiplanoTras(inicio, [-cuerda[0], -cuerda[1]]), semiplanoTras(fin, cuerda)]
}

const quitar = (uno, otro) => difference(featureCollection([uno, otro]))

function manchaDe(arco) {
  let banda = buffer(arco, FONDO, { units: 'kilometers', steps: 12 })
  for (const corte of cortesDe(arco.id, arco.geometry.coordinates)) {
    banda = quitar(banda, corte)
    if (!banda) throw new Error(`el corte de un extremo se come entera la banda de ${arco.id}`)
  }
  for (const suelo of tierra) {
    banda = quitar(banda, suelo)
    if (!banda) throw new Error(`${arco.id} se queda sin mar al recortar contra la tierra`)
  }
  return { ...banda, id: arco.id, properties: arco.properties }
}

// Dos Golfos que comparten límite se muerden aunque los dos estén cortados, porque sus cuerdas no
// son paralelas y entre los dos cortes queda una cuña. El orden del listado decide de quién es.
function sinSolapes(manchas) {
  return manchas.reduce((limpias, mancha) => {
    const resto = limpias.reduce((queda, anterior) => {
      const recortada = quitar(queda, anterior)
      if (!recortada) throw new Error(`${mancha.id} cae entero dentro de ${anterior.id}`)
      return recortada
    }, mancha)
    return [...limpias, { ...resto, id: mancha.id, properties: mancha.properties }]
  }, [])
}

function sinMigas(mancha) {
  const partes =
    mancha.geometry.type === 'Polygon' ? [mancha.geometry.coordinates] : mancha.geometry.coordinates
  const grandes = partes.filter((parte) => areaDe({ type: 'Polygon', coordinates: parte }) / 1e6 >= MIGA)
  if (grandes.length === 0) throw new Error(`${mancha.id} se queda en migas de menos de ${MIGA} km²`)
  return { ...mancha, geometry: orientada({ type: 'MultiPolygon', coordinates: grandes }) }
}

// Dos manchas que comparten límite se tocan por el borde, y eso es lo correcto: el Golfo de Valencia
// y el de San Jorge se dan la mano en el Cabo de Tortosa. Lo que no puede haber es mar contado dos veces.
const SOLAPE = 0.01

function comprobarManchas(manchas) {
  for (const [i, una] of manchas.entries()) {
    for (const otra of manchas.slice(i + 1)) {
      const comun = intersect(featureCollection([una, otra]))
      const km2 = comun ? areaDe(comun) / 1e6 : 0
      if (km2 >= SOLAPE) throw new Error(`${una.id} y ${otra.id} se solapan en ${km2.toFixed(1)} km²`)
    }
    for (const cabo of cabos) {
      if (una.properties.cabos.includes(cabo.id)) continue
      if (booleanPointInPolygon(cabo.geometry, una)) {
        throw new Error(`${cabo.id} cae dentro de ${una.id}, que no lo tiene como límite`)
      }
    }
  }
}

// Lo bastante para que el disco se vea como agua a escala nacional, donde un kilómetro es
// medio píxel.
const RADIO_DEL_DISCO = 8

function manchaDelEntrante({ id, nombre, clase, alias, boca, desembocadura }) {
  let agua
  if (desembocadura) {
    agua = buffer({ type: 'Point', coordinates: desembocadura }, RADIO_DEL_DISCO, { units: 'kilometers', steps: 12 })
  } else {
    const cortes = boca.map((cual) => ({ ...limite(cual), ...verticeMasCercano(anillo, limite(cual)) }))
    const orilla = arcoEntre(anillo, cortes[0].indice, cortes[1].indice)
    agua = enFeature({ type: 'Polygon', coordinates: [[...orilla, orilla[0]]] })
    console.log(`${nombre}: ${orilla.length} vértices de orilla entre ${cortes[0].nombre} y ${cortes[1].nombre}`)
  }
  for (const suelo of tierra) {
    agua = quitar(agua, suelo)
    if (!agua) throw new Error(`${id} se queda sin agua al recortar contra la tierra`)
  }
  return { ...agua, id, properties: { nombre, clase, cabos: [], ...(alias && { alias }) } }
}

const golfos = arcos.filter(({ properties }) => properties.clase === 'golfo')
const elEstrecho = arcos.find(({ properties }) => properties.clase === 'estrecho')
// Los Entrantes van delante porque su agua es suya entera: el Golfo que la tenga al lado cede la
// parte que se meta en la boca.
const entrantes = ENTRANTES.map(manchaDelEntrante)
const manchas = sinSolapes([...entrantes, ...golfos.map(manchaDe), manchaDelEstrecho(elEstrecho)]).map(sinMigas)
comprobarManchas(manchas)
for (const mancha of manchas) {
  console.log(`${mancha.properties.nombre}: ${(areaDe(mancha) / 1e6).toFixed(0)} km² de mar`)
}

const enManchas = new Map(manchas.map((mancha) => [mancha.id, mancha]))
const costa = [...arcos, ...entrantes].map((forma) => enManchas.get(forma.id) ?? forma)

mkdirSync('src/datos', { recursive: true })
escribir('costas', [...cabos, ...costa])
