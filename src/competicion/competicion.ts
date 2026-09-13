import type { Tipo } from '../catalogo/catalogo'
import type { PartidaJugada } from '../partida/partida'
import { etiquetaDeModo, etiquetaDeTipo, type Modo, type Prueba } from '../prueba/prueba'

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

export interface Reto {
  prueba: Prueba
  puntuacion: number
  tiempo: number
}

interface Registro {
  marcas: Record<string, Marca>
  historial: PartidaJugada[]
}

const CLAVE = 'ubicalo:competicion'
const PARTIDAS_EN_HISTORIAL = 10
const MILISEGUNDOS_POR_SEGUNDO = 1_000
const PARAMETROS_DEL_RETO = ['tipo', 'modo', 'puntuacion', 'tiempo']

function claveDe(prueba: Prueba): string {
  return `${prueba.tipo}/${prueba.modo}`
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esTipo(valor: unknown): valor is Tipo {
  return typeof valor === 'string' && Object.hasOwn(etiquetaDeTipo, valor)
}

function esModo(valor: unknown): valor is Modo {
  return typeof valor === 'string' && Object.hasOwn(etiquetaDeModo, valor)
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
    esTipo(prueba.tipo) &&
    esModo(prueba.modo) &&
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

function comparar(partida: PartidaJugada, marca: Pick<Marca, 'puntuacion' | 'tiempo'> | undefined): ResultadoDeRegistro {
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

export function retoDe(partida: PartidaJugada): Reto | null {
  if (partida.abandonada) return null
  const { prueba, puntuacion, tiempo } = partida
  return { prueba, puntuacion, tiempo }
}

export function superaReto(partida: PartidaJugada, reto: Reto): boolean {
  return comparar(partida, reto).caso === 'nueva-marca'
}

export function enlaceDeReto(reto: Reto, pagina: string): string {
  const enlace = new URL(pagina)
  enlace.search = new URLSearchParams({
    tipo: reto.prueba.tipo,
    modo: reto.prueba.modo,
    puntuacion: String(reto.puntuacion),
    tiempo: String(reto.tiempo),
  }).toString()
  enlace.hash = ''
  return enlace.toString()
}

export function retoDeEnlace(enlace: string): Reto | null {
  if (!URL.canParse(enlace)) return null
  const parametros = new URL(enlace).searchParams
  const tipo = parametros.get('tipo')
  const modo = parametros.get('modo')
  const puntuacion = entero(parametros.get('puntuacion'))
  const tiempo = entero(parametros.get('tiempo'))
  if (!esTipo(tipo) || !esModo(modo) || puntuacion === null || tiempo === null) return null
  return { prueba: { tipo, modo }, puntuacion, tiempo }
}

export function enlaceSinReto(enlace: string): string {
  const url = new URL(enlace)
  for (const parametro of PARAMETROS_DEL_RETO) url.searchParams.delete(parametro)
  return url.toString()
}

function entero(parametro: string | null): number | null {
  if (!parametro || !/^\d+$/.test(parametro)) return null
  const valor = Number(parametro)
  return Number.isSafeInteger(valor) ? valor : null
}
