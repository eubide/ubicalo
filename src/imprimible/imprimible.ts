import { geoCentroid, geoPath, type GeoPath } from 'd3-geo'
import { geoConicConformalSpain } from 'd3-composite-projections'
import type { Feature, Geometry, Polygon } from 'geojson'
import { catalogo, contextoDe, contornos, type Alcance, type Elemento } from '../catalogo/catalogo'
import { esIdDeAltura, formaDe } from '../catalogo/relieve'
import { alcancesDeExamen } from '../dominio/dominio'
import type { Familia } from '../prueba/prueba'

export const ANCHO = 960
export const ALTO = 620

const MARGEN = 12
const RADIO_SIERRA = 7

export interface Posicion {
  id: string
  x: number
  y: number
}

export interface Numerado {
  numero: number
  elemento: Elemento
  contorno: Feature<Geometry>
  // En grados: Ceuta y Melilla se proyectan aparte, en su recuadro, para verlas de cerca.
  coordenadas: [number, number]
  x: number
  y: number
  esPunto: boolean
  enRecuadro: boolean
  // Una Altura no tiene forma propia, así que no puede llevar número: va como segundo hueco del Pico.
  conAltura: boolean
}

export interface Hoja {
  alcance: Alcance
  numerados: Numerado[]
}

type Proyeccion = ReturnType<typeof geoConicConformalSpain>

const proyecciones: Partial<Record<Alcance, Proyeccion>> = {}

export function proyeccionDe(alcance: Alcance): Proyeccion {
  return (proyecciones[alcance] ??= crearProyeccion(alcance))
}

function crearProyeccion(alcance: Alcance): Proyeccion {
  const contexto = contextoDe(alcance)
  return geoConicConformalSpain().fitExtent(
    [
      [MARGEN, MARGEN],
      [ANCHO - MARGEN, ALTO - MARGEN],
    ],
    { type: 'FeatureCollection', features: contexto ? [contexto.encuadre ?? contexto.contorno] : contornos(alcance) },
  )
}

export function trazadoDe(alcance: Alcance): GeoPath {
  return geoPath(proyeccionDe(alcance)).pointRadius(RADIO_SIERRA)
}

const ALTO_DE_BANDA = 60

// El número sale de dónde cae la forma en la hoja, leyendo de arriba abajo y de izquierda a derecha.
// Numerar por el catálogo repartiría las Provincias en orden alfabético y el mapa dejaría de ser mudo.
export function numerar(posiciones: Posicion[]): string[] {
  return [...posiciones].sort((una, otra) => banda(una) - banda(otra) || una.x - otra.x).map(({ id }) => id)
}

function banda({ y }: Posicion): number {
  return Math.floor(y / ALTO_DE_BANDA)
}

const PASADAS = 8

// Dos números pegados no se leen, y Estaca de Bares y el Cabo Ortegal están a siete píxeles.
export function separar(posiciones: Posicion[], minima: number): Posicion[] {
  const sueltas = posiciones.map((posicion) => ({ ...posicion }))
  for (let pasada = 0; pasada < PASADAS; pasada += 1) {
    for (const una of sueltas) {
      for (const otra of sueltas) {
        if (una === otra) continue
        const distancia = Math.hypot(otra.x - una.x, otra.y - una.y)
        if (distancia >= minima) continue
        const [haciaX, haciaY] = distancia === 0 ? [1, 0] : [(otra.x - una.x) / distancia, (otra.y - una.y) / distancia]
        const empuje = (minima - distancia) / 2
        una.x -= haciaX * empuje
        una.y -= haciaY * empuje
        otra.x += haciaX * empuje
        otra.y += haciaY * empuje
      }
    }
  }
  return sueltas
}

export function hojasDe(familia: Familia): Hoja[] {
  return alcancesDeExamen(familia).map((alcance) => ({ alcance, numerados: numeradosDe(alcance) }))
}

const DESVIO_DEL_PUNTO = 12
const SEPARACION_MINIMA = 20

// El número de un punto va encima salvo que ahí se salga de la hoja: el Cabo Ortegal está en el borde.
function desvioDelPunto(y: number): number {
  return y - DESVIO_DEL_PUNTO < MARGEN ? DESVIO_DEL_PUNTO : -DESVIO_DEL_PUNTO
}

function dentroDeLaHoja({ x, y }: Posicion): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, MARGEN), ANCHO - MARGEN),
    y: Math.min(Math.max(y, MARGEN), ALTO - MARGEN),
  }
}

function numeradosDe(alcance: Alcance): Numerado[] {
  const trazado = trazadoDe(alcance)
  const formas = contornos(alcance)
  const preguntados = catalogo(alcance)
  const conAltura = new Set(
    preguntados.filter(({ id }) => esIdDeAltura(id)).map(({ id }) => formaDe(id)),
  )
  const situados = preguntados
    .filter(({ id }) => !esIdDeAltura(id))
    .flatMap((elemento) => {
      const contorno = formas.find((forma) => String(forma.id) === elemento.id)
      if (!contorno) return []
      const coordenadas = geoCentroid(contorno)
      return [
        {
          elemento,
          contorno,
          coordenadas,
          centro: centroDe(contorno, trazado),
          esPunto: contorno.geometry.type === 'Point',
          enRecuadro: elemento.ciudadAutonoma === true,
          conAltura: conAltura.has(elemento.id),
        },
      ]
    })
  const orden = numerar(situados.map(({ elemento, centro: [x, y] }) => ({ id: elemento.id, x, y })))
  const enLaHoja = new Map(
    separar(
      situados
        .filter(({ enRecuadro }) => !enRecuadro)
        .map(({ elemento, centro: [x, y], esPunto }) => ({
          id: elemento.id,
          x: esPunto ? x + DESVIO_DEL_PUNTO : x,
          y: esPunto ? y + desvioDelPunto(y) : y,
        })),
      SEPARACION_MINIMA,
    ).map((posicion) => [posicion.id, posicion]),
  )
  return situados
    .map(({ centro: [x, y], ...situado }): Numerado => ({
      ...situado,
      numero: orden.indexOf(situado.elemento.id) + 1,
      ...dentroDeLaHoja(enLaHoja.get(situado.elemento.id) ?? { id: situado.elemento.id, x, y }),
    }))
    .sort((uno, otro) => uno.numero - otro.numero)
}

function centroDe(contorno: Feature<Geometry>, trazado: GeoPath): [number, number] {
  const { geometry } = contorno
  if (geometry.type !== 'MultiPolygon') return trazado.centroid(contorno)
  const poligonos = geometry.coordinates.map((coordinates): Polygon => ({ type: 'Polygon', coordinates }))
  const mayor = poligonos.reduce((uno, otro) => (trazado.area(otro) > trazado.area(uno) ? otro : uno))
  return trazado.centroid(mayor)
}
