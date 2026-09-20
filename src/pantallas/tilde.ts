// La virgulilla de la eñe no es una tilde.
const TILDES = /[\u0300-\u0302\u0304-\u036f]/u

export function llevaTilde(texto: string): boolean {
  return TILDES.test(texto.normalize('NFD'))
}
