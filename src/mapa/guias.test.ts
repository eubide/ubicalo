import { describe, expect, it } from 'vitest'
import { enFilaMarAdentro, gruposApinados } from './guias'

describe('gruposApinados', () => {
  it('junta en un grupo lo que se toca en cadena y deja fuera lo suelto', () => {
    const grupos = gruposApinados(
      [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 10, y: 0 },
        { id: 'c', x: 20, y: 0 },
        { id: 'suelto', x: 200, y: 0 },
      ],
      15,
    )

    expect(grupos.map((grupo) => grupo.map(({ id }) => id))).toEqual([['a', 'b', 'c']])
  })
})

describe('enFilaMarAdentro', () => {
  const grupo = [
    { id: 'norte', x: 100, y: 90 },
    { id: 'sur', x: 100, y: 110 },
  ]

  it('aleja la fila del centro y la ordena como la costa', () => {
    const fila = enFilaMarAdentro(grupo, [300, 100], { fondo: 40, paso: 26 })
    const de = (id: string) => fila.find((posicion) => posicion.id === id)!

    expect(de('norte').x).toBe(60)
    expect(de('sur').y - de('norte').y).toBe(26)
  })

  it('en una fila horizontal separa los nombres por su anchura', () => {
    const enHorizontal = [
      { id: 'oeste', x: 90, y: 100 },
      { id: 'este', x: 110, y: 100 },
    ]
    const fila = enFilaMarAdentro(enHorizontal, [100, 300], { fondo: 40, paso: 26, anchoDe: () => 80 })
    const de = (id: string) => fila.find((posicion) => posicion.id === id)!

    expect(de('este').x - de('oeste').x).toBe(80)
  })
})
