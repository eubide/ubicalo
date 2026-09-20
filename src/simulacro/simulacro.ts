import { catalogo, type Alcance, type Elemento } from '../catalogo/catalogo'
import type { Almacen } from '../competicion/competicion'
import { alcancesDeExamen, type Resultado, type ResumenDeFamilia } from '../dominio/dominio'
import type { Anotacion, CatalogoDeExamen } from '../dominio/tanda'
import { juzgarTexto, type FalloDeTexto } from '../partida/partida'
import { etiquetaDeAlcance, etiquetaDeFamilia, type Familia } from '../prueba/prueba'

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

function respuestasValidas(alcance: Alcance, datos: unknown): Record<string, string> {
  const ids = new Set(catalogo(alcance).map((elemento) => elemento.id))
  const respuestas = Object.entries(esObjeto(datos) ? datos : {}).filter(
    (respuesta): respuesta is [string, string] => ids.has(respuesta[0]) && typeof respuesta[1] === 'string',
  )
  return Object.fromEntries(respuestas)
}

function simulacroValido(datos: unknown): Simulacro | null {
  if (!esObjeto(datos) || !esFamilia(datos.familia)) return null
  const { familia, enVista, inicio, limite, entregadoEn } = datos
  const alcances = alcancesDeExamen(familia)
  const guardados = Array.isArray(datos.alcances) ? datos.alcances : []
  if (guardados.length !== alcances.length || !alcances.every((alcance, i) => guardados[i] === alcance)) return null
  if (!esAlcance(enVista) || !alcances.includes(enVista)) return null
  if (!esInstante(inicio) || !(limite === null || esInstante(limite)) || !(entregadoEn === null || esInstante(entregadoEn))) return null
  const escritas = esObjeto(datos.respuestas) ? datos.respuestas : {}
  const respuestas = Object.fromEntries(
    alcances.filter((alcance) => escritas[alcance] !== undefined).map((alcance) => [alcance, respuestasValidas(alcance, escritas[alcance])]),
  )
  return { familia, alcances, enVista, inicio, limite, respuestas, entregadoEn }
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
