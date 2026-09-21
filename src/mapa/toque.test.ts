import { geoConicConformalSpain } from 'd3-composite-projections'
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import { describe, expect, it } from 'vitest'
import riosGeo from '../datos/rios.json'
import { contextoDe, contornos } from '../catalogo/catalogo'
import { tocableMasCercano, trazoMasCercano, type Trazo } from './toque'

// La misma proyección y el mismo encuadre que usa el mapa, para tocar donde tocaría el dedo.
const ANCHO = 960
const ALTO = 620
const MARGEN = 12

const rios = (riosGeo as FeatureCollection).features as Feature<LineString>[]

const proyeccion = geoConicConformalSpain().fitExtent(
  [
    [MARGEN, MARGEN],
    [ANCHO - MARGEN, ALTO - MARGEN],
  ],
  riosGeo as FeatureCollection,
)

type Proyectar = (coordenadas: [number, number]) => [number, number] | null

function trazosDe(lineas: Feature<LineString>[], proyectar: Proyectar): Trazo[] {
  return lineas.map((linea) => ({
    id: String(linea.id),
    puntos: linea.geometry.coordinates.map((coordenadas) => {
      const [x, y] = proyectar(coordenadas as [number, number])!
      return { x, y }
    }),
  }))
}

function puntosDe(formas: Feature<Point>[], proyectar: Proyectar): Trazo[] {
  return formas.map((forma) => {
    const [x, y] = proyectar(forma.geometry.coordinates as [number, number])!
    return { id: String(forma.id), puntos: [{ x, y }] }
  })
}

const trazos = trazosDe(rios, proyeccion)
const trazoPorId = (id: string) => trazos.find((trazo) => trazo.id === id)!

function enElMapa(lon: number, lat: number) {
  const [x, y] = proyeccion([lon, lat])!
  return { x, y }
}

function puntoMedioDe(id: string) {
  const { puntos } = trazoPorId(id)
  return puntos[Math.floor(puntos.length / 2)]
}

function desplazado({ x, y }: { x: number; y: number }, dx: number, dy: number) {
  return { x: x + dx, y: y + dy }
}

const RADIO_DEL_DEDO = 14

const proyeccionDeCostas = geoConicConformalSpain().fitExtent(
  [
    [MARGEN, MARGEN],
    [ANCHO - MARGEN, ALTO - MARGEN],
  ],
  contextoDe('todo-costas')!.encuadre!,
)

const formasDeCosta = [...contornos('cabos'), ...contornos('golfos')]
const cabos = puntosDe(
  formasDeCosta.filter((forma): forma is Feature<Point> => forma.geometry.type === 'Point'),
  proyeccionDeCostas,
)
const cabo = (id: string) => cabos.find((punto) => punto.id === id)!.puntos[0]

describe('Qué río tocó el dedo', () => {
  it('un toque justo sobre la línea devuelve ese río', () => {
    expect(trazoMasCercano(puntoMedioDe('ebro'), trazos, RADIO_DEL_DEDO)).toBe('ebro')
    expect(trazoMasCercano(puntoMedioDe('guadalquivir'), trazos, RADIO_DEL_DEDO)).toBe('guadalquivir')
    expect(trazoMasCercano(puntoMedioDe('tinto'), trazos, RADIO_DEL_DEDO)).toBe('tinto')
  })

  it('un toque dentro del radio del dedo, pero no sobre la línea, sigue devolviendo el río', () => {
    const cerca = desplazado(puntoMedioDe('duero'), 0, RADIO_DEL_DEDO - 2)

    expect(trazoMasCercano(cerca, trazos, RADIO_DEL_DEDO)).toBe('duero')
  })

  it('un toque fuera del radio no devuelve ningún río', () => {
    const lejos = { x: ANCHO - 1, y: 1 }

    expect(trazoMasCercano(lejos, trazos, RADIO_DEL_DEDO)).toBeNull()
  })

  it('acierta entre dos puntos consecutivos del trazo, no solo sobre sus vértices', () => {
    const { puntos } = trazoPorId('tajo')
    const [uno, otro] = [puntos[10], puntos[11]]
    const entreMedias = { x: (uno.x + otro.x) / 2, y: (uno.y + otro.y) / 2 }

    expect(trazoMasCercano(entreMedias, trazos, RADIO_DEL_DEDO)).toBe('tajo')
  })

  it('en la desembocadura del Sil en el Miño gana el que pasa más cerca del punto exacto', () => {
    const { puntos } = trazoPorId('sil')
    const confluencia = puntos.at(-1)!
    const haciaElSil = puntos.at(-6)!
    const sobreElSil = { x: (confluencia.x + haciaElSil.x) / 2, y: (confluencia.y + haciaElSil.y) / 2 }

    expect(trazoMasCercano(sobreElSil, trazos, RADIO_DEL_DEDO)).toBe('sil')
    expect(trazoMasCercano(puntoMedioDe('mino'), trazos, RADIO_DEL_DEDO)).toBe('mino')
  })

  it('donde el Záncara y el Cigüela corren pegados, cada uno responde a su propio trazo', () => {
    expect(trazoMasCercano(puntoMedioDe('zancara'), trazos, RADIO_DEL_DEDO)).toBe('zancara')
    expect(trazoMasCercano(puntoMedioDe('ciguela'), trazos, RADIO_DEL_DEDO)).toBe('ciguela')
  })

  it('el desempate no depende del orden de la lista de candidatos', () => {
    const alReves = [...trazos].reverse()

    for (const id of ['zancara', 'ciguela', 'sil', 'mino', 'jiloca', 'jalon', 'cinca', 'segre']) {
      expect(trazoMasCercano(puntoMedioDe(id), alReves, RADIO_DEL_DEDO)).toBe(
        trazoMasCercano(puntoMedioDe(id), trazos, RADIO_DEL_DEDO),
      )
    }
  })

  it('cada uno de los 41 ríos se acierta tocando su propio trazo', () => {
    const fallados = rios
      .map(({ id }) => String(id))
      .filter((id) => trazoMasCercano(puntoMedioDe(id), trazos, RADIO_DEL_DEDO) !== id)

    expect(fallados).toEqual([])
  })

  it('sin trazos no devuelve nada', () => {
    expect(trazoMasCercano({ x: 100, y: 100 }, [], RADIO_DEL_DEDO)).toBeNull()
  })

  it('un trazo de un solo punto se toca como un punto suelto', () => {
    const suelto: Trazo = { id: 'suelto', puntos: [{ x: 500, y: 300 }] }

    expect(trazoMasCercano({ x: 505, y: 300 }, [suelto], RADIO_DEL_DEDO)).toBe('suelto')
    expect(trazoMasCercano({ x: 600, y: 300 }, [suelto], RADIO_DEL_DEDO)).toBeNull()
  })
})

// En Costas ya no queda ninguna línea: los seis Golfos y el Estrecho son manchas y su toque lo
// resuelve el SVG, no la cercanía. Lo único que sigue pasando por aquí son los dieciocho Cabos.
describe('Qué Elemento de Costas tocó el dedo', () => {
  const RADIO_DE_LA_MARCA = 4

  const quien = (punto: { x: number; y: number }) =>
    tocableMasCercano(punto, cabos, [], RADIO_DEL_DEDO, RADIO_DE_LA_MARCA)

  it('en Costas no queda ningún trazo que tocar por cercanía', () => {
    expect(formasDeCosta.filter(({ geometry }) => geometry.type === 'LineString')).toEqual([])
  })

  it('cada uno de los 18 Cabos responde a su propia marca', () => {
    const fallados = cabos.map(({ id }) => [id, cabo(id)] as const).filter(([id, punto]) => quien(punto) !== id)

    expect(cabos).toHaveLength(18)
    expect(fallados.map(([id]) => id)).toEqual([])
  })

  it('Estaca de Bares y el Cabo Ortegal, a siete píxeles, responden cada uno por el suyo', () => {
    expect(quien(cabo('punta-de-estaca-de-bares'))).toBe('punta-de-estaca-de-bares')
    expect(quien(cabo('cabo-ortegal'))).toBe('cabo-ortegal')
    expect(quien(cabo('cabo-tourinan'))).toBe('cabo-tourinan')
    expect(quien(cabo('cabo-de-finisterre'))).toBe('cabo-de-finisterre')
  })

  it('lejos de todo no responde nadie', () => {
    expect(quien({ x: ANCHO - 1, y: ALTO - 1 })).toBeNull()
  })
})
