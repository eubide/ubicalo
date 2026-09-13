import type { Tipo } from '../catalogo/catalogo'

export type Modo = 'nombre-ubicar' | 'ubicacion-nombre'

export interface Prueba {
  tipo: Tipo
  modo: Modo
}
