import { beforeEach, describe, expect, it } from 'vitest'
import type { Elemento } from '../catalogo/catalogo'
import {
  abandonar,
  cerrarCorreccion,
  elegirOpcion,
  iniciarPartida,
  pedirPista,
  responder,
  responderConTexto,
  resumirPartida,
  tiempoJugado,
  type Partida,
} from './partida'

const elementos: Elemento[] = [
  { id: 'a', nombre: 'Alfa', nombreMostrado: 'Alfa', alias: [], vecinos: [] },
  { id: 'b', nombre: 'Beta', nombreMostrado: 'Beta', alias: [], vecinos: [] },
  { id: 'c', nombre: 'Gamma', nombreMostrado: 'Gamma', alias: [], vecinos: [] },
  { id: 'd', nombre: 'Delta', nombreMostrado: 'Delta', alias: [], vecinos: [] },
  { id: 'e', nombre: 'Épsilon', nombreMostrado: 'Épsilon', alias: [], vecinos: [] },
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

    partida = cerrarCorreccion(responder(partida, otro.id))

    expect(partida.ultimaRespuesta).toEqual({ acierto: false, conPista: false, correcto: fallado })
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

    expect(partida.ultimaRespuesta).toEqual({ acierto: true, conPista: false, correcto: fallado })
    expect(partida.terminada).toBe(true)
  })
})

describe('Corrección en Nombre → ubicar', () => {
  function fallarLaPrimera(partida: Partida) {
    const correcto = partida.preguntado!
    const elegido = elementos.find((elemento) => elemento.id !== correcto.id)!
    return { partida: responder(partida, elegido.id), correcto, elegido }
  }

  it('un fallo abre durante 3 s una Corrección con lo que tocó el alumno y el elemento correcto', () => {
    const { partida, correcto, elegido } = fallarLaPrimera(iniciarPartida(elementos, azarFijo, reloj))

    expect(partida.correccion).toEqual({ elegido, correcto, duracion: 3_000 })
  })

  it('un acierto sin ayuda no abre Corrección', () => {
    const partida = iniciarPartida(elementos, azarFijo, reloj)

    expect(responder(partida, partida.preguntado!.id).correccion).toBeNull()
  })

  it('las respuestas durante la Corrección se ignoran hasta cerrarla', () => {
    const { partida } = fallarLaPrimera(iniciarPartida(elementos, azarFijo, reloj))

    expect(responder(partida, partida.preguntado!.id)).toBe(partida)

    const cerrada = cerrarCorreccion(partida)
    expect(cerrada.correccion).toBeNull()
    expect(responder(cerrada, cerrada.preguntado!.id).puntuacion).toBe(150)
  })

  it('el tiempo de la Corrección no suma al tiempo jugado ni al bonus de la pregunta siguiente', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    ahora = 2_000
    partida = fallarLaPrimera(partida).partida

    expect(tiempoJugado(partida, 4_000)).toBe(2_000)

    ahora = 5_000
    partida = cerrarCorreccion(partida)
    expect(tiempoJugado(partida, 5_000)).toBe(2_000)

    ahora = 7_000
    partida = responder(partida, partida.preguntado!.id)

    expect(partida.puntuacion).toBe(140)
    expect(tiempoJugado(partida, 7_000)).toBe(4_000)
  })
})

describe('Partida en Ubicación → nombre', () => {
  const cadiz: Elemento = { id: 'ca', nombre: 'Cádiz', nombreMostrado: 'Cádiz', alias: [], vecinos: [] }

  function partidaPreguntando(elemento: Elemento) {
    return iniciarPartida([elemento], azarFijo, reloj)
  }

  it('da igual mayúsculas y tildes: "cadiz" vale por "Cádiz"', () => {
    const partida = responderConTexto(partidaPreguntando(cadiz), 'cadiz')

    expect(partida.ultimaRespuesta).toEqual({ acierto: true, conPista: false, correcto: cadiz })
    expect(partida.acertados).toEqual(['ca'])
    expect(partida.terminada).toBe(true)
  })

  it('vale cualquier alias: "Gerona" por "Girona" y "Alacant" por "Alicante"', () => {
    const girona: Elemento = { id: 'gi', nombre: 'Girona', nombreMostrado: 'Girona (Gerona)', alias: ['Gerona'], vecinos: [] }
    const alicante: Elemento = { id: 'al', nombre: 'Alicante', nombreMostrado: 'Alicante', alias: ['Alacant'], vecinos: [] }

    expect(responderConTexto(partidaPreguntando(girona), 'Gerona').ultimaRespuesta?.acierto).toBe(true)
    expect(responderConTexto(partidaPreguntando(alicante), 'alacant').ultimaRespuesta?.acierto).toBe(true)
  })

  it('admite una errata en nombres de seis letras o más y la rechaza en los más cortos', () => {
    const valladolid: Elemento = { id: 'va', nombre: 'Valladolid', nombreMostrado: 'Valladolid', alias: [], vecinos: [] }
    const huelva: Elemento = { id: 'h', nombre: 'Huelva', nombreMostrado: 'Huelva', alias: [], vecinos: [] }
    const soria: Elemento = { id: 'so', nombre: 'Soria', nombreMostrado: 'Soria', alias: [], vecinos: [] }
    const acierta = (elemento: Elemento, texto: string) => {
      const partida = responderConTexto(partidaPreguntando(elemento), texto)
      if (partida.pista?.trasFallo) return false
      expect(partida.ultimaRespuesta).toBeDefined()
      return partida.ultimaRespuesta!.acierto
    }

    expect(acierta(valladolid, 'Valladoliz')).toBe(true)
    expect(acierta(valladolid, 'Valladoloz')).toBe(false)
    expect(acierta(huelva, 'Huelvo')).toBe(true)
    expect(acierta(huelva, 'Huelvaa')).toBe(true)
    expect(acierta(soria, 'Sorie')).toBe(false)
    expect(acierta(soria, 'Sori')).toBe(false)
  })

  it('no admite como errata el nombre o alias de otro elemento del tipo', () => {
    const palencia: Elemento = { id: 'pa', nombre: 'Palencia', nombreMostrado: 'Palencia', alias: [], vecinos: [] }
    const valencia: Elemento = { id: 'va', nombre: 'València', nombreMostrado: 'Valencia', alias: ['Valencia'], vecinos: [] }
    const partida = iniciarPartida([palencia, valencia], azarFijo, reloj)
    expect(partida.preguntado).toEqual(palencia)

    expect(responderConTexto(partida, 'valencia').fallos).toBe(1)
    expect(responderConTexto(partida, 'València').fallos).toBe(1)
    expect(responderConTexto(partida, 'Palencio').ultimaRespuesta?.acierto).toBe(true)
    expect(responderConTexto(partida, 'palencia').ultimaRespuesta?.acierto).toBe(true)
  })

  it('un texto incorrecto es un fallo: resta 25 y abre la pista sin desvelar el correcto ni pasar al siguiente', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responderConTexto(partida, partida.preguntado!.nombre)
    expect(partida.puntuacion).toBe(150)

    const fallado = partida.preguntado!
    const acertadoAntes = partida.ultimaRespuesta
    partida = responderConTexto(partida, 'Zeta')

    expect(partida.pista?.trasFallo).toBe(true)
    expect(partida.pista?.opciones).toContainEqual(fallado)
    expect(partida.pistasUsadas).toBe(0)
    expect(partida.preguntado).toEqual(fallado)
    expect(partida.ultimaRespuesta).toEqual(acertadoAntes)
    expect(partida.puntuacion).toBe(125)
    expect(partida.fallos).toBe(1)
    expect(partida.fallados).toEqual([fallado])
    expect(partida.pendientes).toBe(4)
    expect(partida.acertados).not.toContain(fallado.id)
  })

  it('un texto vacío pide pista: no cuenta como fallo ni pasa al siguiente elemento', () => {
    const inicial = iniciarPartida(elementos, azarFijo, reloj)

    const partida = responderConTexto(inicial, '   ')

    expect(partida.pista?.trasFallo).toBe(false)
    expect(partida.pista?.opciones).toHaveLength(4)
    expect(partida.pista?.opciones).toContainEqual(inicial.preguntado)
    expect(partida.pistasUsadas).toBe(0)
    expect(partida.fallos).toBe(0)
    expect(partida.puntuacion).toBe(0)
    expect(partida.preguntado).toEqual(inicial.preguntado)
    expect(partida.ultimaRespuesta).toBeUndefined()
  })
})

describe('Pista', () => {
  const azarSinBarajar = () => 0.99

  function catalogoConVecinos(vecinosDe: Record<string, string[]>): Elemento[] {
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => ({
      id,
      nombre: id.toUpperCase(),
      nombreMostrado: id.toUpperCase(),
      alias: [],
      vecinos: vecinosDe[id] ?? [],
    }))
  }

  function pistaSobreC(vecinosDeC: string[]) {
    let partida = iniciarPartida(catalogoConVecinos({ c: vecinosDeC }), azarSinBarajar, reloj)
    partida = responder(partida, 'a')
    partida = responder(partida, 'b')
    expect(partida.preguntado?.id).toBe('c')
    return pedirPista(partida)
  }

  function distractores(partida: Partida): string[] {
    const opciones = partida.pista!.opciones.map((opcion) => opcion.id)
    expect(opciones).toHaveLength(4)
    expect(opciones.filter((id) => id === 'c')).toHaveLength(1)
    return opciones.filter((id) => id !== 'c').sort()
  }

  it('prefiere como distractores los vecinos aún no preguntados', () => {
    const partida = pistaSobreC(['a', 'd', 'f', 'g'])

    expect(distractores(partida)).toEqual(['d', 'f', 'g'])
  })

  it('a falta de vecinos aún no preguntados, completa con vecinos ya preguntados antes que con otros elementos', () => {
    const partida = pistaSobreC(['a', 'b', 'e'])

    expect(distractores(partida)).toEqual(['a', 'b', 'e'])
  })

  it('a falta de vecinos, completa con cualquier otro elemento del tipo', () => {
    const partida = pistaSobreC(['g'])
    const elegidos = distractores(partida)

    expect(elegidos).toHaveLength(3)
    expect(elegidos).toContain('g')
    expect(new Set(elegidos).size).toBe(3)
  })

  it('en una vuelta posterior todos los vecinos ya se preguntaron y se eligen igualmente antes que otros elementos', () => {
    let partida = iniciarPartida(catalogoConVecinos({ c: ['e'], a: ['d', 'e'] }), azarSinBarajar, reloj)
    partida = cerrarCorreccion(responder(partida, 'b'))
    for (let i = 0; i < 6; i++) partida = responder(partida, partida.preguntado!.id)
    expect(partida.vuelta).toBe(2)
    expect(partida.preguntado?.id).toBe('a')

    partida = pedirPista(partida)

    expect(partida.pista!.opciones.map((opcion) => opcion.id)).toEqual(expect.arrayContaining(['a', 'd', 'e']))
  })

  it('elegir la opción correcta da 0 puntos, no es fallo y el elemento vuelve en la vuelta siguiente', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    const resuelto = partida.preguntado!
    partida = responderConTexto(partida, '')

    partida = elegirOpcion(partida, resuelto.id)

    expect(partida.ultimaRespuesta).toEqual({ acierto: false, conPista: true, correcto: resuelto })
    expect(partida.pista).toBeNull()
    expect(partida.puntuacion).toBe(150)
    expect(partida.fallos).toBe(0)
    expect(partida.fallados).toEqual([])
    expect(partida.acertados).not.toContain(resuelto.id)
    expect(partida.pendientes).toBe(4)
    expect(partida.preguntado).not.toEqual(resuelto)

    for (let i = 0; i < 3; i++) partida = responder(partida, partida.preguntado!.id)
    expect(partida.vuelta).toBe(2)
    expect(partida.preguntado).toEqual(resuelto)
    expect(partida.puntuacion).toBe(600)

    partida = responder(partida, resuelto.id)
    expect(partida.puntuacion).toBe(625)
    expect(partida.terminada).toBe(true)
    expect(partida.pistasUsadas).toBe(1)
  })

  it('elegir una opción incorrecta es otro fallo, desvela el correcto y el elemento sigue pendiente', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    const fallado = partida.preguntado!
    partida = responderConTexto(partida, 'Zeta')
    const distractor = partida.pista!.opciones.find((opcion) => opcion.id !== fallado.id)!

    partida = elegirOpcion(partida, distractor.id)

    expect(partida.ultimaRespuesta).toEqual({ acierto: false, conPista: false, correcto: fallado })
    expect(partida.pista).toBeNull()
    expect(partida.puntuacion).toBe(100)
    expect(partida.fallos).toBe(2)
    expect(partida.fallados).toEqual([fallado])
    expect(partida.acertados).not.toContain(fallado.id)
    expect(partida.pendientes).toBe(4)
    expect(partida.preguntado).not.toEqual(fallado)

    for (let i = 0; i < 3; i++) partida = responder(partida, partida.preguntado!.id)
    expect(partida.vuelta).toBe(2)
    expect(partida.preguntado).toEqual(fallado)
  })

  it('elegir una opción sin pista abierta no cambia la partida', () => {
    const partida = iniciarPartida(elementos, azarFijo, reloj)

    expect(elegirOpcion(partida, partida.preguntado!.id)).toBe(partida)
  })

  it('con una pista abierta, responder con texto o señalando y volver a pedir pista no cambian la partida', () => {
    const partida = pedirPista(iniciarPartida(elementos, azarFijo, reloj))
    const preguntado = partida.preguntado!

    expect(responderConTexto(partida, preguntado.nombre)).toBe(partida)
    expect(responderConTexto(partida, '')).toBe(partida)
    expect(responder(partida, preguntado.id)).toBe(partida)
    expect(pedirPista(partida)).toBe(partida)
  })

  it('recuenta las pistas usadas en la partida', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)

    partida = responderConTexto(partida, '')
    partida = elegirOpcion(partida, partida.preguntado!.id)
    expect(partida.pistasUsadas).toBe(1)
    partida = responderConTexto(partida, 'Zeta')
    expect(partida.pistasUsadas).toBe(1)
    partida = elegirOpcion(partida, partida.preguntado!.id)

    expect(partida.pistasUsadas).toBe(2)
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
      partida = cerrarCorreccion(responder(partida, elementos.find((elemento) => elemento.id !== preguntado.id)!.id))
    }
    expect(partida.puntuacion).toBe(0)

    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(150)
  })

  it('un acierto en vuelta posterior suma 25 sin bonus', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    const fallado = partida.preguntado!
    partida = cerrarCorreccion(responder(partida, elementos.find((elemento) => elemento.id !== fallado.id)!.id))

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
    partida = cerrarCorreccion(responder(partida, otro.id))
    for (let i = 0; i < 4; i++) {
      partida = responder(partida, partida.preguntado!.id)
    }
    partida = cerrarCorreccion(responder(partida, otro.id))
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

  it('abandonar con una pista abierta la cierra sin contarla como pista usada ni como fallo', () => {
    let partida = iniciarPartida(elementos, azarFijo, reloj)
    partida = responderConTexto(partida, '')

    partida = abandonar(partida)

    expect(partida.pista).toBeNull()
    expect(partida.pistasUsadas).toBe(0)
    expect(partida.fallos).toBe(0)
    expect(partida.abandonada).toBe(true)
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
