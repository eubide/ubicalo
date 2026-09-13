import type { Elemento } from '../catalogo/catalogo'

export type Azar = () => number

export type Reloj = () => number

export interface Respuesta {
  acierto: boolean
  correcto: Elemento
}

export interface Partida {
  reloj: Reloj
  inicio: number
  fin: number | null
  mostradoEn: number
  puntuacion: number
  fallos: number
  fallados: Elemento[]
  cola: Elemento[]
  siguienteVuelta: Elemento[]
  acertados: string[]
  vuelta: number
  preguntado: Elemento | null
  pendientes: number
  terminada: boolean
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
      reloj,
      inicio: ahora,
      puntuacion: 0,
      fallos: 0,
      fallados: [],
      cola: barajar(elementos, azar),
      siguienteVuelta: [],
      acertados: [],
      vuelta: 1,
    },
    ahora,
  )
}

export function responder(partida: Partida, idElegido: string): Partida {
  const ahora = partida.reloj()
  const [correcto, ...resto] = partida.cola
  const acierto = idElegido === correcto.id
  const segundos = (ahora - partida.mostradoEn) / 1000
  const puntos = !acierto ? -25 : partida.vuelta > 1 ? 25 : 100 + Math.round(50 * Math.max(0, 1 - segundos / 10))
  const yaFallado = partida.fallados.some((elemento) => elemento.id === correcto.id)
  return construir(
    {
      ...partida,
      puntuacion: Math.max(0, partida.puntuacion + puntos),
      fallos: acierto ? partida.fallos : partida.fallos + 1,
      fallados: acierto || yaFallado ? partida.fallados : [...partida.fallados, correcto],
      cola: resto,
      siguienteVuelta: acierto ? partida.siguienteVuelta : [...partida.siguienteVuelta, correcto],
      acertados: acierto ? [...partida.acertados, correcto.id] : partida.acertados,
      ultimaRespuesta: { acierto, correcto },
    },
    ahora,
  )
}

export function tiempoJugado(partida: Partida, ahora: number): number {
  return (partida.fin ?? ahora) - partida.inicio
}
