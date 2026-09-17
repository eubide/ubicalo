import { describe, expect, it } from 'vitest'
import type { Alcance } from '../catalogo/catalogo'
import {
  direccionesDe,
  familiaDe,
  FAMILIAS,
  nombreDePrueba,
  preguntasDe,
  pruebaDe,
  siguienteAlcance,
} from './prueba'

const ALCANCES: Alcance[] = FAMILIAS.flatMap(({ alcances }) => alcances)

describe('Alcance', () => {
  it('cada Alcance está en una sola familia', () => {
    expect(new Set(ALCANCES).size).toBe(ALCANCES.length)
    for (const { familia, alcances } of FAMILIAS) {
      for (const alcance of alcances) expect(familiaDe(alcance)).toBe(familia)
    }
  })

  it('cuenta las preguntas de cada Alcance', () => {
    expect(Object.fromEntries(ALCANCES.map((alcance) => [alcance, preguntasDe(alcance)]))).toEqual({
      comunidades: 19,
      provincias: 52,
      picos: 15,
      'cordilleras-y-sierras': 29,
      'pertenencia-relieve': 40,
      'todo-relieve': 44,
      unidades: 14,
      rios: 41,
      'pertenencia-rios': 24,
      'todo-rios': 44,
    })
  })

  it('Pertenencia, Todo y Grandes unidades se juegan en una sola dirección', () => {
    expect(direccionesDe('pertenencia-relieve')).toEqual(['localizar'])
    expect(direccionesDe('pertenencia-rios')).toEqual(['localizar'])
    expect(direccionesDe('unidades')).toEqual(['localizar'])
    expect(direccionesDe('todo-relieve')).toEqual(['nombrar'])
    expect(direccionesDe('todo-rios')).toEqual(['nombrar'])
  })

  it('los demás Alcances admiten las dos direcciones', () => {
    for (const alcance of ['comunidades', 'provincias', 'picos', 'cordilleras-y-sierras', 'rios'] as Alcance[]) {
      expect(direccionesDe(alcance)).toEqual(['localizar', 'nombrar'])
    }
  })

  it('una dirección que el Alcance no admite se cambia por la suya', () => {
    expect(pruebaDe('unidades', 'nombrar')).toEqual({ familia: 'relieve', alcance: 'unidades', direccion: 'localizar' })
    expect(pruebaDe('todo-rios', 'localizar').direccion).toBe('nombrar')
  })

  it('el siguiente Alcance da la vuelta dentro de su familia', () => {
    expect(siguienteAlcance('comunidades')).toBe('provincias')
    expect(siguienteAlcance('provincias')).toBe('comunidades')
    expect(siguienteAlcance('picos')).toBe('cordilleras-y-sierras')
    expect(siguienteAlcance('unidades')).toBe('picos')
    expect(siguienteAlcance('todo-rios')).toBe('rios')
  })

  it('el nombre de una Prueba dice familia, Alcance y dirección', () => {
    expect(nombreDePrueba(pruebaDe('pertenencia-rios', 'localizar'))).toBe('Hidrografía · Pertenencia · Localizar')
  })
})
