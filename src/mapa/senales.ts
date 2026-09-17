// Las Señales del mapa: un estado, un color, el mismo en todos los Tipos. El color dice qué es un
// Elemento y el borde si sigue en juego.
export type Senal = 'frontera' | 'parcial' | 'acierto' | 'fallo' | 'ayuda' | 'diana' | 'tentativa' | 'tocado'

export interface EstadoDelMapa {
  tocado: string | null
  tentativa: string | null
  diana: string[]
  pistaDeArea: string[]
  fallados: string[]
  acertados: string[]
  parcial: string[]
  frontera: string[]
}

// Lo que pasa ahora gana al historial: se comprueba de mayor a menor prioridad y manda la primera.
export function senalDe(id: string, estado: EstadoDelMapa): Senal | null {
  if (estado.tocado === id) return 'tocado'
  if (estado.tentativa === id) return 'tentativa'
  if (estado.diana.includes(id)) return 'diana'
  if (estado.pistaDeArea.includes(id)) return 'ayuda'
  if (estado.fallados.includes(id)) return 'fallo'
  if (estado.acertados.includes(id)) return 'acierto'
  if (estado.parcial.includes(id)) return 'parcial'
  if (estado.frontera.includes(id)) return 'frontera'
  return null
}

const ABIERTAS: Senal[] = ['frontera', 'parcial']

// Abierta es la Señal de un Elemento que todavía se puede responder.
export function abierta(senal: Senal | null): boolean {
  return senal !== null && ABIERTAS.includes(senal)
}

// La leyenda solo nombra lo que el alumno tiene delante; las Señales de un instante no entran, porque
// aparecer y desaparecer de la lista distrae más de lo que explica.
export const ETIQUETA_DE_SENAL: Partial<Record<Senal, string>> = {
  diana: 'Lo que se pregunta',
  frontera: 'Lo que puedes tocar',
  parcial: 'Acertado, falta algo debajo',
  acierto: 'Acertado',
  fallo: 'Fallado',
  ayuda: 'Ayuda',
}
