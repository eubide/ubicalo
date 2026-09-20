import type { Alcance, Elemento } from '../catalogo/catalogo'
import type { Resultado, ResumenDeFamilia } from '../dominio/dominio'
import type { Anotacion, CatalogoDeExamen } from '../dominio/tanda'
import { juzgarTexto, type FalloDeTexto } from '../partida/partida'
import type { Familia } from '../prueba/prueba'

export const DURACION_DEL_SIMULACRO = 20 * 60 * 1000

// Político se examina sobre dos mapas, y sus ids se pisan: lo escrito se guarda por Alcance, y el mapa que el
// alumno tiene delante va en el propio Simulacro para volver a él tras un corte.
export interface Simulacro {
  familia: Familia
  alcances: Alcance[]
  enVista: Alcance
  inicio: number
  limite: number | null
  respuestas: Partial<Record<Alcance, Record<string, string>>>
  entregadoEn: number | null
}

export type ElementoCorregido = { alcance: Alcance; elemento: Elemento } & (
  | { escrito: null; resultado: 'blanco' }
  | { escrito: string; resultado: 'acierto' }
  | { escrito: string; resultado: 'fallo'; fallo: FalloDeTexto }
)

export type AnotacionDeSimulacro = Anotacion & { alcance: Alcance }

export interface Nota {
  aciertos: number
  total: number
}

export interface SimulacroEnPortada {
  primeraVez: boolean
  ultimaNota: string | null
  esLoPrincipal: boolean
}

export function etiquetaDeSimulacro(primeraVez: boolean): string {
  return primeraVez ? '¿Qué te sabes ya?' : `Simulacro · ${DURACION_DEL_SIMULACRO / 60_000} min`
}

const TANDAS_SEGUIDAS_HASTA_PROPONERLO = 4

export function esLoPrincipal(tandasSeguidas: number, { flojos, sinVer }: ResumenDeFamilia): boolean {
  return tandasSeguidas >= TANDAS_SEGUIDAS_HASTA_PROPONERLO || (flojos === 0 && sinVer === 0)
}

export function iniciarSimulacro(familia: Familia, alcances: Alcance[], ahora: number, limite: number | null): Simulacro {
  return { familia, alcances, enVista: alcances[0], inicio: ahora, limite, respuestas: {}, entregadoEn: null }
}

export function verMapa(simulacro: Simulacro, alcance: Alcance): Simulacro {
  return simulacro.alcances.includes(alcance) && alcance !== simulacro.enVista ? { ...simulacro, enVista: alcance } : simulacro
}

export function tiempoRestante({ inicio, limite }: Simulacro, ahora: number): number | null {
  return limite === null ? null : Math.max(0, inicio + limite - ahora)
}

export function ponerAlDia(simulacro: Simulacro, ahora: number): Simulacro {
  if (simulacro.entregadoEn !== null || tiempoRestante(simulacro, ahora) !== 0) return simulacro
  return { ...simulacro, entregadoEn: simulacro.inicio + simulacro.limite! }
}

export function escribir(simulacro: Simulacro, alcance: Alcance, id: string, texto: string, ahora: number): Simulacro {
  const alDia = ponerAlDia(simulacro, ahora)
  if (alDia.entregadoEn !== null) return alDia
  const { [id]: _, ...resto } = alDia.respuestas[alcance] ?? {}
  const escrito = texto.trim()
  return { ...alDia, respuestas: { ...alDia.respuestas, [alcance]: escrito === '' ? resto : { ...resto, [id]: escrito } } }
}

export function entregar(simulacro: Simulacro, ahora: number): Simulacro {
  const alDia = ponerAlDia(simulacro, ahora)
  return alDia.entregadoEn !== null ? alDia : { ...alDia, entregadoEn: ahora }
}

export function blancosDe(simulacro: Simulacro, examen: CatalogoDeExamen[]): { alcance: Alcance; blancos: Elemento[] }[] {
  return examen.map(({ alcance, elementos }) => ({
    alcance,
    blancos: elementos.filter((elemento) => simulacro.respuestas[alcance]?.[elemento.id] === undefined),
  }))
}

export function corregir(simulacro: Simulacro, examen: CatalogoDeExamen[]): ElementoCorregido[] | null {
  if (simulacro.entregadoEn === null) return null
  return examen.flatMap(({ alcance, elementos }) =>
    elementos.map((elemento): ElementoCorregido => {
      const escrito = simulacro.respuestas[alcance]?.[elemento.id]
      if (escrito === undefined) return { alcance, elemento, escrito: null, resultado: 'blanco' }
      const juicio = juzgarTexto(escrito, elemento, elementos, true)
      if (juicio.acierto) return { alcance, elemento, escrito, resultado: 'acierto' }
      return { alcance, elemento, escrito, resultado: 'fallo', fallo: juicio.fallo }
    }),
  )
}

export function notaDe(corregidos: ElementoCorregido[]): Nota {
  return { aciertos: corregidos.filter(({ resultado }) => resultado === 'acierto').length, total: corregidos.length }
}

export function sobreDiez({ aciertos, total }: Nota): string {
  return ((aciertos / total) * 10).toFixed(1).replace('.', ',')
}

// El blanco no es un Fallo: el mapa corregido se lo enseña rotulado, que es presentarlo.
function resultadoDe(corregido: ElementoCorregido): Resultado {
  if (corregido.resultado === 'acierto') return { caso: 'acierto' }
  if (corregido.resultado === 'blanco') return { caso: 'presentacion' }
  return { caso: 'fallo', ...corregido.fallo }
}

export function anotacionesDelSimulacro(corregidos: ElementoCorregido[]): AnotacionDeSimulacro[] {
  return corregidos.map((corregido) => ({
    alcance: corregido.alcance,
    id: corregido.elemento.id,
    resultado: resultadoDe(corregido),
  }))
}
