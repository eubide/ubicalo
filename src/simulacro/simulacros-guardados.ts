import { catalogo, type Alcance } from '../catalogo/catalogo'
import type { Almacen } from '../competicion/competicion'
import { alcancesDeExamen } from '../dominio/dominio'
import { etiquetaDeAlcance, etiquetaDeFamilia, type Familia } from '../prueba/prueba'
import type { Nota, Simulacro } from './simulacro'

export interface NotasDeFamilia {
  ultima: Nota
  mejor: Nota
  // La primera vez no lleva reloj y se cuenta en positivo: su resultado no se enseña como nota.
  ultimaConReloj: boolean
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
