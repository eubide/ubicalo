import type { Tipo } from '../catalogo/catalogo'

export type Modo = 'nombre-ubicar' | 'ubicacion-nombre'

export interface Prueba {
  tipo: Tipo
  modo: Modo
}

export const etiquetaDeTipo: Record<Tipo, string> = {
  comunidades: 'Comunidades autónomas',
  provincias: 'Provincias',
}

export const etiquetaDeModo: Record<Modo, string> = {
  'nombre-ubicar': 'Nombre → ubicar',
  'ubicacion-nombre': 'Ubicación → nombre',
}

export function nombreDePrueba(prueba: Prueba): string {
  return `${etiquetaDeTipo[prueba.tipo]} en ${etiquetaDeModo[prueba.modo]}`
}
