import type { Elemento } from '../catalogo/catalogo'

export type Azar = () => number

export interface Respuesta {
  acierto: boolean
  correcto: Elemento
}

export interface Partida {
  cola: Elemento[]
  siguienteVuelta: Elemento[]
  acertados: string[]
  vuelta: number
  preguntado: Elemento | null
  pendientes: number
  terminada: boolean
  ultimaRespuesta?: Respuesta
}

function barajar<T>(lista: T[], azar: Azar): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

function construir(
  cola: Elemento[],
  siguienteVuelta: Elemento[],
  acertados: string[],
  vuelta: number,
  ultimaRespuesta?: Respuesta,
): Partida {
  if (cola.length === 0 && siguienteVuelta.length > 0) {
    return construir(siguienteVuelta, [], acertados, vuelta + 1, ultimaRespuesta)
  }
  const pendientes = cola.length + siguienteVuelta.length
  return {
    cola,
    siguienteVuelta,
    acertados,
    vuelta,
    preguntado: cola[0] ?? null,
    pendientes,
    terminada: pendientes === 0,
    ultimaRespuesta,
  }
}

export function iniciarPartida(elementos: Elemento[], azar: Azar): Partida {
  return construir(barajar(elementos, azar), [], [], 1)
}

export function responder(partida: Partida, idElegido: string): Partida {
  const [correcto, ...resto] = partida.cola
  const acierto = idElegido === correcto.id
  const siguienteVuelta = acierto ? partida.siguienteVuelta : [...partida.siguienteVuelta, correcto]
  const acertados = acierto ? [...partida.acertados, correcto.id] : partida.acertados
  return construir(resto, siguienteVuelta, acertados, partida.vuelta, { acierto, correcto })
}
