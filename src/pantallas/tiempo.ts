export function formatearTiempo(milisegundos: number): string {
  const segundos = Math.floor(milisegundos / 1000)
  const minutos = Math.floor(segundos / 60)
  return `${minutos}:${String(segundos % 60).padStart(2, '0')}`
}
