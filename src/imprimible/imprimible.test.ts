import { describe, expect, it } from 'vitest'
import { hojasDe, numerar, separar } from './imprimible'

describe('numerar', () => {
  it('lee la hoja de izquierda a derecha dentro de una banda', () => {
    const orden = numerar([
      { id: 'derecha', x: 800, y: 20 },
      { id: 'izquierda', x: 100, y: 50 },
    ])

    expect(orden).toEqual(['izquierda', 'derecha'])
  })

  it('pone la banda de arriba antes que la de abajo', () => {
    const orden = numerar([
      { id: 'abajo', x: 10, y: 400 },
      { id: 'arriba', x: 900, y: 10 },
    ])

    expect(orden).toEqual(['arriba', 'abajo'])
  })

  it('no numera por el catálogo', () => {
    const orden = numerar([
      { id: 'alava', x: 600, y: 100 },
      { id: 'zamora', x: 200, y: 100 },
    ])

    expect(orden).toEqual(['zamora', 'alava'])
  })
})

describe('separar', () => {
  it('aparta dos números que caen en el mismo sitio', () => {
    const [uno, otro] = separar(
      [
        { id: 'nao', x: 500, y: 300 },
        { id: 'san-antonio', x: 500, y: 300 },
      ],
      20,
    )

    expect(Math.hypot(otro.x - uno.x, otro.y - uno.y)).toBeGreaterThanOrEqual(20)
  })

  it('deja donde están los que ya se leen sueltos', () => {
    const posiciones = [
      { id: 'uno', x: 100, y: 100 },
      { id: 'otro', x: 400, y: 400 },
    ]

    expect(separar(posiciones, 20)).toEqual(posiciones)
  })

  it('separa un corro entero, no solo dos', () => {
    const apartadas = separar(
      [
        { id: 'a', x: 300, y: 300 },
        { id: 'b', x: 303, y: 300 },
        { id: 'c', x: 300, y: 303 },
      ],
      20,
    )

    for (const una of apartadas) {
      for (const otra of apartadas) {
        if (una.id === otra.id) continue
        expect(Math.hypot(otra.x - una.x, otra.y - una.y)).toBeGreaterThan(15)
      }
    }
  })
})

describe('hojasDe', () => {
  it('da una hoja por Alcance del Simulacro', () => {
    expect(hojasDe('politico').map(({ alcance }) => alcance)).toEqual(['comunidades', 'provincias'])
    expect(hojasDe('costas').map(({ alcance }) => alcance)).toEqual(['todo-costas'])
  })

  it('numera del 1 al N sin saltos ni repeticiones', () => {
    for (const { numerados } of hojasDe('hidrografia')) {
      expect(numerados.map(({ numero }) => numero)).toEqual(numerados.map((_, indice) => indice + 1))
    }
  })

  it('pone los veinte Elementos de Costas en la misma hoja', () => {
    const [hoja] = hojasDe('costas')

    expect(hoja.numerados).toHaveLength(20)
  })

  it('cuelga la Altura del Pico en vez de darle número propio', () => {
    const [hoja] = hojasDe('relieve')
    const conAltura = hoja.numerados.filter((numerado) => numerado.conAltura)

    expect(hoja.numerados.every(({ elemento }) => !elemento.id.startsWith('altura-'))).toBe(true)
    expect(conAltura).toHaveLength(4)
  })

  it('manda Ceuta y Melilla al recuadro', () => {
    const [comunidades] = hojasDe('politico')
    const enElRecuadro = comunidades.numerados.filter((numerado) => numerado.enRecuadro)

    expect(enElRecuadro).toHaveLength(2)
  })
})
