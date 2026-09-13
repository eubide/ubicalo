import { describe, expect, it } from 'vitest'
import type { Prueba } from '../prueba/prueba'
import { almacenEnMemoria, crearCompeticion } from './competicion'

const comunidadesUbicar: Prueba = { tipo: 'comunidades', modo: 'nombre-ubicar' }
const provinciasUbicar: Prueba = { tipo: 'provincias', modo: 'nombre-ubicar' }
const comunidadesNombrar: Prueba = { tipo: 'comunidades', modo: 'ubicacion-nombre' }

describe('Marca', () => {
  it('cada prueba tiene su propia marca con puntuación, tiempo y fecha', () => {
    const competicion = crearCompeticion(almacenEnMemoria())

    competicion.registrar({
      prueba: comunidadesUbicar,
      puntuacion: 1_800,
      tiempo: 95_000,
      fecha: '2026-09-13T10:00:00.000Z',
      abandonada: false,
    })

    expect(competicion.marca(comunidadesUbicar)).toEqual({
      puntuacion: 1_800,
      tiempo: 95_000,
      fecha: '2026-09-13T10:00:00.000Z',
    })
    expect(competicion.marca(provinciasUbicar)).toBeNull()
    expect(competicion.marca(comunidadesNombrar)).toBeNull()
  })

  it('fija marca con más puntuación o con la misma puntuación en menos tiempo; en empate total se queda la anterior', () => {
    const competicion = crearCompeticion(almacenEnMemoria())
    const jugar = (puntuacion: number, tiempo: number, fecha: string) =>
      competicion.registrar({ prueba: comunidadesUbicar, puntuacion, tiempo, fecha, abandonada: false })

    jugar(1_800, 95_000, '2026-09-13T10:00:00.000Z')

    jugar(1_700, 60_000, '2026-09-13T11:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_800, tiempo: 95_000, fecha: '2026-09-13T10:00:00.000Z' })

    jugar(1_800, 99_000, '2026-09-13T12:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_800, tiempo: 95_000, fecha: '2026-09-13T10:00:00.000Z' })

    jugar(1_800, 90_000, '2026-09-13T13:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_800, tiempo: 90_000, fecha: '2026-09-13T13:00:00.000Z' })

    jugar(1_800, 90_000, '2026-09-13T14:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_800, tiempo: 90_000, fecha: '2026-09-13T13:00:00.000Z' })

    jugar(1_900, 120_000, '2026-09-13T15:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_900, tiempo: 120_000, fecha: '2026-09-13T15:00:00.000Z' })
  })

  it('una partida abandonada nunca fija marca, aunque no haya marca o la supere', () => {
    const competicion = crearCompeticion(almacenEnMemoria())
    const abandonar = (puntuacion: number, tiempo: number, fecha: string) =>
      competicion.registrar({ prueba: comunidadesUbicar, puntuacion, tiempo, fecha, abandonada: true })

    abandonar(300, 20_000, '2026-09-13T10:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toBeNull()

    competicion.registrar({
      prueba: comunidadesUbicar,
      puntuacion: 1_200,
      tiempo: 150_000,
      fecha: '2026-09-13T11:00:00.000Z',
      abandonada: false,
    })
    abandonar(1_500, 60_000, '2026-09-13T12:00:00.000Z')
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_200, tiempo: 150_000, fecha: '2026-09-13T11:00:00.000Z' })
  })
})

describe('Resultado de registrar una partida', () => {
  it('indica si hay nueva marca o a cuántos puntos de la marca se ha quedado', () => {
    const competicion = crearCompeticion(almacenEnMemoria())
    const jugar = (puntuacion: number, tiempo: number, abandonada = false) =>
      competicion.registrar({ prueba: comunidadesUbicar, puntuacion, tiempo, fecha: '2026-09-13T10:00:00.000Z', abandonada })

    expect(jugar(1_800, 95_000)).toEqual({ nuevaMarca: true, puntosParaLaMarca: null })
    expect(jugar(1_650, 80_000)).toEqual({ nuevaMarca: false, puntosParaLaMarca: 150 })
    expect(jugar(1_800, 99_000)).toEqual({ nuevaMarca: false, puntosParaLaMarca: 0 })
    expect(jugar(1_825, 99_000)).toEqual({ nuevaMarca: true, puntosParaLaMarca: null })
    expect(jugar(2_000, 30_000, true)).toEqual({ nuevaMarca: false, puntosParaLaMarca: null })
  })
})

describe('Almacén', () => {
  const partida = {
    prueba: comunidadesUbicar,
    puntuacion: 900,
    tiempo: 70_000,
    fecha: '2026-09-13T10:00:00.000Z',
    abandonada: false,
  }

  it('otra competición sobre el mismo almacén ve la marca y el historial guardados', () => {
    const almacen = almacenEnMemoria()
    crearCompeticion(almacen).registrar(partida)

    const competicion = crearCompeticion(almacen)

    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 900, tiempo: 70_000, fecha: '2026-09-13T10:00:00.000Z' })
    expect(competicion.historial()).toEqual([partida])
  })

  it.each(['{no es json', '"texto"', 'null', '{"marcas":[],"historial":{}}'])(
    'con datos corruptos (%s) empieza sin marcas ni historial y vuelve a guardar',
    (corrupto) => {
      const almacen = almacenEnMemoria()
      almacen.setItem('ubicalo:competicion', corrupto)
      const competicion = crearCompeticion(almacen)

      expect(competicion.marca(comunidadesUbicar)).toBeNull()
      expect(competicion.historial()).toEqual([])

      expect(competicion.registrar(partida)).toEqual({ nuevaMarca: true, puntosParaLaMarca: null })
      expect(competicion.historial()).toEqual([partida])
    },
  )

  it('si el almacén falla al leer y al escribir, registrar no rompe y no hay marcas', () => {
    const competicion = crearCompeticion({
      getItem: () => {
        throw new Error('no disponible')
      },
      setItem: () => {
        throw new Error('no disponible')
      },
    })

    expect(competicion.registrar(partida)).toEqual({ nuevaMarca: true, puntosParaLaMarca: null })
    expect(competicion.marca(comunidadesUbicar)).toBeNull()
    expect(competicion.historial()).toEqual([])
  })
})

describe('Historial', () => {
  it('guarda las últimas 10 partidas de cualquier prueba, de la más reciente a la más antigua, y marca las abandonadas', () => {
    const competicion = crearCompeticion(almacenEnMemoria())

    for (let i = 1; i <= 12; i++) {
      competicion.registrar({
        prueba: i % 2 === 0 ? comunidadesUbicar : provinciasUbicar,
        puntuacion: i * 100,
        tiempo: 60_000,
        fecha: `2026-09-${String(i).padStart(2, '0')}T10:00:00.000Z`,
        abandonada: i % 3 === 0,
      })
    }

    const historial = competicion.historial()
    expect(historial.map(({ puntuacion, abandonada }) => [puntuacion, abandonada])).toEqual([
      [1_200, true],
      [1_100, false],
      [1_000, false],
      [900, true],
      [800, false],
      [700, false],
      [600, true],
      [500, false],
      [400, false],
      [300, true],
    ])
    expect(historial[0]).toEqual({
      prueba: comunidadesUbicar,
      puntuacion: 1_200,
      tiempo: 60_000,
      fecha: '2026-09-12T10:00:00.000Z',
      abandonada: true,
    })
  })
})
