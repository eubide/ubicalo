import { beforeEach, describe, expect, it } from 'vitest'
import type { Elemento } from '../catalogo/catalogo'
import { abandonar, iniciarPartida, responder, responderConTexto, resumirPartida, tiempoJugado } from './partida'

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

describe('Partida en Ubicación → nombre', () => {
  const cadiz: Elemento = { id: 'ca', nombre: 'Cádiz', nombreMostrado: 'Cádiz', alias: [] }

  function partidaPreguntando(elemento: Elemento) {
    return iniciarPartida([elemento], azarFijo, reloj)
  }

  it('da igual mayúsculas y tildes: "cadiz" vale por "Cádiz"', () => {
    const partida = responderConTexto(partidaPreguntando(cadiz), 'cadiz')

    expect(partida.ultimaRespuesta).toEqual({ acierto: true, correcto: cadiz })
    expect(partida.acertados).toEqual(['ca'])
    expect(partida.terminada).toBe(true)
  })

  it('vale cualquier alias: "Gerona" por "Girona" y "Alacant" por "Alicante"', () => {
    const girona: Elemento = { id: 'gi', nombre: 'Girona', nombreMostrado: 'Girona (Gerona)', alias: ['Gerona'] }
    const alicante: Elemento = { id: 'al', nombre: 'Alicante', nombreMostrado: 'Alicante', alias: ['Alacant'] }

    expect(responderConTexto(partidaPreguntando(girona), 'Gerona').ultimaRespuesta?.acierto).toBe(true)
    expect(responderConTexto(partidaPreguntando(alicante), 'alacant').ultimaRespuesta?.acierto).toBe(true)
  })

  it('admite una errata en nombres de seis letras o más y la rechaza en los más cortos', () => {
    const valladolid: Elemento = { id: 'va', nombre: 'Valladolid', nombreMostrado: 'Valladolid', alias: [] }
    const huelva: Elemento = { id: 'h', nombre: 'Huelva', nombreMostrado: 'Huelva', alias: [] }
    const soria: Elemento = { id: 'so', nombre: 'Soria', nombreMostrado: 'Soria', alias: [] }
    const acierta = (elemento: Elemento, texto: string) =>
      responderConTexto(partidaPreguntando(elemento), texto).ultimaRespuesta?.acierto

    expect(acierta(valladolid, 'Valladoliz')).toBe(true)
    expect(acierta(valladolid, 'Valladoloz')).toBe(false)
    expect(acierta(huelva, 'Huelvo')).toBe(true)
    expect(acierta(huelva, 'Huelvaa')).toBe(true)
    expect(acierta(soria, 'Sorie')).toBe(false)
    expect(acierta(soria, 'Sori')).toBe(false)
  })

  it('no admite como errata el nombre o alias de otro elemento del tipo', () => {
    const palencia: Elemento = { id: 'pa', nombre: 'Palencia', nombreMostrado: 'Palencia', alias: [] }
    const valencia: Elemento = { id: 'va', nombre: 'València', nombreMostrado: 'Valencia', alias: ['Valencia'] }
    const partida = iniciarPartida([palencia, valencia], azarFijo, reloj)
    expect(partida.preguntado).toEqual(palencia)

    expect(responderConTexto(partida, 'valencia').ultimaRespuesta?.acierto).toBe(false)
    expect(responderConTexto(partida, 'València').ultimaRespuesta?.acierto).toBe(false)
    expect(responderConTexto(partida, 'Palencio').ultimaRespuesta?.acierto).toBe(true)
    expect(responderConTexto(partida, 'palencia').ultimaRespuesta?.acierto).toBe(true)
  })

  it('un texto incorrecto es un fallo: resta 25, desvela el correcto y el elemento sigue pendiente', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responderConTexto(partida, partida.preguntado!.nombre)
    expect(partida.puntuacion).toBe(150)

    const fallado = partida.preguntado!
    partida = responderConTexto(partida, 'Zeta')

    expect(partida.ultimaRespuesta).toEqual({ acierto: false, correcto: fallado })
    expect(partida.puntuacion).toBe(125)
    expect(partida.fallos).toBe(1)
    expect(partida.pendientes).toBe(4)
    expect(partida.acertados).not.toContain(fallado.id)
  })

  it('un texto vacío no cuenta como fallo ni pasa al siguiente elemento', () => {
    const inicial = iniciarPartida(elementos, azarFijo, reloj)

    const partida = responderConTexto(inicial, '   ')

    expect(partida.fallos).toBe(0)
    expect(partida.preguntado).toEqual(inicial.preguntado)
    expect(partida.ultimaRespuesta).toBeUndefined()
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

  it('resume una partida acabada con su prueba, puntuación, tiempo, fecha de fin y si fue abandonada', () => {
    const prueba = { tipo: 'provincias', modo: 'ubicacion-nombre' } as const
    ahora = 1_000
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    expect(resumirPartida(partida, prueba)).toBeNull()

    partida = responder(partida, partida.preguntado!.id)
    ahora = 7_000
    partida = abandonar(partida)

    expect(resumirPartida(partida, prueba)).toEqual({
      prueba: { tipo: 'provincias', modo: 'ubicacion-nombre' },
      puntuacion: 150,
      tiempo: 6_000,
      fecha: '1970-01-01T00:00:07.000Z',
      abandonada: true,
    })
  })

  it('abandonar una partida ya terminada no la cambia', () => {
    ahora = 1_000
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    ahora = 4_000
    while (!partida.terminada) partida = responder(partida, partida.preguntado!.id)

    ahora = 9_000
    const tras = abandonar(partida)

    expect(tras.abandonada).toBe(false)
    expect(tras.terminada).toBe(true)
    expect(tiempoJugado(tras, 60_000)).toBe(3_000)
  })
})
