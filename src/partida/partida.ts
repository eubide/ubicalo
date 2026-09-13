import type { Elemento } from '../catalogo/catalogo'
import type { Prueba } from '../prueba/prueba'

export type Azar = () => number

export type Reloj = () => number

export interface Respuesta {
  acierto: boolean
  conPista: boolean
  correcto: Elemento
}

export interface Pista {
  opciones: Elemento[]
  trasFallo: boolean
  escrito: string | null
}

export interface Correccion {
  elegido: Elemento
  correcto: Elemento
  trasFallo: boolean
  duracion: number
}

export const DURACION_CORRECCION_TRAS_FALLO = 3_000

export const DURACION_CORRECCION_CON_PISTA = 2_000

export interface Partida {
  elementos: Elemento[]
  azar: Azar
  reloj: Reloj
  inicio: number
  fin: number | null
  pausadaDesde: number | null
  tiempoEnPausa: number
  mostradoEn: number
  puntuacion: number
  aciertosALaPrimera: number
  fallos: number
  fallados: Elemento[]
  pista: Pista | null
  pistasUsadas: number
  correccion: Correccion | null
  cola: Elemento[]
  siguienteVuelta: Elemento[]
  acertados: string[]
  vuelta: number
  preguntado: Elemento | null
  pendientes: number
  terminada: boolean
  abandonada: boolean
  ultimaRespuesta?: Respuesta
}

type CamposDerivados = 'fin' | 'mostradoEn' | 'preguntado' | 'pendientes' | 'terminada'

function barajar<T>(lista: T[], azar: Azar): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function construir(partida: Omit<Partida, CamposDerivados>, ahora: number): Partida {
  const { cola, siguienteVuelta, vuelta } = partida
  if (cola.length === 0 && siguienteVuelta.length > 0) {
    return construir({ ...partida, cola: siguienteVuelta, siguienteVuelta: [], vuelta: vuelta + 1 }, ahora)
  }
  const pendientes = cola.length + siguienteVuelta.length
  const fin = pendientes === 0 ? ahora : null
  return {
    ...partida,
    fin,
    mostradoEn: ahora,
    preguntado: cola[0] ?? null,
    pendientes,
    terminada: fin !== null,
  }
}

export function iniciarPartida(elementos: Elemento[], azar: Azar, reloj: Reloj): Partida {
  const ahora = reloj()
  return construir(
    {
      elementos,
      azar,
      reloj,
      inicio: ahora,
      pausadaDesde: null,
      tiempoEnPausa: 0,
      puntuacion: 0,
      aciertosALaPrimera: 0,
      fallos: 0,
      fallados: [],
      pista: null,
      pistasUsadas: 0,
      correccion: null,
      cola: barajar(elementos, azar),
      siguienteVuelta: [],
      acertados: [],
      vuelta: 1,
      abandonada: false,
    },
    ahora,
  )
}

export function responder(partida: Partida, idElegido: string): Partida {
  if (partida.pista || partida.correccion) return partida
  const correcto = partida.cola[0]
  if (idElegido === correcto.id) return resolver(partida, true)
  const elegido = partida.elementos.find((elemento) => elemento.id === idElegido)
  if (!elegido) return partida
  return abrirCorreccion(resolver(partida, false), elegido, correcto)
}

function abrirCorreccion(partida: Partida, elegido: Elemento, correcto: Elemento): Partida {
  const trasFallo = elegido.id !== correcto.id
  const duracion = trasFallo ? DURACION_CORRECCION_TRAS_FALLO : DURACION_CORRECCION_CON_PISTA
  return { ...partida, correccion: { elegido, correcto, trasFallo, duracion }, pausadaDesde: partida.mostradoEn }
}

export function cerrarCorreccion(partida: Partida): Partida {
  if (!partida.correccion) return partida
  return { ...reanudar(partida, partida.reloj()), correccion: null }
}

function reanudar(partida: Partida, ahora: number): Partida {
  if (partida.pausadaDesde === null) return partida
  return {
    ...partida,
    pausadaDesde: null,
    tiempoEnPausa: partida.tiempoEnPausa + ahora - partida.pausadaDesde,
    mostradoEn: ahora,
  }
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

const LETRAS_MINIMAS_PARA_ERRATA = 6

function distanciaDeEdicion(a: string, b: string): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const actual = [i]
    for (let j = 1; j <= b.length; j++) {
      const sustitucion = anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      actual[j] = Math.min(anterior[j] + 1, actual[j - 1] + 1, sustitucion)
    }
    anterior = actual
  }
  return anterior[b.length]
}

function nombresAceptados({ nombre, alias }: Elemento): string[] {
  return [nombre, ...alias].map(normalizar)
}

function admiteErrata(respuesta: string, aceptado: string): boolean {
  const letras = aceptado.match(/\p{L}/gu)?.length ?? 0
  return letras >= LETRAS_MINIMAS_PARA_ERRATA && distanciaDeEdicion(respuesta, aceptado) === 1
}

export function responderConTexto(partida: Partida, texto: string): Partida {
  if (partida.pista || partida.correccion) return partida
  const preguntado = partida.cola[0]
  const respuesta = normalizar(texto)
  if (respuesta === '') return pedirPista(partida)
  const aceptados = nombresAceptados(preguntado)
  const esNombreDeOtro = partida.elementos
    .filter((elemento) => elemento.id !== preguntado.id)
    .some((elemento) => nombresAceptados(elemento).includes(respuesta))
  const acierto =
    aceptados.includes(respuesta) || (!esNombreDeOtro && aceptados.some((aceptado) => admiteErrata(respuesta, aceptado)))
  if (acierto) return resolver(partida, true)
  return abrirPista(anotarFallo(partida), texto.trim())
}

const PUNTOS_POR_FALLO = 25
const PUNTOS_POR_ACIERTO_A_LA_PRIMERA = 100
const BONUS_MAXIMO_DE_RAPIDEZ = 50
const SEGUNDOS_HASTA_PERDER_EL_BONUS = 10
const PUNTOS_POR_ACIERTO_EN_VUELTA_POSTERIOR = 25

function anotarFallo(partida: Partida): Partida {
  const preguntado = partida.cola[0]
  const yaFallado = partida.fallados.some((elemento) => elemento.id === preguntado.id)
  return {
    ...partida,
    puntuacion: Math.max(0, partida.puntuacion - PUNTOS_POR_FALLO),
    fallos: partida.fallos + 1,
    fallados: yaFallado ? partida.fallados : [...partida.fallados, preguntado],
  }
}

const DISTRACTORES_POR_PISTA = 3

function distractoresPorPreferencia(partida: Partida): Elemento[] {
  const [preguntado, ...restoDeLaCola] = partida.cola
  const aunNoPreguntados = partida.vuelta === 1 ? restoDeLaCola.map((elemento) => elemento.id) : []
  const otros = partida.elementos.filter((elemento) => elemento.id !== preguntado.id)
  const esVecino = (elemento: Elemento) => preguntado.vecinos.includes(elemento.id)
  const vecinosAunNoPreguntados = otros.filter((elemento) => esVecino(elemento) && aunNoPreguntados.includes(elemento.id))
  const vecinosYaPreguntados = otros.filter((elemento) => esVecino(elemento) && !aunNoPreguntados.includes(elemento.id))
  const restoDelTipo = otros.filter((elemento) => !esVecino(elemento))
  return [vecinosAunNoPreguntados, vecinosYaPreguntados, restoDelTipo].flatMap((grupo) => barajar(grupo, partida.azar))
}

function abrirPista(partida: Partida, escrito: string | null): Partida {
  const preguntado = partida.cola[0]
  const distractores = distractoresPorPreferencia(partida).slice(0, DISTRACTORES_POR_PISTA)
  return {
    ...partida,
    pista: { opciones: barajar([preguntado, ...distractores], partida.azar), trasFallo: escrito !== null, escrito },
  }
}

export function pedirPista(partida: Partida): Partida {
  if (partida.pista || partida.correccion) return partida
  return abrirPista(partida, null)
}

function avanzar(partida: Partida, respuesta: Respuesta, siguePendiente: boolean, ahora: number): Partida {
  const [correcto, ...resto] = partida.cola
  return construir(
    {
      ...partida,
      pista: null,
      cola: resto,
      siguienteVuelta: siguePendiente ? [...partida.siguienteVuelta, correcto] : partida.siguienteVuelta,
      acertados: siguePendiente ? partida.acertados : [...partida.acertados, correcto.id],
      ultimaRespuesta: respuesta,
    },
    ahora,
  )
}

function resolver(partida: Partida, acierto: boolean): Partida {
  const ahora = partida.reloj()
  const correcto = partida.cola[0]
  if (!acierto) return avanzar(anotarFallo(partida), { acierto, conPista: false, correcto }, true, ahora)
  const segundos = (ahora - partida.mostradoEn) / 1000
  const bonus = Math.round(BONUS_MAXIMO_DE_RAPIDEZ * Math.max(0, 1 - segundos / SEGUNDOS_HASTA_PERDER_EL_BONUS))
  const aLaPrimera = partida.vuelta === 1
  const puntos = aLaPrimera ? PUNTOS_POR_ACIERTO_A_LA_PRIMERA + bonus : PUNTOS_POR_ACIERTO_EN_VUELTA_POSTERIOR
  return avanzar(
    {
      ...partida,
      puntuacion: partida.puntuacion + puntos,
      aciertosALaPrimera: partida.aciertosALaPrimera + (aLaPrimera ? 1 : 0),
    },
    { acierto, conPista: false, correcto },
    false,
    ahora,
  )
}

export function elegirOpcion(partida: Partida, idElegido: string): Partida {
  if (!partida.pista) return partida
  const correcto = partida.cola[0]
  const elegido = partida.pista.opciones.find((opcion) => opcion.id === idElegido)
  if (!elegido) return partida
  const esLaCorrecta = idElegido === correcto.id
  const conPistaUsada = { ...partida, pistasUsadas: partida.pistasUsadas + 1 }
  const resuelta = avanzar(
    esLaCorrecta ? conPistaUsada : anotarFallo(conPistaUsada),
    { acierto: false, conPista: esLaCorrecta, correcto },
    true,
    partida.reloj(),
  )
  return abrirCorreccion(resuelta, elegido, correcto)
}

export function abandonar(partida: Partida): Partida {
  if (partida.terminada) return partida
  const ahora = partida.reloj()
  return {
    ...reanudar(partida, ahora),
    fin: ahora,
    preguntado: null,
    pista: null,
    correccion: null,
    terminada: true,
    abandonada: true,
  }
}

export function tiempoJugado(partida: Partida, ahora: number): number {
  const hasta = partida.fin ?? ahora
  const pausaAbierta = partida.pausadaDesde === null ? 0 : hasta - partida.pausadaDesde
  return hasta - partida.inicio - partida.tiempoEnPausa - pausaAbierta
}

export interface PartidaJugada {
  prueba: Prueba
  puntuacion: number
  tiempo: number
  fecha: string
  abandonada: boolean
}

export function resumirPartida(partida: Partida, prueba: Prueba): PartidaJugada | null {
  if (partida.fin === null) return null
  return {
    prueba,
    puntuacion: partida.puntuacion,
    tiempo: tiempoJugado(partida, partida.fin),
    fecha: new Date(partida.fin).toISOString(),
    abandonada: partida.abandonada,
  }
}
