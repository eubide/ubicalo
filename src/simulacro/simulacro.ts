import { catalogo, type Alcance, type Elemento } from '../catalogo/catalogo'
import type { Almacen } from '../competicion/competicion'
import { alcancesDeExamen, type Resultado, type ResumenDeFamilia } from '../dominio/dominio'
import type { Anotacion } from '../dominio/tanda'
import { juzgarTexto, type FalloDeTexto } from '../partida/partida'
import { etiquetaDeAlcance, etiquetaDeFamilia, type Familia } from '../prueba/prueba'

export const DURACION_DEL_SIMULACRO = 20 * 60 * 1000

export interface Simulacro {
  familia: Familia
  alcance: Alcance
  inicio: number
  limite: number | null
  respuestas: Record<string, string>
  entregadoEn: number | null
}

export type ElementoCorregido =
  | { elemento: Elemento; escrito: null; resultado: 'blanco' }
  | { elemento: Elemento; escrito: string; resultado: 'acierto' }
  | { elemento: Elemento; escrito: string; resultado: 'fallo'; fallo: FalloDeTexto }

export interface Nota {
  aciertos: number
  total: number
}

export interface NotasDeFamilia {
  ultima: Nota
  mejor: Nota
  // La primera vez no lleva reloj y se cuenta en positivo: su resultado no se enseña como nota.
  ultimaConReloj: boolean
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

export function iniciarSimulacro(familia: Familia, alcance: Alcance, ahora: number, limite: number | null): Simulacro {
  return { familia, alcance, inicio: ahora, limite, respuestas: {}, entregadoEn: null }
}

export function tiempoRestante({ inicio, limite }: Simulacro, ahora: number): number | null {
  return limite === null ? null : Math.max(0, inicio + limite - ahora)
}

export function ponerAlDia(simulacro: Simulacro, ahora: number): Simulacro {
  if (simulacro.entregadoEn !== null || tiempoRestante(simulacro, ahora) !== 0) return simulacro
  return { ...simulacro, entregadoEn: simulacro.inicio + simulacro.limite! }
}

export function escribir(simulacro: Simulacro, id: string, texto: string, ahora: number): Simulacro {
  const alDia = ponerAlDia(simulacro, ahora)
  if (alDia.entregadoEn !== null) return alDia
  const { [id]: _, ...resto } = alDia.respuestas
  const escrito = texto.trim()
  return { ...alDia, respuestas: escrito === '' ? resto : { ...resto, [id]: escrito } }
}

export function entregar(simulacro: Simulacro, ahora: number): Simulacro {
  const alDia = ponerAlDia(simulacro, ahora)
  return alDia.entregadoEn !== null ? alDia : { ...alDia, entregadoEn: ahora }
}

export function blancosDe(simulacro: Simulacro, elementos: Elemento[]): Elemento[] {
  return elementos.filter((elemento) => simulacro.respuestas[elemento.id] === undefined)
}

export function corregir(simulacro: Simulacro, elementos: Elemento[]): ElementoCorregido[] | null {
  if (simulacro.entregadoEn === null) return null
  return elementos.map((elemento): ElementoCorregido => {
    const escrito = simulacro.respuestas[elemento.id]
    if (escrito === undefined) return { elemento, escrito: null, resultado: 'blanco' }
    const juicio = juzgarTexto(escrito, elemento, elementos, true)
    return juicio.acierto ? { elemento, escrito, resultado: 'acierto' } : { elemento, escrito, resultado: 'fallo', fallo: juicio.fallo }
  })
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

export function anotacionesDelSimulacro(corregidos: ElementoCorregido[]): Anotacion[] {
  return corregidos.map((corregido) => ({ id: corregido.elemento.id, resultado: resultadoDe(corregido) }))
}

interface Registro {
  version: number
  enCurso: Simulacro | null
  notas: Partial<Record<Familia, NotasDeFamilia>>
}

const CLAVE = 'ubicalo:simulacro'
const VERSION = 1

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esAlcance(valor: unknown): valor is Alcance {
  return typeof valor === 'string' && Object.hasOwn(etiquetaDeAlcance, valor)
}

function esFamilia(valor: unknown): valor is Familia {
  return typeof valor === 'string' && Object.hasOwn(etiquetaDeFamilia, valor)
}

function esInstante(valor: unknown): valor is number {
  return Number.isSafeInteger(valor) && (valor as number) >= 0
}

function esNota(valor: unknown): valor is Nota {
  return esObjeto(valor) && esInstante(valor.aciertos) && esInstante(valor.total) && valor.total > 0 && valor.aciertos <= valor.total
}

function simulacroValido(datos: unknown): Simulacro | null {
  if (!esObjeto(datos) || !esFamilia(datos.familia) || !esAlcance(datos.alcance)) return null
  if (!alcancesDeExamen(datos.familia).includes(datos.alcance)) return null
  const { familia, alcance, inicio, limite, entregadoEn } = datos
  if (!esInstante(inicio) || !(limite === null || esInstante(limite)) || !(entregadoEn === null || esInstante(entregadoEn))) return null
  const ids = new Set(catalogo(alcance).map((elemento) => elemento.id))
  const respuestas = Object.entries(esObjeto(datos.respuestas) ? datos.respuestas : {}).filter(
    (respuesta): respuesta is [string, string] => ids.has(respuesta[0]) && typeof respuesta[1] === 'string',
  )
  return { familia, alcance, inicio, limite, respuestas: Object.fromEntries(respuestas), entregadoEn }
}

function registroValido(datos: unknown): Registro {
  if (!esObjeto(datos) || datos.version !== VERSION) return { version: VERSION, enCurso: null, notas: {} }
  const notas = Object.entries(esObjeto(datos.notas) ? datos.notas : {}).filter(
    ([familia, deFamilia]) =>
      esFamilia(familia) &&
      esObjeto(deFamilia) &&
      esNota(deFamilia.ultima) &&
      esNota(deFamilia.mejor) &&
      typeof deFamilia.ultimaConReloj === 'boolean',
  )
  return { version: VERSION, enCurso: simulacroValido(datos.enCurso), notas: Object.fromEntries(notas) }
}

function mejorDe(una: Nota, otra: Nota): Nota {
  return otra.aciertos / otra.total > una.aciertos / una.total ? otra : una
}

export function crearSimulacros(almacen: Almacen) {
  function leer(): Registro {
    try {
      return registroValido(JSON.parse(almacen.getItem(CLAVE) ?? 'null'))
    } catch {
      return registroValido(null)
    }
  }

  function guardar(registro: Registro) {
    try {
      almacen.setItem(CLAVE, JSON.stringify(registro))
    } catch {}
  }

  return {
    enCurso(): Simulacro | null {
      return leer().enCurso
    },

    guardar(simulacro: Simulacro) {
      guardar({ ...leer(), enCurso: simulacro })
    },

    notas(familia: Familia): NotasDeFamilia | null {
      return leer().notas[familia] ?? null
    },

    descartar() {
      guardar({ ...leer(), enCurso: null })
    },

    cerrar(familia: Familia, nota: Nota, conReloj: boolean) {
      const registro = leer()
      const anterior = registro.notas[familia]
      const deFamilia = { ultima: nota, mejor: anterior ? mejorDe(anterior.mejor, nota) : nota, ultimaConReloj: conReloj }
      const notas = { ...registro.notas, [familia]: deFamilia }
      guardar({ ...registro, enCurso: null, notas })
    },
  }
}
