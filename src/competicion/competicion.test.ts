import { describe, expect, it } from 'vitest'
import type { Prueba } from '../prueba/prueba'
import { almacenEnMemoria, crearCompeticion, enlaceDeReto, enlaceSinReto, retoDe, retoDeEnlace, superaReto, type Almacen, type Reto } from './competicion'

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
  it('distingue nueva marca, puntos que faltan, empate a puntos con más tiempo, empate total y abandono', () => {
    const competicion = crearCompeticion(almacenEnMemoria())
    const jugar = (puntuacion: number, tiempo: number, abandonada = false) =>
      competicion.registrar({ prueba: comunidadesUbicar, puntuacion, tiempo, fecha: '2026-09-13T10:00:00.000Z', abandonada })

    expect(jugar(1_800, 95_000)).toEqual({ caso: 'nueva-marca' })
    expect(jugar(1_650, 80_000)).toEqual({ caso: 'faltan-puntos', puntos: 150 })
    expect(jugar(1_799, 80_000)).toEqual({ caso: 'faltan-puntos', puntos: 1 })
    expect(jugar(1_800, 99_000)).toEqual({ caso: 'empate-a-puntos-con-mas-tiempo' })
    expect(jugar(1_800, 95_000)).toEqual({ caso: 'empate-total' })
    expect(jugar(1_825, 99_000)).toEqual({ caso: 'nueva-marca' })
    expect(jugar(2_000, 30_000, true)).toEqual({ caso: 'abandonada' })
  })

  it('compara el tiempo en segundos enteros, como se muestra al alumno', () => {
    const competicion = crearCompeticion(almacenEnMemoria())
    const jugar = (tiempo: number, fecha: string) =>
      competicion.registrar({ prueba: comunidadesUbicar, puntuacion: 1_800, tiempo, fecha, abandonada: false })

    jugar(95_400, '2026-09-13T10:00:00.000Z')

    expect(jugar(95_900, '2026-09-13T11:00:00.000Z')).toEqual({ caso: 'empate-total' })
    expect(jugar(95_000, '2026-09-13T12:00:00.000Z')).toEqual({ caso: 'empate-total' })
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 1_800, tiempo: 95_400, fecha: '2026-09-13T10:00:00.000Z' })

    expect(jugar(96_000, '2026-09-13T13:00:00.000Z')).toEqual({ caso: 'empate-a-puntos-con-mas-tiempo' })
    expect(jugar(94_999, '2026-09-13T14:00:00.000Z')).toEqual({ caso: 'nueva-marca' })
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

  function almacenConDatos(inicial: string): Almacen {
    let guardado: string | null = null
    return {
      getItem: () => guardado ?? inicial,
      setItem: (_clave, valor) => {
        guardado = valor
      },
    }
  }

  it.each(['{no es json', '"texto"', 'null', '[]', '{}', '42'])(
    'con datos corruptos (%s) empieza sin marcas ni historial y vuelve a guardar',
    (corrupto) => {
      const competicion = crearCompeticion(almacenConDatos(corrupto))

      expect(competicion.marca(comunidadesUbicar)).toBeNull()
      expect(competicion.historial()).toEqual([])

      expect(competicion.registrar(partida)).toEqual({ caso: 'nueva-marca' })
      expect(competicion.historial()).toEqual([partida])
    },
  )

  it('descarta las marcas y partidas del historial guardadas incompletas, y esa marca se puede volver a fijar', () => {
    let guardado = ''
    const captura = crearCompeticion({
      getItem: () => guardado || null,
      setItem: (_clave, valor) => {
        guardado = valor
      },
    })
    captura.registrar(partida)
    captura.registrar({ ...partida, prueba: provinciasUbicar, puntuacion: 500 })
    const sinPuntuacionDe900 = JSON.stringify(
      JSON.parse(guardado, (clave, valor) => (clave === 'puntuacion' && valor === 900 ? undefined : valor)),
    )

    const competicion = crearCompeticion(almacenConDatos(sinPuntuacionDe900))

    expect(competicion.marca(comunidadesUbicar)).toBeNull()
    expect(competicion.marca(provinciasUbicar)).toEqual({ puntuacion: 500, tiempo: 70_000, fecha: '2026-09-13T10:00:00.000Z' })
    expect(competicion.historial()).toEqual([{ ...partida, prueba: provinciasUbicar, puntuacion: 500 }])

    expect(competicion.registrar({ ...partida, puntuacion: 100 })).toEqual({ caso: 'nueva-marca' })
    expect(competicion.marca(comunidadesUbicar)).toEqual({ puntuacion: 100, tiempo: 70_000, fecha: '2026-09-13T10:00:00.000Z' })
  })

  it.each([
    ['tipo desconocido', { tipo: 'lo-que-sea', modo: 'nombre-ubicar' }],
    ['modo desconocido', { tipo: 'provincias', modo: 'pista' }],
  ])('descarta del historial una partida guardada con %s', (_caso, prueba) => {
    const guardado = JSON.stringify({ marcas: {}, historial: [{ ...partida, prueba }, partida] })

    expect(crearCompeticion(almacenConDatos(guardado)).historial()).toEqual([partida])
  })

  it('si el almacén falla al leer y al escribir, registrar no rompe y no hay marcas', () => {
    const competicion = crearCompeticion({
      getItem: () => {
        throw new Error('no disponible')
      },
      setItem: () => {
        throw new Error('no disponible')
      },
    })

    expect(competicion.registrar(partida)).toEqual({ caso: 'nueva-marca' })
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

describe('Reto', () => {
  const pagina = 'http://localhost:5173/'

  it('una partida terminada genera un reto con su prueba, puntuación y tiempo; una abandonada no', () => {
    const partida = { prueba: provinciasUbicar, puntuacion: 1_650, tiempo: 80_000, fecha: '2026-09-13T10:00:00.000Z' }

    expect(retoDe({ ...partida, abandonada: false })).toEqual({ prueba: provinciasUbicar, puntuacion: 1_650, tiempo: 80_000 })
    expect(retoDe({ ...partida, abandonada: true })).toBeNull()
  })

  it('supera el reto con más puntuación o con la misma puntuación en menos segundos enteros; abandonar no lo supera', () => {
    const reto: Reto = { prueba: comunidadesNombrar, puntuacion: 1_800, tiempo: 95_400 }
    const jugar = (puntuacion: number, tiempo: number, abandonada = false) =>
      superaReto({ prueba: comunidadesNombrar, puntuacion, tiempo, fecha: '2026-09-13T10:00:00.000Z', abandonada }, reto)

    expect(jugar(1_801, 200_000)).toBe(true)
    expect(jugar(1_799, 10_000)).toBe(false)
    expect(jugar(1_800, 94_999)).toBe(true)
    expect(jugar(1_800, 95_900)).toBe(false)
    expect(jugar(1_800, 96_000)).toBe(false)
    expect(jugar(2_000, 10_000, true)).toBe(false)
  })

  it('un reto convertido en enlace y el enlace convertido de nuevo en reto dan el mismo reto', () => {
    const reto: Reto = { prueba: { tipo: 'provincias', modo: 'ubicacion-nombre' }, puntuacion: 1_825, tiempo: 95_400 }

    expect(retoDeEnlace(enlaceDeReto(reto, pagina))).toEqual(reto)

    const enlace = enlaceDeReto(reto, 'http://localhost:5173/ubicalo/?idioma=es#mapa')
    expect(enlace).toBe('http://localhost:5173/ubicalo/?tipo=provincias&modo=ubicacion-nombre&puntuacion=1825&tiempo=95400')
    expect(retoDeEnlace(enlace)).toEqual(reto)
  })

  it.each([
    ['sin parámetros', 'http://localhost:5173/'],
    ['sin tiempo', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=1800'],
    ['tipo desconocido', 'http://localhost:5173/?tipo=lo-que-sea&modo=nombre-ubicar&puntuacion=1800&tiempo=95000'],
    ['modo desconocido', 'http://localhost:5173/?tipo=provincias&modo=pista&puntuacion=1800&tiempo=95000'],
    ['puntuación no numérica', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=mucha&tiempo=95000'],
    ['puntuación vacía', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=&tiempo=95000'],
    ['tiempo negativo', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=1800&tiempo=-5'],
    ['puntuación decimal', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=18.5&tiempo=95000'],
    ['puntuación negativa', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=-1800&tiempo=95000'],
    ['tiempo mayor que el entero seguro', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=1800&tiempo=9007199254740993'],
    ['tiempo infinito', 'http://localhost:5173/?tipo=provincias&modo=nombre-ubicar&puntuacion=1800&tiempo=Infinity'],
    ['no es una URL', 'reto de provincias'],
  ])('un enlace inválido (%s) no da reto', (_caso, enlace) => {
    expect(retoDeEnlace(enlace)).toBeNull()
  })

  it('quitar el reto de un enlace conserva la ruta, los demás parámetros y el fragmento', () => {
    expect(
      enlaceSinReto('http://localhost:5173/ubicalo/?tipo=provincias&idioma=es&modo=nombre-ubicar&puntuacion=1800&tiempo=95000#mapa'),
    ).toBe('http://localhost:5173/ubicalo/?idioma=es#mapa')
    expect(enlaceSinReto('http://localhost:5173/ubicalo/?tipo=provincias&modo=nombre-ubicar&puntuacion=1800&tiempo=95000')).toBe(
      'http://localhost:5173/ubicalo/',
    )
  })
})
