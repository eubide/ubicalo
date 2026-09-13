import { beforeEach, describe, expect, it } from 'vitest'
import type { Elemento } from '../catalogo/catalogo'
import { abandonar, iniciarPartida, responder, tiempoJugado } from './partida'

const elementos: Elemento[] = [
  { id: 'a', nombre: 'Alfa', nombreMostrado: 'Alfa', alias: [] },
  { id: 'b', nombre: 'Beta', nombreMostrado: 'Beta', alias: [] },
  { id: 'c', nombre: 'Gamma', nombreMostrado: 'Gamma', alias: [] },
  { id: 'd', nombre: 'Delta', nombreMostrado: 'Delta', alias: [] },
  { id: 'e', nombre: 'Épsilon', nombreMostrado: 'Épsilon', alias: [] },
]

const azarFijo = () => 0.5

let ahora = 0
const reloj = () => ahora

beforeEach(() => {
  ahora = 0
})

describe('Partida en Nombre → ubicar', () => {
  it('la primera vuelta pregunta todos los elementos y la partida termina al acertarlos', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
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
    let partida = iniciarPartida(elementos, azarFijo, reloj)
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

describe('Puntuación', () => {
  it('un acierto a la primera inmediato suma 100 más 50 de bonus', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)

    partida = responder(partida, partida.preguntado!.id)

    expect(partida.puntuacion).toBe(150)
  })

  it('a los 5 s de mostrarse el elemento, el bonus lineal vale la mitad: 25', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)

    ahora = 5_000
    partida = responder(partida, partida.preguntado!.id)

    expect(partida.puntuacion).toBe(125)
  })

  it('el bonus se redondea a entero al sumarse: 140 a los 2 s y 138 a los 2,5 s', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)

    ahora = 2_000
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(140)

    ahora = 4_500
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(278)
  })

  it('sin bonus si el acierto a la primera llega a los 10 s o más', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)

    ahora = 10_000
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(100)

    ahora = 22_000
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(200)
  })

  it('un fallo resta 25', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)

    const preguntado = partida.preguntado!
    partida = responder(partida, elementos.find((elemento) => elemento.id !== preguntado.id)!.id)

    expect(partida.puntuacion).toBe(125)
  })

  it('la puntuación no baja de 0 tras varios fallos', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)

    for (let i = 0; i < 3; i++) {
      const preguntado = partida.preguntado!
      partida = responder(partida, elementos.find((elemento) => elemento.id !== preguntado.id)!.id)
    }
    expect(partida.puntuacion).toBe(0)

    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(150)
  })

  it('un acierto en vuelta posterior suma 25 sin bonus', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    const fallado = partida.preguntado!
    partida = responder(partida, elementos.find((elemento) => elemento.id !== fallado.id)!.id)

    for (let i = 0; i < 4; i++) {
      partida = responder(partida, partida.preguntado!.id)
    }
    expect(partida.puntuacion).toBe(600)

    partida = responder(partida, fallado.id)
    expect(partida.puntuacion).toBe(625)
  })
})

describe('Fin de partida', () => {
  it('recuenta los fallos, lista los elementos fallados y congela el tiempo jugado al terminar', () => {
    ahora = 1_000
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    const fallado = partida.preguntado!
    const otro = elementos.find((elemento) => elemento.id !== fallado.id)!

    ahora = 3_000
    partida = responder(partida, otro.id)
    for (let i = 0; i < 4; i++) {
      partida = responder(partida, partida.preguntado!.id)
    }
    partida = responder(partida, otro.id)
    expect(tiempoJugado(partida, 5_000)).toBe(4_000)

    ahora = 10_000
    partida = responder(partida, fallado.id)

    expect(partida.terminada).toBe(true)
    expect(partida.fallos).toBe(2)
    expect(partida.fallados).toEqual([fallado])
    expect(tiempoJugado(partida, 60_000)).toBe(9_000)
  })
})

describe('Abandono', () => {
  it('abandonar termina la partida con pendientes, conserva la puntuación y la marca como abandonada', () => {
    ahora = 1_000
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.abandonada).toBe(false)

    ahora = 7_000
    partida = abandonar(partida)

    expect(partida.terminada).toBe(true)
    expect(partida.abandonada).toBe(true)
    expect(partida.puntuacion).toBe(150)
    expect(partida.pendientes).toBe(4)
    expect(tiempoJugado(partida, 60_000)).toBe(6_000)
  })
})
