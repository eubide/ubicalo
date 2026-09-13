import type { PartidaJugada } from '../partida/partida'
import type { Prueba } from '../prueba/prueba'

export type Almacen = Pick<Storage, 'getItem' | 'setItem'>

export interface Marca {
  puntuacion: number
  tiempo: number
  fecha: string
}

export type ResultadoDeRegistro =
  | { caso: 'nueva-marca' }
  | { caso: 'faltan-puntos'; puntos: number }
  | { caso: 'empate-a-puntos-con-mas-tiempo' }
  | { caso: 'empate-total' }
  | { caso: 'abandonada' }

interface Registro {
  marcas: Record<string, Marca>
  historial: PartidaJugada[]
}

const CLAVE = 'ubicalo:competicion'
const PARTIDAS_EN_HISTORIAL = 10
const MILISEGUNDOS_POR_SEGUNDO = 1_000

function claveDe(prueba: Prueba): string {
  return `${prueba.tipo}/${prueba.modo}`
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esMarca(valor: unknown): valor is Marca {
  return (
    esObjeto(valor) &&
    Number.isFinite(valor.puntuacion) &&
    Number.isFinite(valor.tiempo) &&
    typeof valor.fecha === 'string'
  )
}

function esPartidaJugada(valor: unknown): valor is PartidaJugada {
  if (!esObjeto(valor) || !esMarca(valor)) return false
  const { prueba, abandonada } = valor as Record<string, unknown>
  return (
    esObjeto(prueba) &&
    typeof prueba.tipo === 'string' &&
    typeof prueba.modo === 'string' &&
    typeof abandonada === 'boolean'
  )
}

function registroValido(datos: unknown): Registro {
  if (!esObjeto(datos)) return { marcas: {}, historial: [] }
  const marcas = esObjeto(datos.marcas) ? datos.marcas : {}
  return {
    marcas: Object.fromEntries(Object.entries(marcas).filter(([, marca]) => esMarca(marca))) as Record<string, Marca>,
    historial: Array.isArray(datos.historial) ? datos.historial.filter(esPartidaJugada) : [],
  }
}

function comparar(partida: PartidaJugada, marca: Marca | undefined): ResultadoDeRegistro {
  if (partida.abandonada) return { caso: 'abandonada' }
  if (!marca || partida.puntuacion > marca.puntuacion) return { caso: 'nueva-marca' }
  if (partida.puntuacion < marca.puntuacion) return { caso: 'faltan-puntos', puntos: marca.puntuacion - partida.puntuacion }
  const diferencia = segundosMostrados(partida.tiempo) - segundosMostrados(marca.tiempo)
  if (diferencia < 0) return { caso: 'nueva-marca' }
  if (diferencia > 0) return { caso: 'empate-a-puntos-con-mas-tiempo' }
  return { caso: 'empate-total' }
}

function segundosMostrados(milisegundos: number): number {
  return Math.floor(milisegundos / MILISEGUNDOS_POR_SEGUNDO)
}

export function almacenEnMemoria(): Almacen {
  const datos = new Map<string, string>()
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => void datos.set(clave, valor),
  }
}

export function crearCompeticion(almacen: Almacen) {
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
    marca(prueba: Prueba): Marca | null {
      return leer().marcas[claveDe(prueba)] ?? null
    },

    registrar(partida: PartidaJugada): ResultadoDeRegistro {
      const registro = leer()
      const clave = claveDe(partida.prueba)
      const resultado = comparar(partida, registro.marcas[clave])
      if (resultado.caso === 'nueva-marca') {
        const { puntuacion, tiempo, fecha } = partida
        registro.marcas[clave] = { puntuacion, tiempo, fecha }
      }
      registro.historial = [partida, ...registro.historial].slice(0, PARTIDAS_EN_HISTORIAL)
      guardar(registro)
      return resultado
    },

    historial(): PartidaJugada[] {
      return leer().historial
    },
  }
}
