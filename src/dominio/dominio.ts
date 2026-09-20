import { catalogo, type Alcance } from '../catalogo/catalogo'
import type { Almacen } from '../competicion/competicion'
import type { FalloDeTexto, TipoDeFallo } from '../partida/partida'
import { etiquetaDeAlcance, etiquetaDeFamilia, type Familia } from '../prueba/prueba'

export type Estado = 'flojo' | 'sabido'

export interface Entrada {
  estado: Estado
  visto: string
  fallos: number
  tipoDeFallo: TipoDeFallo | null
  confundidoCon: string | null
}

export type Resultado =
  | { caso: 'acierto' }
  | { caso: 'acierto-con-pista' }
  | { caso: 'presentacion' }
  | ({ caso: 'fallo' } & FalloDeTexto)

interface Registro {
  version: number
  familia: Familia | null
  elementos: Record<string, Entrada>
}

const CLAVE = 'ubicalo:dominio'
const VERSION = 1
const ESTADOS: Estado[] = ['flojo', 'sabido']
const TIPOS_DE_FALLO: TipoDeFallo[] = ['tilde', 'errata', 'otro']
const DIA = /^\d{4}-\d{2}-\d{2}$/

// Comunidades y Provincias comparten los ids 01 a 19, así que el id solo no identifica al Elemento.
function claveDe(alcance: Alcance, id: string): string {
  return `${alcance}/${id}`
}

const idsPorAlcance: Partial<Record<Alcance, Set<string>>> = {}

function idsDe(alcance: Alcance): Set<string> {
  return (idsPorAlcance[alcance] ??= new Set(catalogo(alcance).map((elemento) => elemento.id)))
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esAlcance(valor: unknown): valor is Alcance {
  return typeof valor === 'string' && Object.hasOwn(etiquetaDeAlcance, valor)
}

function esFamilia(valor: unknown): valor is Familia {
  return typeof valor === 'string' && Object.hasOwn(etiquetaDeFamilia, valor)
}

function esEntrada(valor: unknown): valor is Entrada {
  return (
    esObjeto(valor) &&
    ESTADOS.includes(valor.estado as Estado) &&
    typeof valor.visto === 'string' &&
    DIA.test(valor.visto) &&
    Number.isSafeInteger(valor.fallos) &&
    (valor.fallos as number) >= 0 &&
    (valor.tipoDeFallo === null || TIPOS_DE_FALLO.includes(valor.tipoDeFallo as TipoDeFallo)) &&
    (valor.confundidoCon === null || typeof valor.confundidoCon === 'string')
  )
}

function alcanceEIdDe(clave: string): [Alcance, string] | null {
  const corte = clave.indexOf('/')
  const alcance = clave.slice(0, corte)
  const id = clave.slice(corte + 1)
  return corte > 0 && esAlcance(alcance) && idsDe(alcance).has(id) ? [alcance, id] : null
}

function registroVacio(): Registro {
  return { version: VERSION, familia: null, elementos: {} }
}

function registroValido(datos: unknown): Registro {
  if (!esObjeto(datos) || datos.version !== VERSION) return registroVacio()
  const elementos = esObjeto(datos.elementos) ? datos.elementos : {}
  return {
    version: VERSION,
    familia: esFamilia(datos.familia) ? datos.familia : null,
    elementos: Object.fromEntries(
      Object.entries(elementos).flatMap(([clave, entrada]) => {
        const alcanceEId = alcanceEIdDe(clave)
        if (!alcanceEId || !esEntrada(entrada)) return []
        const { estado, visto, fallos, tipoDeFallo, confundidoCon } = entrada
        const sigueEnElCatalogo = confundidoCon !== null && idsDe(alcanceEId[0]).has(confundidoCon)
        return [[clave, { estado, visto, fallos, tipoDeFallo, confundidoCon: sigueEnElCatalogo ? confundidoCon : null }]]
      }),
    ),
  }
}

function trasAnotar(anterior: Entrada | undefined, resultado: Resultado, visto: string): Entrada {
  const { fallos = 0, tipoDeFallo = null, confundidoCon = null } = anterior ?? {}
  if (resultado.caso === 'fallo') {
    return { estado: 'flojo', visto, fallos: fallos + 1, tipoDeFallo: resultado.tipo, confundidoCon: resultado.confundidoCon }
  }
  return { estado: resultado.caso === 'acierto' ? 'sabido' : 'flojo', visto, fallos, tipoDeFallo, confundidoCon }
}

export function diaLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function crearDominio(almacen: Almacen, hoy: () => string) {
  function leer(): Registro {
    try {
      return registroValido(JSON.parse(almacen.getItem(CLAVE) ?? 'null'))
    } catch {
      return registroVacio()
    }
  }

  function guardar(registro: Registro) {
    try {
      almacen.setItem(CLAVE, JSON.stringify(registro))
    } catch {}
  }

  return {
    familia(): Familia | null {
      return leer().familia
    },

    elegirFamilia(familia: Familia) {
      guardar({ ...leer(), familia })
    },

    entradas(alcance: Alcance): Record<string, Entrada> {
      const prefijo = claveDe(alcance, '')
      return Object.fromEntries(
        Object.entries(leer().elementos)
          .filter(([clave]) => clave.startsWith(prefijo))
          .map(([clave, entrada]) => [clave.slice(prefijo.length), entrada]),
      )
    },

    anotar(alcance: Alcance, id: string, resultado: Resultado) {
      if (!idsDe(alcance).has(id)) return
      const registro = leer()
      const clave = claveDe(alcance, id)
      registro.elementos[clave] = trasAnotar(registro.elementos[clave], resultado, hoy())
      guardar(registro)
    },
  }
}
