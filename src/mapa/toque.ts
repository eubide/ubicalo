export interface Punto {
  x: number
  y: number
}

export interface Trazo {
  id: string
  puntos: Punto[]
}

function distanciaAlSegmento(punto: Punto, uno: Punto, otro: Punto): number {
  const dx = otro.x - uno.x
  const dy = otro.y - uno.y
  const largoAlCuadrado = dx * dx + dy * dy
  if (largoAlCuadrado === 0) return Math.hypot(punto.x - uno.x, punto.y - uno.y)
  const avance = ((punto.x - uno.x) * dx + (punto.y - uno.y) * dy) / largoAlCuadrado
  const acotado = Math.min(1, Math.max(0, avance))
  return Math.hypot(punto.x - (uno.x + acotado * dx), punto.y - (uno.y + acotado * dy))
}

function distanciaAlTrazo(punto: Punto, puntos: Punto[]): number {
  if (puntos.length === 1) return Math.hypot(punto.x - puntos[0].x, punto.y - puntos[0].y)
  let minima = Infinity
  for (let i = 1; i < puntos.length; i++) {
    minima = Math.min(minima, distanciaAlSegmento(punto, puntos[i - 1], puntos[i]))
  }
  return minima
}

// Varios trazos comparten el toque en cada confluencia, así que gana el que pasa más cerca del punto
// exacto. El empate exacto se rompe por id para que la respuesta no dependa del orden de pintado.
function masCercano(punto: Punto, trazos: Trazo[], radio: number): { id: string; separacion: number } | null {
  let elegido: { id: string; separacion: number } | null = null
  for (const { id, puntos } of trazos) {
    if (puntos.length === 0) continue
    const separacion = distanciaAlTrazo(punto, puntos)
    if (separacion > radio) continue
    if (elegido === null || separacion < elegido.separacion) elegido = { id, separacion }
    else if (separacion === elegido.separacion && id < elegido.id) elegido = { id, separacion }
  }
  return elegido
}

export function trazoMasCercano(punto: Punto, trazos: Trazo[], radio: number): string | null {
  return masCercano(punto, trazos, radio)?.id ?? null
}

// Un Cabo cae justo sobre el arco del Golfo que cierra, y el Estrecho entero nace dentro de la Punta
// de Tarifa: dar prioridad fija a uno de los dos deja intocable al otro. El punto se lleva lo que cae
// dentro de su marca, que es lo que el alumno ve y apunta; más allá gana el que pase más cerca.
export function tocableMasCercano(
  punto: Punto,
  puntosTocables: Trazo[],
  trazos: Trazo[],
  radio: number,
  marca: number,
): string | null {
  const desdeElPunto = masCercano(punto, puntosTocables, radio)
  const desdeElTrazo = masCercano(punto, trazos, radio)
  if (desdeElPunto === null) return desdeElTrazo?.id ?? null
  if (desdeElTrazo === null) return desdeElPunto.id
  return desdeElTrazo.separacion < desdeElPunto.separacion - marca ? desdeElTrazo.id : desdeElPunto.id
}
