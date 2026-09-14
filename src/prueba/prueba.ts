import type { Tipo } from '../catalogo/catalogo'

export type Modo = 'nombre-ubicar' | 'ubicacion-nombre'

export interface Prueba {
  tipo: Tipo
  modo: Modo
}

export const etiquetaDeTipo: Record<Tipo, string> = {
  comunidades: 'Comunidades autónomas',
  provincias: 'Provincias',
  cordilleras: 'Cordilleras',
  sierras: 'Sierras',
  picos: 'Picos',
  jerarquia: 'Jerarquía',
  'cordillera-pico': 'Cordillera → pico',
  alturas: 'Alturas',
}

export const gruposDeTipos: { grupo: string; tipos: Tipo[] }[] = [
  { grupo: 'Político', tipos: ['comunidades', 'provincias'] },
  { grupo: 'Relieve', tipos: ['cordilleras', 'sierras', 'picos', 'jerarquia', 'cordillera-pico', 'alturas'] },
]

// Los Tipos de apoyo solo tienen sentido en una dirección: el Modo no se elige.
export const modoFijoDeTipo: Partial<Record<Tipo, Modo>> = {
  jerarquia: 'nombre-ubicar',
  'cordillera-pico': 'nombre-ubicar',
  alturas: 'ubicacion-nombre',
}

export function pruebaDe(tipo: Tipo, modo: Modo): Prueba {
  return { tipo, modo: modoFijoDeTipo[tipo] ?? modo }
}

export const etiquetaDeModo: Record<Modo, string> = {
  'nombre-ubicar': 'Nombre → ubicar',
  'ubicacion-nombre': 'Ubicación → nombre',
}

export function nombreDePrueba(prueba: Prueba): string {
  return `${etiquetaDeTipo[prueba.tipo]} en ${etiquetaDeModo[prueba.modo]}`
}
