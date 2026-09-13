import type { Prueba } from '../prueba/prueba'

export type Almacen = Pick<Storage, 'getItem' | 'setItem'>

export interface Marca {
  puntuacion: number
  tiempo: number
  fecha: string
}

export interface PartidaJugada extends Marca {
  prueba: Prueba
  abandonada: boolean
}

export interface ResultadoDeRegistro {
  nuevaMarca: boolean
  puntosParaLaMarca: number | null
}

interface Registro {
  marcas: Record<string, Marca>
  historial: PartidaJugada[]
}

const CLAVE = 'ubicalo:competicion'
const PARTIDAS_EN_HISTORIAL = 10

function claveDe(prueba: Prueba): string {
  return `${prueba.tipo}/${prueba.modo}`
}

function esRegistro(valor: unknown): valor is Registro {
  if (typeof valor !== 'object' || valor === null) return false
  const { marcas, historial } = valor as Record<string, unknown>
  return typeof marcas === 'object' && marcas !== null && !Array.isArray(marcas) && Array.isArray(historial)
}

function bate(partida: PartidaJugada, marca: Marca | undefined): boolean {
  if (partida.abandonada) return false
  if (!marca) return true
  return partida.puntuacion > marca.puntuacion || (partida.puntuacion === marca.puntuacion && partida.tiempo < marca.tiempo)
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
      const registro = JSON.parse(almacen.getItem(CLAVE) ?? 'null')
      if (esRegistro(registro)) return registro
    } catch {}
    return { marcas: {}, historial: [] }
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
      const marca = registro.marcas[clave]
      const nuevaMarca = bate(partida, marca)
      const { puntuacion, tiempo, fecha } = partida
      if (nuevaMarca) {
        registro.marcas[clave] = { puntuacion, tiempo, fecha }
      }
      registro.historial = [partida, ...registro.historial].slice(0, PARTIDAS_EN_HISTORIAL)
      guardar(registro)
      const comparable = !nuevaMarca && !partida.abandonada && marca
      return { nuevaMarca, puntosParaLaMarca: comparable ? marca.puntuacion - puntuacion : null }
    },

    historial(): PartidaJugada[] {
      return leer().historial
    },
  }
}
