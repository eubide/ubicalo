import { mkdirSync } from 'node:fs'
import { geoCentroid, geoContains } from 'd3-geo'
import { descargar, douglasPeucker, elemento, escribir, orientado, simplificar } from './geometria.mjs'

// Capa «Unidades del relieve» del Atlas Didáctico del IGN, CC BY 4.0 (ADR-0003).
const CAPA_IGN =
  'https://mapas-tematicos.ign.es/servicios/rest/services/tematicos/Medio_natural/MapServer/1114/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'

const TOLERANCIA_EN_GRADOS = 0.015

// Cada parte de la capa se reconoce por un punto que cae dentro de ella; `todas` toma la clase entera.
const PARTES = [
  { clase: 'Rebordes montañosos periféricos', punto: [-4.5, 38.2], id: 'sierra-morena', nombre: 'Sierra Morena' },
  { clase: 'Rebordes montañosos periféricos', punto: [-2.0, 41.0], id: 'sistema-iberico', nombre: 'Sistema Ibérico' },
  { clase: 'Rebordes montañosos periféricos', punto: [-5.5, 43.1], id: 'galaico-cantabrica' },
  { clase: 'Cordilleras interiores', punto: [-4.5, 39.5], id: 'montes-de-toledo', nombre: 'Montes de Toledo' },
  { clase: 'Cordilleras interiores', punto: [-4.5, 40.6], id: 'sistema-central', nombre: 'Sistema Central' },
  { clase: 'Cordilleras exteriores', punto: [-3.3, 37.2], id: 'cordilleras-beticas', nombre: 'Cordilleras Béticas' },
  { clase: 'Cordilleras exteriores', punto: [0.2, 40.7], id: 'costero-catalana-sur' },
  { clase: 'Cordilleras exteriores', punto: [0.5, 42.6], id: 'pirineos-vascos-catalana' },
  { clase: 'Relieve volcánico', todas: true, id: 'montanas-de-canarias', nombre: 'Montañas de Canarias' },
]

// Cortes editoriales: la capa funde unidades que los libros separan. Cada corte es una
// recta por dos puntos [lon, lat]; `izquierda` se queda con el lado izquierdo al recorrerla.
const CORTES = [
  {
    de: 'galaico-cantabrica',
    recta: [
      [-7.0, 43.7],
      [-5.3, 41.5],
    ],
    izquierda: { id: 'cordillera-cantabrica', nombre: 'Cordillera Cantábrica' },
    derecha: { id: 'macizo-galaico-leones', nombre: 'Macizo Galaico-Leonés' },
  },
  {
    de: 'pirineos-vascos-catalana',
    recta: [
      [-1.7, 44.0],
      [-1.7, 42.0],
    ],
    izquierda: { id: 'pirineos-y-catalana' },
    derecha: { id: 'montes-vascos', nombre: 'Montes Vascos' },
  },
  {
    de: 'pirineos-y-catalana',
    recta: [
      [0.3, 41.5],
      [3.4, 42.35],
    ],
    izquierda: { id: 'pirineos', nombre: 'Pirineos' },
    derecha: { id: 'costero-catalana-norte' },
  },
]

const UNIONES = [
  {
    de: ['costero-catalana-norte', 'costero-catalana-sur'],
    id: 'cordillera-costero-catalana',
    nombre: 'Cordillera Costero-Catalana',
  },
]

const ORDEN = [
  'pirineos',
  'cordillera-cantabrica',
  'macizo-galaico-leones',
  'montes-vascos',
  'sistema-iberico',
  'sistema-central',
  'montes-de-toledo',
  'sierra-morena',
  'cordilleras-beticas',
  'cordillera-costero-catalana',
  'montanas-de-canarias',
]

// Las tres partes del Pirineo se cortan del polígono de Pirineos por dos meridianos (criterio editorial,
// no tercios iguales) y se guardan como el centro de cada parte, para que la mancha de Pirineos siga
// siendo tocable.
const PARTES_DEL_PIRINEO = [
  { id: 'pirineo-navarro', nombre: 'Pirineo Navarro', hasta: -0.8 },
  { id: 'pirineo-aragones', nombre: 'Pirineo Aragonés', hasta: 0.72 },
  { id: 'pirineo-catalan', nombre: 'Pirineo Catalán' },
]

// Listado «Sierras» de la Información Geográfica Destacada del IGN, CC-BY 4.0: centro del extent de su
// visor. Montserrat no está en el listado y sale de Wikidata (Q732115, CC0).
const SIERRAS = [
  { id: 'sierra-nevada', nombre: 'Sierra Nevada', ign: 572706, cordillera: 'cordilleras-beticas', coordenadas: [-3.1202, 37.092] },
  { id: 'sierra-de-cazorla', nombre: 'Sierra de Cazorla', ign: 526279, cordillera: 'cordilleras-beticas', coordenadas: [-2.9189, 38.0105] },
  { id: 'picos-de-europa', nombre: 'Picos de Europa', ign: 26881, cordillera: 'cordillera-cantabrica', coordenadas: [-4.834, 43.172] },
  { id: 'sierra-de-gata', nombre: 'Sierra de Gata', ign: 388878, cordillera: 'sistema-central', coordenadas: [-6.6513, 40.2667] },
  { id: 'sierra-de-gredos', nombre: 'Sierra de Gredos', ign: 392418, cordillera: 'sistema-central', coordenadas: [-5.0695, 40.3071] },
  { id: 'sierra-de-guadarrama', nombre: 'Sierra de Guadarrama', ign: 333813, cordillera: 'sistema-central', coordenadas: [-3.9624, 40.8233] },
  { id: 'sierra-de-bejar', nombre: 'Sierra de Béjar', ign: 390743, cordillera: 'sistema-central', coordenadas: [-5.7126, 40.327] },
  { id: 'sierra-del-moncayo', nombre: 'Sierra del Moncayo', ign: 244502, cordillera: 'sistema-iberico', coordenadas: [-1.7882, 41.7337] },
  { id: 'sierra-de-albarracin', nombre: 'Sierra de Albarracín', ign: 385611, cordillera: 'sistema-iberico', coordenadas: [-1.6248, 40.4424] },
  { id: 'serrania-de-cuenca', nombre: 'Serranía de Cuenca', ign: 400491, cordillera: 'sistema-iberico', coordenadas: [-1.7984, 40.0704] },
  { id: 'picos-de-urbion', nombre: 'Picos de Urbión', ign: 198151, cordillera: 'sistema-iberico', coordenadas: [-2.8982, 42.0197] },
  { id: 'sierra-de-la-demanda', nombre: 'Sierra de la Demanda', ign: 172190, cordillera: 'sistema-iberico', coordenadas: [-3.0799, 42.1932] },
  { id: 'montes-de-leon', nombre: 'Montes de León', ign: 136832, cordillera: 'macizo-galaico-leones', coordenadas: [-6.3625, 42.4919] },
  { id: 'montseny', nombre: 'Montseny', ign: 2723450, cordillera: 'cordillera-costero-catalana', coordenadas: [2.4031, 41.8022] },
  { id: 'montserrat', nombre: 'Montserrat', wikidata: 'Q732115', cordillera: 'cordillera-costero-catalana', coordenadas: [1.8115, 41.6054] },
]

// Listado «Cumbres» de la Información Geográfica Destacada del IGN, CC-BY 4.0. Las coordenadas
// son el centro del extent de su visor, contrastadas con Wikidata (diferencia máxima: 150 m).
const PICOS = [
  { id: 'aneto', nombre: 'Aneto', ngbe: 1814123, altura: 3404, cordillera: 'pirineos', coordenadas: [0.6566, 42.6311] },
  { id: 'torre-cerredo', nombre: 'Torre Cerredo', ngbe: 1697424, altura: 2649, cordillera: 'cordillera-cantabrica', sierra: 'picos-de-europa', coordenadas: [-4.8529, 43.1978] },
  { id: 'pena-trevinca', nombre: 'Peña Trevinca', ngbe: 1854852, altura: 2127, cordillera: 'macizo-galaico-leones', coordenadas: [-6.7961, 42.2424] },
  { id: 'aizkorri', nombre: 'Aizkorri', ngbe: 1761027, altura: 1523, cordillera: 'montes-vascos', coordenadas: [-2.3253, 42.9513] },
  { id: 'moncayo', nombre: 'Moncayo', ngbe: 1945743, altura: 2314, cordillera: 'sistema-iberico', sierra: 'sierra-del-moncayo', coordenadas: [-1.8397, 41.7872] },
  { id: 'almanzor', nombre: 'Almanzor', ngbe: 2098312, altura: 2591, cordillera: 'sistema-central', sierra: 'sierra-de-gredos', coordenadas: [-5.2975, 40.2461] },
  { id: 'rocigalgo', nombre: 'Rocigalgo', ngbe: 2166334, altura: 1449, cordillera: 'montes-de-toledo', coordenadas: [-4.6156, 39.5277] },
  { id: 'banuela', nombre: 'Bañuela', ngbe: 2278114, altura: 1332, cordillera: 'sierra-morena', coordenadas: [-4.2373, 38.4194] },
  { id: 'mulhacen', nombre: 'Mulhacén', ngbe: 2408142, altura: 3479, cordillera: 'cordilleras-beticas', sierra: 'sierra-nevada', coordenadas: [-3.3115, 37.0534] },
  { id: 'turo-de-l-home', nombre: "Turó de l'Home", ngbe: 1956991, altura: 1706, cordillera: 'cordillera-costero-catalana', sierra: 'montseny', coordenadas: [2.4348, 41.7765] },
  { id: 'teide', nombre: 'Teide', ngbe: 2638544, altura: 3715, cordillera: 'montanas-de-canarias', coordenadas: [-16.6423, 28.2728] },
]

function partesDe(capa) {
  return capa.features.flatMap((clase) => {
    const { Nombre } = clase.properties
    const anillos = clase.geometry.type === 'Polygon' ? [clase.geometry.coordinates] : clase.geometry.coordinates
    return anillos.map(([exterior]) => ({ clase: Nombre, poligono: { type: 'Polygon', coordinates: [orientado(exterior)] } }))
  })
}

function ladoDe([p, q], [x, y]) {
  return (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0])
}

function cruce([p, q], a, b) {
  const la = ladoDe([p, q], a)
  const lb = ladoDe([p, q], b)
  const t = la / (la - lb)
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]
}

// Sutherland–Hodgman contra un semiplano: `signo` 1 se queda con la izquierda de la recta, -1 con la derecha.
function recortarAnillo(anillo, recta, signo) {
  const dentro = (punto) => ladoDe(recta, punto) * signo >= 0
  const resultado = []
  for (let i = 0; i < anillo.length - 1; i++) {
    const actual = anillo[i]
    const siguiente = anillo[i + 1]
    if (dentro(actual)) {
      resultado.push(actual)
      if (!dentro(siguiente)) resultado.push(cruce(recta, actual, siguiente))
    } else if (dentro(siguiente)) {
      resultado.push(cruce(recta, actual, siguiente))
    }
  }
  if (resultado.length < 3) return null
  return [...resultado, resultado[0]]
}

function recortarPoligono(poligono, recta, signo) {
  const anillos = poligono.coordinates.map((anillo) => recortarAnillo(anillo, recta, signo)).filter(Boolean)
  return anillos.length > 0 ? { type: 'Polygon', coordinates: anillos } : null
}

function unir(geometrias) {
  const poligonos = geometrias.flatMap((geometria) =>
    geometria.type === 'Polygon' ? [geometria.coordinates] : geometria.coordinates,
  )
  return { type: 'MultiPolygon', coordinates: poligonos }
}

function reconocerPartes(capa) {
  const partes = partesDe(capa)
  const unidades = new Map()
  for (const { clase, punto, todas, id, nombre } of PARTES) {
    if (todas) {
      const poligonosDeLaClase = partes.filter((parte) => parte.clase === clase).map((parte) => parte.poligono)
      unidades.set(id, { nombre, geometria: unir(poligonosDeLaClase) })
      continue
    }
    const parte = partes.find((candidata) => candidata.clase === clase && geoContains(candidata.poligono, punto))
    if (!parte) throw new Error(`No hay parte de «${clase}» que contenga ${punto}`)
    unidades.set(id, { nombre, geometria: parte.poligono })
  }
  return unidades
}

function aplicarCortes(unidades) {
  for (const { de, recta, izquierda, derecha } of CORTES) {
    const { geometria } = unidades.get(de)
    unidades.delete(de)
    for (const [lado, signo] of [
      [izquierda, 1],
      [derecha, -1],
    ]) {
      const recortada = recortarPoligono(geometria, recta, signo)
      if (!recortada) throw new Error(`El corte de ${de} deja vacío ${lado.id}`)
      unidades.set(lado.id, { nombre: lado.nombre, geometria: recortada })
    }
  }
}

function aplicarUniones(unidades) {
  for (const { de, id, nombre } of UNIONES) {
    const geometria = unir(de.map((parte) => unidades.get(parte).geometria))
    de.forEach((parte) => unidades.delete(parte))
    unidades.set(id, { nombre, geometria })
  }
}

function unidadesDe(capa) {
  const unidades = reconocerPartes(capa)
  aplicarCortes(unidades)
  aplicarUniones(unidades)
  return unidades
}

function cordillerasDe(unidades) {
  return ORDEN.map((id) => {
    const unidad = unidades.get(id)
    if (!unidad?.nombre) throw new Error(`Unidad sin resolver: ${id}`)
    return elemento(id, { nombre: unidad.nombre, clase: 'cordillera' }, simplificar(unidad.geometria, TOLERANCIA_EN_GRADOS, true))
  })
}

function partesDelPirineo(unidades) {
  let resto = unidades.get('pirineos').geometria
  return PARTES_DEL_PIRINEO.map(({ id, nombre, hasta }) => {
    let geometria = resto
    if (hasta !== undefined) {
      const meridiano = [
        [hasta, 44.0],
        [hasta, 41.0],
      ]
      geometria = recortarPoligono(resto, meridiano, -1)
      resto = recortarPoligono(resto, meridiano, 1)
    }
    return elemento(id, { nombre, clase: 'sierra', cordillera: 'pirineos' }, { type: 'Point', coordinates: geoCentroid(geometria) })
  })
}

function sierrasDe(unidades) {
  const puntos = SIERRAS.map(({ id, nombre, cordillera, coordenadas }) =>
    elemento(id, { nombre, clase: 'sierra', cordillera }, { type: 'Point', coordinates: coordenadas }),
  )
  return [...puntos, ...partesDelPirineo(unidades)]
}

function picos() {
  return PICOS.map(({ id, nombre, altura, cordillera, sierra, coordenadas }) =>
    elemento(
      id,
      { nombre, clase: 'pico', altura, cordillera, ...(sierra && { sierra }) },
      { type: 'Point', coordinates: coordenadas },
    ),
  )
}

const capa = await descargar(CAPA_IGN)
const unidades = unidadesDe(capa)

mkdirSync('src/datos', { recursive: true })
escribir('cordilleras', cordillerasDe(unidades))
escribir('sierras', sierrasDe(unidades))
escribir('picos', picos())
