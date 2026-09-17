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
  'simulacro-relieve': 'Simulacro de relieve',
  rios: 'Ríos',
  'jerarquia-rios': 'Jerarquía de ríos',
  'simulacro-rios': 'Simulacro de ríos',
}

export const gruposDeTipos: { grupo: string; tipos: Tipo[] }[] = [
  { grupo: 'Político', tipos: ['comunidades', 'provincias'] },
  { grupo: 'Relieve', tipos: ['cordilleras-y-sierras', 'picos', 'jerarquia', 'alturas', 'simulacro-relieve'] },
  { grupo: 'Hidrografía', tipos: ['rios', 'jerarquia-rios', 'simulacro-rios'] },
]

// Los Tipos de apoyo solo tienen sentido en una dirección: el Modo no se elige.
export const modoFijoDeTipo: Partial<Record<Tipo, Modo>> = {
  jerarquia: 'nombre-ubicar',
  'jerarquia-rios': 'nombre-ubicar',
  alturas: 'ubicacion-nombre',
  'simulacro-relieve': 'ubicacion-nombre',
  'simulacro-rios': 'ubicacion-nombre',
}

// En Alturas se escribe una cifra, no un nombre.
export const indicacionDeRespuesta: Partial<Record<Tipo, string>> = { alturas: 'Metros' }

// Cada familia tiene su Simulacro: el mapa se descubre en cascada en todos ellos.
export function esSimulacro(tipo: Tipo): boolean {
  return tipo === 'simulacro-relieve' || tipo === 'simulacro-rios'
}

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
