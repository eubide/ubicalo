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
  escrito: string | null
}

export interface Correccion {
  elegido: Elemento
  correcto: Elemento
  duracion: number
}

export function correccionTrasFallo({ elegido, correcto }: Correccion): boolean {
  return elegido.id !== correcto.id
}

export const DURACION_CORRECCION_TRAS_FALLO = 3_000

export const DURACION_CORRECCION_CON_PISTA = 2_000

export interface Repaso {
  elementos: Elemento[]
  marcados: string[]
}

const FALLOS_PARA_REPASO = 3

export const DURACION_REPASO_UBICACION_NOMBRE = 4_000

export interface Partida {
  prueba: Prueba
  elementos: Elemento[]
  tocables: Elemento[]
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
  rachaDeFallos: Elemento[]
  repaso: Repaso | null
  pistaDeArea: string[] | null
  desbloqueados: string[]
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

type CamposDerivados = 'fin' | 'mostradoEn' | 'preguntado' | 'pendientes' | 'terminada' | 'desbloqueados'

function barajar<T>(lista: T[], azar: Azar): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// Un elemento sin desbloqueaCon (el resto de Tipos) no depende de nada: está desbloqueado desde el principio.
function estaDesbloqueado(elemento: Elemento, acertados: Set<string>): boolean {
  return (elemento.desbloqueaCon ?? []).every((id) => acertados.has(id))
}

function desbloqueadosDe(elementos: Elemento[], cola: Elemento[], siguienteVuelta: Elemento[], acertados: string[]): string[] {
  const acertadosSet = new Set(acertados)
  const pendientesIds = new Set([...cola, ...siguienteVuelta].map((elemento) => elemento.id))
  return elementos
    .filter((elemento) => pendientesIds.has(elemento.id))
    .filter((elemento) => estaDesbloqueado(elemento, acertadosSet))
    .map((elemento) => elemento.id)
}

type ConCola = Omit<Partida, CamposDerivados>

// El Preguntado sale siempre del frente de la cola, así que en los Tipos con cascada que no deja elegir
// hay que adelantar el primero que ya se puede responder, y traerlo de la siguiente Vuelta si en esta
// no queda ninguno.
function adelantarDesbloqueado(partida: ConCola): ConCola {
  const acertados = new Set(partida.acertados)
  if (partida.cola.length === 0 || estaDesbloqueado(partida.cola[0], acertados)) return partida
  const enCola = partida.cola.findIndex((elemento) => estaDesbloqueado(elemento, acertados))
  if (enCola > 0) {
    const adelantado = partida.cola[enCola]
    return { ...partida, cola: [adelantado, ...partida.cola.filter((_, i) => i !== enCola)] }
  }
  const enSiguiente = partida.siguienteVuelta.findIndex((elemento) => estaDesbloqueado(elemento, acertados))
  if (enSiguiente === -1) return partida
  return {
    ...partida,
    cola: [partida.siguienteVuelta[enSiguiente], ...partida.cola],
    siguienteVuelta: partida.siguienteVuelta.filter((_, i) => i !== enSiguiente),
  }
}

function construir(sinAdelantar: ConCola, ahora: number): Partida {
  const partida = adelantarDesbloqueado(sinAdelantar)
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
    desbloqueados: desbloqueadosDe(partida.elementos, cola, siguienteVuelta, partida.acertados),
    terminada: fin !== null,
  }
}

// Trae un elemento desbloqueado al frente de la cola, para que sea el siguiente Preguntado (Simulacro:
// el alumno elige qué responder tocando el mapa, en vez de seguir el orden que impone el motor).
export function elegirPregunta(partida: Partida, id: string): Partida {
  if (!esperandoRespuesta(partida) || !partida.desbloqueados.includes(id)) return partida
  const enCola = partida.cola.find((elemento) => elemento.id === id)
  if (enCola) {
    return construir(
      { ...partida, cola: [enCola, ...partida.cola.filter((elemento) => elemento.id !== id)] },
      partida.reloj(),
    )
  }
  const enSiguienteVuelta = partida.siguienteVuelta.find((elemento) => elemento.id === id)
  if (!enSiguienteVuelta) return partida
  return construir(
    {
      ...partida,
      cola: [enSiguienteVuelta, ...partida.cola],
      siguienteVuelta: partida.siguienteVuelta.filter((elemento) => elemento.id !== id),
    },
    partida.reloj(),
  )
}

// Elemento del mapa que hay que tocar para acertar: el propio, salvo que responda por otro (Jerarquía).
export function respuestaDe(elemento: Elemento): string {
  return elemento.respuesta ?? elemento.id
}

export function iniciarPartida(
  prueba: Prueba,
  elementos: Elemento[],
  azar: Azar,
  reloj: Reloj,
  tocables: Elemento[] = elementos,
): Partida {
  const ahora = reloj()
  return construir(
    {
      prueba,
      elementos,
      tocables,
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
      rachaDeFallos: [],
      repaso: null,
      pistaDeArea: null,
      cola: barajar(elementos, azar),
      siguienteVuelta: [],
      acertados: [],
      vuelta: 1,
      abandonada: false,
    },
    ahora,
  )
}

function esperandoRespuesta(partida: Partida): boolean {
  return !partida.pista && !partida.correccion && !partida.repaso
}

export function responder(partida: Partida, idElegido: string): Partida {
  if (!esperandoRespuesta(partida)) return partida
  const correcto = partida.cola[0]
  if (idElegido === respuestaDe(correcto)) return resolver(partida, true)
  const elegido = partida.tocables.find((elemento) => elemento.id === idElegido)
  if (!elegido) return partida
  return abrirCorreccion(resolver(partida, false), elegido, correcto)
}

function abrirCorreccion(partida: Partida, elegido: Elemento, correcto: Elemento): Partida {
  const correccion = {
    elegido,
    correcto,
    duracion: elegido.id !== correcto.id ? DURACION_CORRECCION_TRAS_FALLO : DURACION_CORRECCION_CON_PISTA,
  }
  const rachaDeFallos = correccionTrasFallo(correccion) ? [...partida.rachaDeFallos, correcto] : partida.rachaDeFallos
  return { ...partida, correccion, rachaDeFallos, pausadaDesde: partida.mostradoEn }
}

export function cerrarCorreccion(partida: Partida): Partida {
  if (!partida.correccion) return partida
  if (partida.rachaDeFallos.length >= FALLOS_PARA_REPASO) {
    const elementos = partida.rachaDeFallos.filter(
      (elemento, i, racha) => racha.findIndex((otro) => otro.id === elemento.id) === i,
    )
    return { ...partida, correccion: null, rachaDeFallos: [], repaso: { elementos, marcados: [] } }
  }
  return { ...reanudar(partida, partida.reloj()), correccion: null }
}

export function marcarEnRepaso(partida: Partida, id: string): Partida {
  const { repaso } = partida
  if (!repaso || partida.prueba.modo === 'ubicacion-nombre') return partida
  const tocados = repaso.elementos
    .filter((elemento) => respuestaDe(elemento) === id && !repaso.marcados.includes(elemento.id))
    .map((elemento) => elemento.id)
  if (tocados.length === 0) return partida
  const marcados = [...repaso.marcados, ...tocados]
  if (marcados.length === repaso.elementos.length) return cerrarRepaso(partida)
  return { ...partida, repaso: { ...repaso, marcados } }
}

export function cerrarRepaso(partida: Partida): Partida {
  if (!partida.repaso) return partida
  const reanudada = { ...reanudar(partida, partida.reloj()), repaso: null }
  if (partida.prueba.modo === 'ubicacion-nombre') return abrirPista(reanudada, null)
  return { ...reanudada, pistaDeArea: pistaDeAreaDe(partida) }
}

function pistaDeAreaDe(partida: Partida): string[] | null {
  const ids = idsDePistaDeArea(partida)
  return ids.length > 0 ? ids : null
}

function idsDePistaDeArea({ prueba, elementos, desbloqueados, cola: [preguntado] }: Partida): string[] {
  if (preguntado.ciudadAutonoma) return elementos.filter((elemento) => elemento.ciudadAutonoma).map((elemento) => elemento.id)
  if (prueba.tipo === 'provincias') return pistaDeAreaDeProvincia(preguntado, elementos)
  if (prueba.tipo === 'unidades') return pistaDeAreaDelPapel(preguntado, elementos, desbloqueados)
  return pistaDeAreaDeVecinos(preguntado)
}

// Los Vecinos por cercanía pueden seguir bloqueados y sin dibujar, así que la pista ilumina lo que
// comparte papel con la pregunta y ya se ve: «es una de estas».
function pistaDeAreaDelPapel(preguntado: Elemento, elementos: Elemento[], desbloqueados: string[]): string[] {
  const delPapel = elementos
    .filter((elemento) => elemento.papel === preguntado.papel && desbloqueados.includes(elemento.id))
    .map((elemento) => elemento.id)
  return delPapel.length > 1 ? delPapel : [preguntado.id]
}

function pistaDeAreaDeProvincia(provincia: Elemento, elementos: Elemento[]): string[] {
  if (provincia.comunidad === undefined) return []
  const deSuComunidad = elementos
    .filter((elemento) => elemento.comunidad === provincia.comunidad)
    .map((elemento) => elemento.id)
  return deSuComunidad.length > 1 ? deSuComunidad : [provincia.id, ...provincia.vecinos]
}

function pistaDeAreaDeVecinos(elemento: Elemento): string[] {
  return elemento.vecinos.length > 0 ? elemento.vecinos : [respuestaDe(elemento)]
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
  if (!esperandoRespuesta(partida)) return partida
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
  return abrirPista(anotarFallo(partida), texto.trim().replace(/[\s.,;:!?…]+$/u, ''))
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
    pista: { opciones: barajar([preguntado, ...distractores], partida.azar), escrito },
  }
}

export function pedirPista(partida: Partida): Partida {
  if (!esperandoRespuesta(partida)) return partida
  return abrirPista(partida, null)
}

function avanzar(partida: Partida, respuesta: Respuesta, siguePendiente: boolean, ahora: number): Partida {
  const [correcto, ...resto] = partida.cola
  return construir(
    {
      ...partida,
      pista: null,
      pistaDeArea: null,
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
  if (partida.pistaDeArea) {
    return abrirCorreccion(avanzar(partida, { acierto: false, conPista: true, correcto }, true, ahora), correcto, correcto)
  }
  const segundos = (ahora - partida.mostradoEn) / 1000
  const bonus = Math.round(BONUS_MAXIMO_DE_RAPIDEZ * Math.max(0, 1 - segundos / SEGUNDOS_HASTA_PERDER_EL_BONUS))
  const aLaPrimera = partida.vuelta === 1
  const puntos = aLaPrimera ? PUNTOS_POR_ACIERTO_A_LA_PRIMERA + bonus : PUNTOS_POR_ACIERTO_EN_VUELTA_POSTERIOR
  return avanzar(
    {
      ...partida,
      puntuacion: partida.puntuacion + puntos,
      rachaDeFallos: [],
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
    repaso: null,
    pistaDeArea: null,
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
