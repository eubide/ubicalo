import { beforeEach, describe, expect, it } from 'vitest'
import type { Elemento } from '../catalogo/catalogo'
import {
  abandonar,
  cerrarCorreccion,
  cerrarRepaso,
  correccionTrasFallo,
  elegirOpcion,
  elegirPregunta,
  iniciarPartida,
  marcarEnRepaso,
  pedirPista,
  responder,
  responderConTexto,
  resumirPartida,
  tiempoJugado,
  type Partida,
} from './partida'
import type { Prueba } from '../prueba/prueba'

const elementos: Elemento[] = [
  { id: 'a', nombre: 'Alfa', nombreMostrado: 'Alfa', alias: [], vecinos: [] },
  { id: 'b', nombre: 'Beta', nombreMostrado: 'Beta', alias: [], vecinos: [] },
  { id: 'c', nombre: 'Gamma', nombreMostrado: 'Gamma', alias: [], vecinos: [] },
  { id: 'd', nombre: 'Delta', nombreMostrado: 'Delta', alias: [], vecinos: [] },
  { id: 'e', nombre: 'Épsilon', nombreMostrado: 'Épsilon', alias: [], vecinos: [] },
]

const comunidadesNombreUbicar: Prueba = { tipo: 'comunidades', modo: 'nombre-ubicar' }

const azarFijo = () => 0.5

let ahora = 0
const reloj = () => ahora

beforeEach(() => {
  ahora = 0
})

describe('Partida en Nombre → ubicar', () => {
  it('la primera vuelta pregunta todos los elementos y la partida termina al acertarlos', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
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
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
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
    const { partida, correcto, elegido } = fallarLaPrimera(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj))

    expect(partida.correccion).toMatchObject({ elegido, correcto })
  })

  it('responder con un id que no es de ningún elemento se ignora', () => {
    const partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    expect(responder(partida, 'desconocido')).toBe(partida)
  })

  it('abandonar durante la Corrección la cierra y no cuenta su tiempo', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    ahora = 2_000
    partida = fallarLaPrimera(partida).partida

    ahora = 4_000
    partida = abandonar(partida)

    expect(partida.correccion).toBeNull()
    expect(partida.pausadaDesde).toBeNull()
    expect(tiempoJugado(partida, 60_000)).toBe(2_000)
  })

  it('un acierto sin ayuda no abre Corrección', () => {
    const partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    expect(responder(partida, partida.preguntado!.id).correccion).toBeNull()
  })

  it('las respuestas durante la Corrección se ignoran hasta cerrarla', () => {
    const { partida } = fallarLaPrimera(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj))

    expect(responder(partida, partida.preguntado!.id)).toBe(partida)

    const cerrada = cerrarCorreccion(partida)
    expect(cerrada.correccion).toBeNull()
    expect(responder(cerrada, cerrada.preguntado!.id).puntuacion).toBe(150)
  })

  it('el tiempo de la Corrección no suma al tiempo jugado ni al bonus de la pregunta siguiente', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
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
    return iniciarPartida(comunidadesNombreUbicar, [elemento], azarFijo, reloj)
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
      if (partida.pista) return false
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
    const partida = iniciarPartida(comunidadesNombreUbicar, [palencia, valencia], azarFijo, reloj)
    expect(partida.preguntado).toEqual(palencia)

    expect(responderConTexto(partida, 'valencia').fallos).toBe(1)
    expect(responderConTexto(partida, 'València').fallos).toBe(1)
    expect(responderConTexto(partida, 'Palencio').ultimaRespuesta?.acierto).toBe(true)
    expect(responderConTexto(partida, 'palencia').ultimaRespuesta?.acierto).toBe(true)
  })

  it('un texto incorrecto es un fallo: resta 25 y abre la pista sin desvelar el correcto ni pasar al siguiente', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responderConTexto(partida, partida.preguntado!.nombre)
    expect(partida.puntuacion).toBe(150)

    const fallado = partida.preguntado!
    const acertadoAntes = partida.ultimaRespuesta
    partida = responderConTexto(partida, 'Zeta')

    expect(partida.pista?.escrito).toBe('Zeta')
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

  it('un texto incorrecto abre la pista con lo que escribió el alumno, sin Corrección', () => {
    const partida = responderConTexto(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj), '  Zeta ')

    expect(partida.pista?.escrito).toBe('Zeta')
    expect(partida.correccion).toBeNull()
  })

  it('lo escrito se muestra sin la puntuación final: "Soria." queda "Soria"', () => {
    const partida = responderConTexto(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj), 'Soria. ')

    expect(partida.pista?.escrito).toBe('Soria')
  })

  it('un texto vacío pide pista: no cuenta como fallo ni pasa al siguiente elemento', () => {
    const inicial = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    const partida = responderConTexto(inicial, '   ')

    expect(partida.pista?.escrito).toBeNull()
    expect(partida.pista?.opciones).toHaveLength(4)
    expect(partida.pista?.opciones).toContainEqual(inicial.preguntado)
    expect(partida.pistasUsadas).toBe(0)
    expect(partida.fallos).toBe(0)
    expect(partida.puntuacion).toBe(0)
    expect(partida.preguntado).toEqual(inicial.preguntado)
    expect(partida.ultimaRespuesta).toBeUndefined()
  })
})

describe('Corrección en Ubicación → nombre', () => {
  function pistaTrasFallo() {
    const partida = responderConTexto(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj), 'Zeta')
    const correcto = partida.preguntado!
    const distractor = partida.pista!.opciones.find((opcion) => opcion.id !== correcto.id)!
    return { partida, correcto, distractor }
  }

  it('elegir un distractor abre durante 3 s una Corrección tras fallo con lo elegido y el correcto', () => {
    const { partida, correcto, distractor } = pistaTrasFallo()

    const { correccion } = elegirOpcion(partida, distractor.id)

    expect(correccion).toEqual({ elegido: distractor, correcto, duracion: 3_000 })
    expect(correccionTrasFallo(correccion!)).toBe(true)
  })

  it('elegir la opción correcta abre durante 2 s una Corrección con pista', () => {
    const { partida, correcto } = pistaTrasFallo()

    const { correccion } = elegirOpcion(partida, correcto.id)

    expect(correccion).toEqual({ elegido: correcto, correcto, duracion: 2_000 })
    expect(correccionTrasFallo(correccion!)).toBe(false)
  })

  it('elegir un id que no está entre las opciones de la pista se ignora', () => {
    const { partida } = pistaTrasFallo()
    const fuera = elementos.find((elemento) => !partida.pista!.opciones.includes(elemento))!

    expect(elegirOpcion(partida, fuera.id)).toBe(partida)
  })

  it('durante la Corrección se ignoran el texto, el texto vacío, las opciones y señalar', () => {
    const { partida: conPista, correcto, distractor } = pistaTrasFallo()
    const partida = elegirOpcion(conPista, distractor.id)
    const preguntado = partida.preguntado!

    expect(responderConTexto(partida, preguntado.nombre)).toBe(partida)
    expect(responderConTexto(partida, '')).toBe(partida)
    expect(pedirPista(partida)).toBe(partida)
    expect(elegirOpcion(partida, correcto.id)).toBe(partida)
    expect(elegirOpcion(partida, distractor.id)).toBe(partida)
    expect(responder(partida, preguntado.id)).toBe(partida)
  })

  it('el tiempo de la Corrección no suma al tiempo jugado ni al bonus de la pregunta siguiente', () => {
    ahora = 1_000
    let partida = responderConTexto(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj), '')
    ahora = 3_000
    partida = elegirOpcion(partida, partida.preguntado!.id)
    expect(tiempoJugado(partida, 4_500)).toBe(2_000)

    ahora = 5_000
    partida = cerrarCorreccion(partida)
    ahora = 7_000
    partida = responderConTexto(partida, partida.preguntado!.nombre)

    expect(partida.puntuacion).toBe(140)
    expect(tiempoJugado(partida, 7_000)).toBe(4_000)
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
    let partida = iniciarPartida(comunidadesNombreUbicar, catalogoConVecinos({ c: vecinosDeC }), azarSinBarajar, reloj)
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
    let partida = iniciarPartida(comunidadesNombreUbicar, catalogoConVecinos({ c: ['e'], a: ['d', 'e'] }), azarSinBarajar, reloj)
    partida = cerrarCorreccion(responder(partida, 'b'))
    for (let i = 0; i < 6; i++) partida = responder(partida, partida.preguntado!.id)
    expect(partida.vuelta).toBe(2)
    expect(partida.preguntado?.id).toBe('a')

    partida = pedirPista(partida)

    expect(partida.pista!.opciones.map((opcion) => opcion.id)).toEqual(expect.arrayContaining(['a', 'd', 'e']))
  })

  it('elegir la opción correcta da 0 puntos, no es fallo y el elemento vuelve en la vuelta siguiente', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    const resuelto = partida.preguntado!
    partida = responderConTexto(partida, '')

    partida = cerrarCorreccion(elegirOpcion(partida, resuelto.id))

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
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    const fallado = partida.preguntado!
    partida = responderConTexto(partida, 'Zeta')
    const distractor = partida.pista!.opciones.find((opcion) => opcion.id !== fallado.id)!

    partida = cerrarCorreccion(elegirOpcion(partida, distractor.id))

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
    const partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    expect(elegirOpcion(partida, partida.preguntado!.id)).toBe(partida)
  })

  it('con una pista abierta, responder con texto o señalando y volver a pedir pista no cambian la partida', () => {
    const partida = pedirPista(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj))
    const preguntado = partida.preguntado!

    expect(responderConTexto(partida, preguntado.nombre)).toBe(partida)
    expect(responderConTexto(partida, '')).toBe(partida)
    expect(responder(partida, preguntado.id)).toBe(partida)
    expect(pedirPista(partida)).toBe(partida)
  })

  it('recuenta las pistas usadas en la partida', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    partida = responderConTexto(partida, '')
    partida = cerrarCorreccion(elegirOpcion(partida, partida.preguntado!.id))
    expect(partida.pistasUsadas).toBe(1)
    partida = responderConTexto(partida, 'Zeta')
    expect(partida.pistasUsadas).toBe(1)
    partida = elegirOpcion(partida, partida.preguntado!.id)

    expect(partida.pistasUsadas).toBe(2)
  })
})

function fallarSeñalando(partida: Partida): Partida {
  const preguntado = partida.preguntado!
  return cerrarCorreccion(responder(partida, elementos.find((elemento) => elemento.id !== preguntado.id)!.id))
}

function fallarEscribiendo(partida: Partida): Partida {
  const conPista = responderConTexto(partida, 'Zeta')
  const distractor = conPista.pista!.opciones.find((opcion) => opcion.id !== partida.preguntado!.id)!
  return cerrarCorreccion(elegirOpcion(conPista, distractor.id))
}

describe('Racha de fallos', () => {
  it('suma una por pregunta fallada y un acierto sin ayuda la reinicia', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    expect(partida.rachaDeFallos).toEqual([])

    const primero = partida.preguntado!
    partida = fallarSeñalando(partida)
    const segundo = partida.preguntado!
    partida = fallarSeñalando(partida)
    expect(partida.rachaDeFallos).toEqual([primero, segundo])

    partida = responder(partida, partida.preguntado!.id)
    expect(partida.rachaDeFallos).toEqual([])
  })

  it('un texto incorrecto y una opción incorrecta en la misma pregunta suman una sola', () => {
    const partida = fallarEscribiendo(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj))

    expect(partida.fallos).toBe(2)
    expect(partida.rachaDeFallos).toHaveLength(1)
  })

  it('un acierto con pista no la cambia, ni tras pedirla ni tras un texto incorrecto', () => {
    let partida = fallarEscribiendo(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj))
    partida = fallarEscribiendo(partida)

    partida = cerrarCorreccion(elegirOpcion(pedirPista(partida), partida.preguntado!.id))
    expect(partida.rachaDeFallos).toHaveLength(2)

    partida = cerrarCorreccion(elegirOpcion(responderConTexto(partida, 'Zeta'), partida.preguntado!.id))
    expect(partida.rachaDeFallos).toHaveLength(2)
  })

  function segundaVueltaConDosFallosSeguidos() {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responderConTexto(partida, partida.preguntado!.nombre)
    partida = responderConTexto(partida, partida.preguntado!.nombre)
    const conPista = partida.preguntado!
    partida = cerrarCorreccion(elegirOpcion(pedirPista(partida), conPista.id))
    const cuarto = partida.preguntado!
    partida = fallarEscribiendo(partida)
    const quinto = partida.preguntado!
    partida = fallarEscribiendo(partida)
    expect(partida.vuelta).toBe(2)
    expect(partida.preguntado).toEqual(conPista)
    return { partida, conPista, cuarto, quinto }
  }

  it('sigue de una vuelta a la siguiente: fallar la primera pregunta de la vuelta 2 abre el Repaso', () => {
    const { partida, conPista, cuarto, quinto } = segundaVueltaConDosFallosSeguidos()
    expect(partida.rachaDeFallos).toEqual([cuarto, quinto])

    const tras = fallarEscribiendo(partida)

    expect(tras.repaso?.elementos).toEqual([cuarto, quinto, conPista])
  })

  it('un acierto sin ayuda en una vuelta posterior la reinicia', () => {
    const { partida } = segundaVueltaConDosFallosSeguidos()

    const tras = responderConTexto(partida, partida.preguntado!.nombre)

    expect(tras.ultimaRespuesta?.acierto).toBe(true)
    expect(tras.rachaDeFallos).toEqual([])
  })
})

describe('Repaso', () => {
  function tresFallosSeñalando() {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    const fallados: Elemento[] = []
    for (let i = 0; i < 3; i++) {
      fallados.push(partida.preguntado!)
      partida = fallarSeñalando(partida)
    }
    return { partida, fallados }
  }

  it('empieza al cerrarse la Corrección del tercer fallo seguido con esos elementos y la Racha vuelve a 0', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    const primero = partida.preguntado!
    partida = fallarSeñalando(partida)
    const segundo = partida.preguntado!
    partida = fallarSeñalando(partida)
    const tercero = partida.preguntado!
    partida = responder(partida, elementos.find((elemento) => elemento.id !== tercero.id)!.id)
    expect(partida.repaso).toBeNull()

    partida = cerrarCorreccion(partida)

    expect(partida.repaso?.elementos).toEqual([primero, segundo, tercero])
    expect(partida.repaso?.marcados).toEqual([])
    expect(partida.rachaDeFallos).toEqual([])
  })

  it('muestra los elementos de la Racha, no todos los fallados de la partida', () => {
    let partida = fallarSeñalando(iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj))
    partida = responder(partida, partida.preguntado!.id)
    const racha: Elemento[] = []
    for (let i = 0; i < 3; i++) {
      racha.push(partida.preguntado!)
      partida = fallarSeñalando(partida)
    }

    expect(partida.fallados).toHaveLength(4)
    expect(partida.repaso?.elementos).toEqual(racha)
  })

  it('un elemento fallado varias veces en la Racha aparece una sola vez', () => {
    const [x, y] = elementos
    let partida = iniciarPartida(comunidadesNombreUbicar, [x, y], azarFijo, reloj)
    const primero = partida.preguntado!
    const otro = primero.id === x.id ? y : x
    partida = cerrarCorreccion(responder(partida, otro.id))
    partida = cerrarCorreccion(responder(partida, primero.id))
    partida = cerrarCorreccion(responder(partida, otro.id))

    expect(partida.repaso?.elementos).toEqual([primero, otro])
  })

  it('el mismo elemento fallado tres veces seguidas abre un Repaso con ese único elemento', () => {
    const [x, y] = elementos
    let partida = iniciarPartida(comunidadesNombreUbicar, [x, y], azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    const pendiente = partida.preguntado!
    const otro = pendiente.id === x.id ? y : x
    for (let i = 0; i < 3; i++) partida = cerrarCorreccion(responder(partida, otro.id))

    expect(partida.repaso?.elementos).toEqual([pendiente])

    partida = marcarEnRepaso(partida, pendiente.id)
    expect(partida.repaso).toBeNull()
  })

  it('en Nombre → ubicar termina al marcar los tres en cualquier orden; otros ids y repeticiones se ignoran', () => {
    let { partida, fallados } = tresFallosSeñalando()
    const [primero, segundo, tercero] = fallados
    const ajeno = elementos.find((elemento) => !fallados.includes(elemento))!

    expect(marcarEnRepaso(partida, ajeno.id)).toBe(partida)
    partida = marcarEnRepaso(partida, tercero.id)
    expect(marcarEnRepaso(partida, tercero.id)).toBe(partida)
    partida = marcarEnRepaso(partida, primero.id)
    expect(partida.repaso?.marcados).toEqual([tercero.id, primero.id])

    partida = marcarEnRepaso(partida, segundo.id)

    expect(partida.repaso).toBeNull()
    expect(partida.pausadaDesde).toBeNull()
  })

  it('durante el Repaso se ignoran señalar, el texto, el texto vacío y las opciones', () => {
    const { partida } = tresFallosSeñalando()
    const preguntado = partida.preguntado!

    expect(responder(partida, preguntado.id)).toBe(partida)
    expect(responderConTexto(partida, preguntado.nombre)).toBe(partida)
    expect(responderConTexto(partida, '')).toBe(partida)
    expect(pedirPista(partida)).toBe(partida)
    expect(elegirOpcion(partida, preguntado.id)).toBe(partida)
  })

  it('marcar o cerrar sin Repaso no cambia la partida', () => {
    const partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    expect(marcarEnRepaso(partida, partida.preguntado!.id)).toBe(partida)
    expect(cerrarRepaso(partida)).toBe(partida)
  })

  it('en Ubicación → nombre termina al cerrarlo tras 4 s, sin contar su tiempo ni restar bonus a la pregunta puntuable siguiente', () => {
    let partida = iniciarPartida({ tipo: 'comunidades', modo: 'ubicacion-nombre' }, elementos, azarFijo, reloj)
    ahora = 1_000
    partida = responderConTexto(partida, 'Zeta')
    partida = elegirOpcion(partida, partida.pista!.opciones.find((opcion) => opcion.id !== partida.preguntado!.id)!.id)
    ahora = 4_000
    partida = cerrarCorreccion(partida)
    ahora = 5_000
    partida = fallarEscribiendo(partida)
    ahora = 9_000
    partida = responderConTexto(partida, 'Zeta')
    partida = elegirOpcion(partida, partida.pista!.opciones.find((opcion) => opcion.id !== partida.preguntado!.id)!.id)
    ahora = 12_000
    partida = cerrarCorreccion(partida)

    expect(partida.repaso).not.toBeNull()
    expect(partida.puntuacion).toBe(0)
    expect(tiempoJugado(partida, 14_000)).toBe(6_000)

    ahora = 16_000
    partida = cerrarRepaso(partida)
    expect(partida.repaso).toBeNull()
    expect(tiempoJugado(partida, 16_000)).toBe(6_000)

    ahora = 17_000
    partida = elegirOpcion(partida, partida.preguntado!.id)
    ahora = 19_000
    partida = cerrarCorreccion(partida)
    ahora = 21_000
    partida = responderConTexto(partida, partida.preguntado!.nombre)

    expect(partida.puntuacion).toBe(140)
    expect(tiempoJugado(partida, 21_000)).toBe(9_000)
  })

  it('abandonar durante el Repaso lo cierra y no cuenta su tiempo', () => {
    let { partida } = tresFallosSeñalando()
    ahora = 5_000

    partida = abandonar(partida)

    expect(partida.repaso).toBeNull()
    expect(partida.pausadaDesde).toBeNull()
    expect(tiempoJugado(partida, 60_000)).toBe(0)
  })
})

describe('Pista de área', () => {
  const azarSinBarajar = () => 0.99
  const provinciasNombreUbicar: Prueba = { tipo: 'provincias', modo: 'nombre-ubicar' }

  function catalogoDePrueba(cambiosEnE: Partial<Elemento> = {}): Elemento[] {
    const comunidadDe: Record<string, string> = { a: 'X', b: 'X', c: 'Y', d: 'Y', e: 'Y', f: 'X' }
    return Object.entries(comunidadDe).map(([id, comunidad]) => ({
      id,
      nombre: id.toUpperCase(),
      nombreMostrado: id.toUpperCase(),
      alias: [],
      vecinos: id === 'e' ? ['d', 'f'] : [],
      comunidad,
      ...(id === 'e' && cambiosEnE),
    }))
  }

  function fallarLaPregunta(partida: Partida): Partida {
    return cerrarCorreccion(responder(partida, partida.preguntado!.id === 'a' ? 'b' : 'a'))
  }

  function trasElRepaso(catalogo = catalogoDePrueba(), prueba = provinciasNombreUbicar): Partida {
    let partida = iniciarPartida(prueba, catalogo, azarSinBarajar, reloj)
    partida = responder(partida, 'a')
    for (let i = 0; i < 3; i++) partida = fallarLaPregunta(partida)
    expect(partida.repaso?.elementos.map((elemento) => elemento.id)).toEqual(['b', 'c', 'd'])
    return cerrarRepaso(partida)
  }

  it('con provincias, solo la pregunta siguiente al Repaso ilumina las provincias de su comunidad autónoma', () => {
    let partida = iniciarPartida(provinciasNombreUbicar, catalogoDePrueba(), azarSinBarajar, reloj)
    expect(partida.pistaDeArea).toBeNull()

    partida = trasElRepaso()

    expect(partida.preguntado?.id).toBe('e')
    expect(partida.pistaDeArea).toEqual(['c', 'd', 'e'])

    partida = cerrarCorreccion(responder(partida, 'e'))
    expect(partida.preguntado?.id).toBe('f')
    expect(partida.pistaDeArea).toBeNull()
  })

  it('una provincia única en su comunidad ilumina también sus provincias vecinas', () => {
    expect(trasElRepaso(catalogoDePrueba({ comunidad: 'Z' })).pistaDeArea).toEqual(['e', 'd', 'f'])
  })

  it('con comunidades, la pregunta siguiente al Repaso ilumina sus Vecinos', () => {
    expect(trasElRepaso(catalogoDePrueba(), comunidadesNombreUbicar).pistaDeArea).toEqual(['d', 'f'])
  })

  it('en el relieve, la pregunta siguiente al Repaso ilumina sus Vecinos', () => {
    expect(trasElRepaso(catalogoDePrueba(), { tipo: 'cordilleras-y-sierras', modo: 'nombre-ubicar' }).pistaDeArea).toEqual(['d', 'f'])
    expect(trasElRepaso(catalogoDePrueba(), { tipo: 'picos', modo: 'nombre-ubicar' }).pistaDeArea).toEqual(['d', 'f'])
  })

  it('una comunidad sin Vecinos se ilumina a sí misma', () => {
    expect(trasElRepaso(catalogoDePrueba({ vecinos: [] }), comunidadesNombreUbicar).pistaDeArea).toEqual(['e'])
  })

  it('Ceuta o Melilla iluminan las dos ciudades autónomas, en provincias y en comunidades', () => {
    const catalogo = catalogoDePrueba({ ciudadAutonoma: true }).map((elemento) =>
      elemento.id === 'b' ? { ...elemento, ciudadAutonoma: true as const } : elemento,
    )

    expect(trasElRepaso(catalogo).pistaDeArea).toEqual(['b', 'e'])
    expect(trasElRepaso(catalogo, comunidadesNombreUbicar).pistaDeArea).toEqual(['b', 'e'])
  })

  it('sin nada que iluminar no hay Pista de área y acertar puntúa como siempre', () => {
    let partida = trasElRepaso(catalogoDePrueba({ comunidad: undefined }))
    expect(partida.pistaDeArea).toBeNull()

    partida = responder(partida, 'e')

    expect(partida.correccion).toBeNull()
    expect(partida.puntuacion).toBe(225)
  })

  it('acertar con ella da 0 puntos, sigue pendiente, no es acierto a la primera, no cambia la Racha y abre la Corrección con pista', () => {
    let partida = trasElRepaso()
    expect(partida.puntuacion).toBe(75)
    const e = partida.preguntado!

    partida = responder(partida, 'e')

    expect(partida.correccion).toEqual({ elegido: e, correcto: e, duracion: 2_000 })
    expect(partida.ultimaRespuesta).toEqual({ acierto: false, conPista: true, correcto: e })
    expect(partida.puntuacion).toBe(75)
    expect(partida.aciertosALaPrimera).toBe(1)
    expect(partida.acertados).toEqual(['a'])
    expect(partida.pendientes).toBe(5)
    expect(partida.fallos).toBe(3)
    expect(partida.pistasUsadas).toBe(0)
    expect(partida.rachaDeFallos).toEqual([])
  })

  it('fallar con ella es un Fallo normal: resta 25, abre la Corrección y suma 1 a la Racha', () => {
    let partida = trasElRepaso()
    const [a, e] = ['a', 'e'].map((id) => partida.elementos.find((elemento) => elemento.id === id)!)

    partida = responder(partida, 'a')

    expect(partida.correccion).toEqual({ elegido: a, correcto: e, duracion: 3_000 })
    expect(partida.puntuacion).toBe(50)
    expect(partida.fallos).toBe(4)
    expect(partida.rachaDeFallos).toEqual([e])

    partida = fallarLaPregunta(fallarLaPregunta(cerrarCorreccion(partida)))
    expect(partida.repaso?.elementos.map((elemento) => elemento.id)).toEqual(['e', 'f', 'b'])
  })

  it('en Ubicación → nombre los toques del Repaso se ignoran y al cerrarlo la pregunta siguiente abre directamente la Pista, que cuenta como pista usada', () => {
    let partida = iniciarPartida({ tipo: 'provincias', modo: 'ubicacion-nombre' }, catalogoDePrueba(), azarSinBarajar, reloj)
    partida = responderConTexto(partida, 'A')
    for (let i = 0; i < 3; i++) partida = fallarEscribiendo(partida)
    expect(partida.repaso?.elementos.map((elemento) => elemento.id)).toEqual(['b', 'c', 'd'])
    expect(marcarEnRepaso(partida, 'b')).toBe(partida)

    partida = cerrarRepaso(partida)

    const e = partida.preguntado!
    expect(e.id).toBe('e')
    expect(partida.pista?.opciones).toHaveLength(4)
    expect(partida.pista?.escrito).toBeNull()
    expect(partida.pistaDeArea).toBeNull()
    expect(responderConTexto(partida, 'E')).toBe(partida)
    expect(partida.pistasUsadas).toBe(3)

    partida = elegirOpcion(partida, 'e')

    expect(partida.correccion).toEqual({ elegido: e, correcto: e, duracion: 2_000 })
    expect(partida.fallos).toBe(6)
    expect(partida.pistasUsadas).toBe(4)
  })
})

describe('Puntuación', () => {
  it('un acierto a la primera inmediato suma 100 más 50 de bonus', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    partida = responder(partida, partida.preguntado!.id)

    expect(partida.puntuacion).toBe(150)
  })

  it('a los 5 s de mostrarse el elemento, el bonus lineal vale la mitad: 25', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    ahora = 5_000
    partida = responder(partida, partida.preguntado!.id)

    expect(partida.puntuacion).toBe(125)
  })

  it('el bonus se redondea a entero al sumarse: 140 a los 2 s y 138 a los 2,5 s', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    ahora = 2_000
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(140)

    ahora = 4_500
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(278)
  })

  it('sin bonus si el acierto a la primera llega a los 10 s o más', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    ahora = 10_000
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(100)

    ahora = 22_000
    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(200)
  })

  it('un fallo resta 25', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)

    const preguntado = partida.preguntado!
    partida = responder(partida, elementos.find((elemento) => elemento.id !== preguntado.id)!.id)

    expect(partida.puntuacion).toBe(125)
  })

  it('la puntuación no baja de 0 tras varios fallos', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)

    for (let i = 0; i < 2; i++) {
      const preguntado = partida.preguntado!
      partida = cerrarCorreccion(responder(partida, elementos.find((elemento) => elemento.id !== preguntado.id)!.id))
    }
    expect(partida.puntuacion).toBe(0)

    partida = responder(partida, partida.preguntado!.id)
    expect(partida.puntuacion).toBe(150)
  })

  it('un acierto en vuelta posterior suma 25 sin bonus', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
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
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    const fallado = partida.preguntado!
    const otro = elementos.find((elemento) => elemento.id !== fallado.id)!

    ahora = 3_000
    partida = responder(partida, otro.id)
    ahora = 4_000
    partida = cerrarCorreccion(partida)
    for (let i = 0; i < 4; i++) {
      partida = responder(partida, partida.preguntado!.id)
    }
    partida = responder(partida, otro.id)
    expect(tiempoJugado(partida, 5_000)).toBe(2_000)
    ahora = 6_000
    partida = cerrarCorreccion(partida)

    ahora = 10_000
    partida = responder(partida, fallado.id)

    expect(partida.terminada).toBe(true)
    expect(partida.fallos).toBe(2)
    expect(partida.fallados).toEqual([fallado])
    expect(tiempoJugado(partida, 60_000)).toBe(6_000)
  })

  it('recuenta 3 aciertos a la primera de 5 si uno se falla y otro se resuelve con pista', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    const fallado = partida.preguntado!
    partida = cerrarCorreccion(responder(partida, elementos.find((elemento) => elemento.id !== fallado.id)!.id))
    partida = cerrarCorreccion(elegirOpcion(pedirPista(partida), partida.preguntado!.id))
    for (let i = 0; i < 3; i++) {
      partida = responder(partida, partida.preguntado!.id)
    }
    while (!partida.terminada) partida = responder(partida, partida.preguntado!.id)

    expect(partida.aciertosALaPrimera).toBe(3)
  })
})

describe('Abandono', () => {
  it('abandonar termina la partida con pendientes, conserva la puntuación y la marca como abandonada', () => {
    ahora = 1_000
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
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
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
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
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responderConTexto(partida, '')

    partida = abandonar(partida)

    expect(partida.pista).toBeNull()
    expect(partida.pistasUsadas).toBe(0)
    expect(partida.fallos).toBe(0)
    expect(partida.abandonada).toBe(true)
  })

  it('una partida abandonada conserva sus 2 aciertos a la primera sin contar los pendientes', () => {
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    partida = responder(partida, partida.preguntado!.id)
    const fallado = partida.preguntado!
    partida = cerrarCorreccion(responder(partida, elementos.find((elemento) => elemento.id !== fallado.id)!.id))
    partida = responder(partida, partida.preguntado!.id)

    partida = abandonar(partida)

    expect(partida.aciertosALaPrimera).toBe(2)
  })

  it('abandonar una partida ya terminada no la cambia', () => {
    ahora = 1_000
    let partida = iniciarPartida(comunidadesNombreUbicar, elementos, azarFijo, reloj)
    ahora = 4_000
    while (!partida.terminada) partida = responder(partida, partida.preguntado!.id)

    ahora = 9_000
    const tras = abandonar(partida)

    expect(tras.abandonada).toBe(false)
    expect(tras.terminada).toBe(true)
    expect(tiempoJugado(tras, 60_000)).toBe(3_000)
  })
})

describe('Jerarquía: elementos que se responden tocando otro elemento del mapa', () => {
  const jerarquia: Prueba = { tipo: 'jerarquia', modo: 'nombre-ubicar' }
  const cordilleras: Elemento[] = [
    { id: 'central', nombre: 'Sistema Central', nombreMostrado: 'Sistema Central', alias: [], vecinos: ['iberico'] },
    { id: 'iberico', nombre: 'Sistema Ibérico', nombreMostrado: 'Sistema Ibérico', alias: [], vecinos: ['central'] },
  ]
  const sierras: Elemento[] = [
    { id: 'gredos', nombre: 'Sierra de Gredos', nombreMostrado: 'Sierra de Gredos', alias: [], vecinos: ['iberico'], respuesta: 'central' },
    { id: 'gata', nombre: 'Sierra de Gata', nombreMostrado: 'Sierra de Gata', alias: [], vecinos: ['iberico'], respuesta: 'central' },
    { id: 'urbion', nombre: 'Picos de Urbión', nombreMostrado: 'Picos de Urbión', alias: [], vecinos: ['central'], respuesta: 'iberico' },
    { id: 'demanda', nombre: 'Sierra de la Demanda', nombreMostrado: 'Sierra de la Demanda', alias: [], vecinos: ['central'], respuesta: 'iberico' },
  ]
  const azarSinBarajar = () => 0.99

  it('tocar la cordillera madre es acierto y tocar otra es fallo con Corrección sobre la cordillera tocada', () => {
    let partida = iniciarPartida(jerarquia, sierras, azarSinBarajar, reloj, cordilleras)
    expect(partida.preguntado?.id).toBe('gredos')

    partida = responder(partida, 'central')
    expect(partida.ultimaRespuesta?.acierto).toBe(true)
    expect(partida.puntuacion).toBe(150)

    expect(partida.preguntado?.id).toBe('gata')
    partida = responder(partida, 'iberico')
    expect(partida.correccion?.elegido.id).toBe('iberico')
    expect(partida.correccion?.correcto.id).toBe('gata')
    expect(correccionTrasFallo(partida.correccion!)).toBe(true)
  })

  it('tocar un id que no está en el mapa no cambia nada', () => {
    const partida = iniciarPartida(jerarquia, sierras, azarSinBarajar, reloj, cordilleras)
    expect(responder(partida, 'gata')).toBe(partida)
  })

  it('en el Repaso, tocar una cordillera marca todos los elementos fallados que responden a ella', () => {
    let partida = iniciarPartida(jerarquia, sierras, azarSinBarajar, reloj, cordilleras)
    for (let i = 0; i < 3; i++) partida = cerrarCorreccion(responder(partida, partida.preguntado!.respuesta === 'central' ? 'iberico' : 'central'))
    expect(partida.repaso?.elementos.map((elemento) => elemento.id)).toEqual(['gredos', 'gata', 'urbion'])

    partida = marcarEnRepaso(partida, 'central')
    expect(partida.repaso?.marcados).toEqual(['gredos', 'gata'])

    partida = marcarEnRepaso(partida, 'iberico')
    expect(partida.repaso).toBeNull()
    expect(partida.pistaDeArea).toEqual(['central'])
  })
})

describe('Simulacro: desbloqueados y elegir pregunta', () => {
  const sinDependencias: Elemento = { id: 'a', nombre: 'A', nombreMostrado: 'A', alias: [], vecinos: [], desbloqueaCon: [] }
  const tambienSinDependencias: Elemento = {
    id: 'b',
    nombre: 'B',
    nombreMostrado: 'B',
    alias: [],
    vecinos: [],
    desbloqueaCon: [],
  }
  const dependeDeA: Elemento = { id: 'c', nombre: 'C', nombreMostrado: 'C', alias: [], vecinos: [], desbloqueaCon: ['a'] }
  const simulacro: Elemento[] = [sinDependencias, tambienSinDependencias, dependeDeA]
  const simulacroNombreUbicar: Prueba = { tipo: 'simulacro', modo: 'nombre-ubicar' }
  const azarSinBarajar = () => 0.99

  it('al principio, desbloqueados son solo los elementos sin dependencias pendientes', () => {
    const partida = iniciarPartida(simulacroNombreUbicar, simulacro, azarSinBarajar, reloj)

    expect([...partida.desbloqueados].sort()).toEqual(['a', 'b'])
  })

  it('elegir pregunta con un id bloqueado no cambia la partida', () => {
    const partida = iniciarPartida(simulacroNombreUbicar, simulacro, azarSinBarajar, reloj)

    expect(elegirPregunta(partida, 'c')).toBe(partida)
  })

  it('elegir pregunta con un id desbloqueado, aunque no sea el primero de la cola, lo convierte en Preguntado', () => {
    const partida = iniciarPartida(simulacroNombreUbicar, simulacro, azarSinBarajar, reloj)
    expect(partida.preguntado?.id).toBe('a')

    const elegida = elegirPregunta(partida, 'b')

    expect(elegida.preguntado?.id).toBe('b')
  })

  it('tras acertar el elemento del que depende, pasa a desbloqueados', () => {
    let partida = iniciarPartida(simulacroNombreUbicar, simulacro, azarSinBarajar, reloj)
    expect(partida.desbloqueados).not.toContain('c')

    partida = responder(partida, 'a')

    expect(partida.desbloqueados).toContain('c')
  })
})
