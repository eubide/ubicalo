import { describe, expect, it } from 'vitest'
import type { Elemento } from '../catalogo/catalogo'
import { iniciarPartida, responder } from './partida'

const elementos: Elemento[] = [
  { id: 'a', nombre: 'Alfa', nombreMostrado: 'Alfa', alias: [] },
  { id: 'b', nombre: 'Beta', nombreMostrado: 'Beta', alias: [] },
  { id: 'c', nombre: 'Gamma', nombreMostrado: 'Gamma', alias: [] },
  { id: 'd', nombre: 'Delta', nombreMostrado: 'Delta', alias: [] },
  { id: 'e', nombre: 'Épsilon', nombreMostrado: 'Épsilon', alias: [] },
]

const azarFijo = () => 0.5

describe('Partida en Nombre → ubicar', () => {
  it('la primera vuelta pregunta todos los elementos y la partida termina al acertarlos', () => {
    let partida = iniciarPartida(elementos, azarFijo)
    const preguntados: string[] = []

    while (!partida.terminada) {
      const preguntado = partida.preguntado!
      preguntados.push(preguntado.id)
      partida = responder(partida, preguntado.id)
    }

    expect(preguntados.sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(partida.pendientes).toBe(0)
  })

  it('un fallo deja el elemento pendiente y vuelve a preguntarse en la vuelta siguiente', () => {
    let partida = iniciarPartida(elementos, azarFijo)
    const fallado = partida.preguntado!
    const otro = elementos.find((elemento) => elemento.id !== fallado.id)!

    partida = responder(partida, otro.id)

    expect(partida.ultimaRespuesta).toEqual({ acierto: false, correcto: fallado })
    expect(partida.acertados).toEqual([])
    expect(partida.pendientes).toBe(5)
    expect(partida.vuelta).toBe(1)

    for (let i = 0; i < 4; i++) {
      partida = responder(partida, partida.preguntado!.id)
    }

    expect(partida.vuelta).toBe(2)
    expect(partida.acertados).toHaveLength(4)
    expect(partida.acertados).not.toContain(fallado.id)
    expect(partida.preguntado).toEqual(fallado)
    expect(partida.pendientes).toBe(1)

    partida = responder(partida, fallado.id)

    expect(partida.ultimaRespuesta).toEqual({ acierto: true, correcto: fallado })
    expect(partida.terminada).toBe(true)
  })
})
