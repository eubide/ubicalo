import { catalogo, type Alcance } from '../catalogo/catalogo'

export type Familia = 'politico' | 'relieve' | 'hidrografia' | 'costas'

export type Direccion = 'localizar' | 'nombrar'

export interface Prueba {
  familia: Familia
  alcance: Alcance
  direccion: Direccion
}

export const FAMILIAS: { familia: Familia; alcances: Alcance[] }[] = [
  { familia: 'politico', alcances: ['comunidades', 'provincias'] },
  {
    familia: 'relieve',
    alcances: ['picos', 'cordilleras-y-sierras', 'pertenencia-relieve', 'todo-relieve', 'unidades'],
  },
  { familia: 'hidrografia', alcances: ['rios', 'pertenencia-rios', 'todo-rios'] },
  { familia: 'costas', alcances: ['cabos', 'golfos', 'todo-costas'] },
]

export const etiquetaDeFamilia: Record<Familia, string> = {
  politico: 'Político',
  relieve: 'Relieve',
  hidrografia: 'Hidrografía',
  costas: 'Costas',
}

export const etiquetaDeAlcance: Record<Alcance, string> = {
  comunidades: 'Comunidades',
  provincias: 'Provincias',
  picos: 'Picos',
  'cordilleras-y-sierras': 'Cordilleras y sierras',
  'pertenencia-relieve': 'Pertenencia',
  'todo-relieve': 'Todo',
  unidades: 'Grandes unidades',
  rios: 'Ríos',
  'pertenencia-rios': 'Pertenencia',
  'todo-rios': 'Todo',
  cabos: 'Cabos',
  golfos: 'Golfos',
  'todo-costas': 'Todo',
}

export const etiquetaDeDireccion: Record<Direccion, string> = {
  localizar: 'Localizar',
  nombrar: 'Nombrar',
}

const AMBAS: Direccion[] = ['localizar', 'nombrar']

interface Rasgos {
  // Un Alcance de apoyo solo tiene sentido en una dirección, así que no ofrece la otra.
  direccionFija?: Direccion
  // El mapa arranca mudo y solo se dibuja lo ya Acertado o Desbloqueado.
  cascada?: 'la elige el motor' | 'la elige el alumno'
}

const RASGOS: Partial<Record<Alcance, Rasgos>> = {
  'pertenencia-relieve': { direccionFija: 'localizar' },
  'pertenencia-rios': { direccionFija: 'localizar' },
  'todo-relieve': { direccionFija: 'nombrar', cascada: 'la elige el alumno' },
  'todo-rios': { direccionFija: 'nombrar', cascada: 'la elige el alumno' },
  'todo-costas': { direccionFija: 'nombrar' },
  unidades: { direccionFija: 'localizar', cascada: 'la elige el motor' },
}

const FAMILIA_POR_ALCANCE = new Map<Alcance, Familia>(
  FAMILIAS.flatMap(({ familia, alcances }) => alcances.map((alcance) => [alcance, familia] as const)),
)

export function direccionesDe(alcance: Alcance): Direccion[] {
  const fija = RASGOS[alcance]?.direccionFija
  return fija ? [fija] : AMBAS
}

export function familiaDe(alcance: Alcance): Familia {
  const familia = FAMILIA_POR_ALCANCE.get(alcance)
  if (!familia) throw new Error(`Alcance sin familia: ${alcance}`)
  return familia
}

export function alcancesDe(familia: Familia): Alcance[] {
  return FAMILIAS.find((candidata) => candidata.familia === familia)!.alcances
}

const preguntasPorAlcance: Partial<Record<Alcance, number>> = {}

export function preguntasDe(alcance: Alcance): number {
  return (preguntasPorAlcance[alcance] ??= catalogo(alcance).length)
}

export function pruebaDe(alcance: Alcance, direccion: Direccion): Prueba {
  const direcciones = direccionesDe(alcance)
  return {
    familia: familiaDe(alcance),
    alcance,
    direccion: direcciones.includes(direccion) ? direccion : direcciones[0],
  }
}

export function enCascada(alcance: Alcance): boolean {
  return RASGOS[alcance]?.cascada !== undefined
}

export function seEligeLaPregunta(alcance: Alcance): boolean {
  return RASGOS[alcance]?.cascada === 'la elige el alumno'
}

export function siguienteAlcance(alcance: Alcance): Alcance {
  const alcances = alcancesDe(familiaDe(alcance))
  return alcances[(alcances.indexOf(alcance) + 1) % alcances.length]
}

export function nombreDePrueba({ familia, alcance, direccion }: Prueba): string {
  return `${etiquetaDeFamilia[familia]} · ${etiquetaDeAlcance[alcance]} · ${etiquetaDeDireccion[direccion]}`
}
