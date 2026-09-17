import type { Tipo } from '../catalogo/catalogo'

export type Modo = 'nombre-ubicar' | 'ubicacion-nombre'

export interface Prueba {
  tipo: Tipo
  modo: Modo
}

export const etiquetaDeTipo: Record<Tipo, string> = {
  comunidades: 'Comunidades autónomas',
  provincias: 'Provincias',
  'cordilleras-y-sierras': 'Cordilleras y sierras',
  picos: 'Picos',
  jerarquia: 'Jerarquía',
  alturas: 'Alturas',
  simulacro: 'Simulacro de relieve',
  rios: 'Ríos',
}

export const gruposDeTipos: { grupo: string; tipos: Tipo[] }[] = [
  { grupo: 'Político', tipos: ['comunidades', 'provincias'] },
  { grupo: 'Relieve', tipos: ['cordilleras-y-sierras', 'picos', 'jerarquia', 'alturas', 'simulacro'] },
  { grupo: 'Hidrografía', tipos: ['rios'] },
]

// Los Tipos de apoyo solo tienen sentido en una dirección: el Modo no se elige.
export const modoFijoDeTipo: Partial<Record<Tipo, Modo>> = {
  jerarquia: 'nombre-ubicar',
  alturas: 'ubicacion-nombre',
  simulacro: 'ubicacion-nombre',
}

// En Alturas se escribe una cifra, no un nombre.
export const indicacionDeRespuesta: Partial<Record<Tipo, string>> = { alturas: 'Metros' }

export function pruebaDe(tipo: Tipo, modo: Modo): Prueba {
  return { tipo, modo: modoFijoDeTipo[tipo] ?? modo }
}

export const etiquetaDeModo: Record<Modo, string> = {
  'ubicacion-nombre': 'Ubicación → nombre',
  'nombre-ubicar': 'Nombre → ubicar',
}

export function nombreDePrueba(prueba: Prueba): string {
  return `${etiquetaDeTipo[prueba.tipo]} en ${etiquetaDeModo[prueba.modo]}`
}
