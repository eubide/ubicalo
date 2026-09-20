import type { Alcance, Elemento } from '../catalogo/catalogo'
import { barajar, type Azar } from '../partida/partida'
import type { Entrada } from './dominio'

export interface CatalogoDeExamen {
  alcance: Alcance
  elementos: Elemento[]
}

export interface Tanda {
  alcance: Alcance
  elementos: Elemento[]
  nuevos: string[]
}

interface Reparto {
  porRepasar: Elemento[]
  sinVer: Elemento[]
  sabidosDeHoy: Elemento[]
}

const ELEMENTOS_POR_TANDA = 12
const NUEVOS_MINIMOS = 3
const NUEVOS_MAXIMOS = 6

function padreDe(elemento: Elemento): string | undefined {
  return elemento.desbloqueaCon?.[0]
}

// Las Provincias no cuelgan de nada dentro de su catálogo: su rama es su comunidad.
function juntasPorComunidad(raices: Elemento[]): Elemento[] {
  const comunidades = [...new Set(raices.map((raiz) => raiz.comunidad))]
  return comunidades.flatMap((comunidad) => raices.filter((raiz) => raiz.comunidad === comunidad))
}

function enOrdenDeLlegada(elementos: Elemento[]): Elemento[] {
  const hijosDe = (id: string) => elementos.filter((elemento) => padreDe(elemento) === id)
  const ramaDe = (elemento: Elemento): Elemento[] => [elemento, ...hijosDe(elemento.id).flatMap(ramaDe)]
  const raices = juntasPorComunidad(elementos.filter((elemento) => padreDe(elemento) === undefined))
  return [...raices, ...raices.flatMap((raiz) => hijosDe(raiz.id).flatMap(ramaDe))]
}

function repartoDe(elementos: Elemento[], entradas: Record<string, Entrada>, hoy: string): Reparto {
  const vistos = elementos.filter((elemento) => entradas[elemento.id])
  const flojos = vistos
    .filter((elemento) => entradas[elemento.id].estado === 'flojo')
    .sort((a, b) => entradas[b.id].fallos - entradas[a.id].fallos)
  const sabidos = vistos.filter((elemento) => entradas[elemento.id].estado === 'sabido')
  const sabidosDeOtroDia = sabidos
    .filter((elemento) => entradas[elemento.id].visto !== hoy)
    .sort((a, b) => entradas[a.id].visto.localeCompare(entradas[b.id].visto))
  return {
    porRepasar: [...flojos, ...sabidosDeOtroDia],
    sinVer: enOrdenDeLlegada(elementos).filter((elemento) => !entradas[elemento.id]),
    sabidosDeHoy: sabidos.filter((elemento) => entradas[elemento.id].visto === hoy),
  }
}

// Una Tanda es de un solo catálogo para que el mapa no cambie a mitad. Se la lleva el que más tiene por
// repasar, y un catálogo no trae nuevos hasta que los anteriores se han visto enteros.
export function componerTanda(
  examen: CatalogoDeExamen[],
  entradasDe: (alcance: Alcance) => Record<string, Entrada>,
  hoy: string,
  azar: Azar,
): Tanda | null {
  const repartos = examen.map(({ alcance, elementos }) => ({ alcance, ...repartoDe(elementos, entradasDe(alcance), hoy) }))
  const candidatos = repartos
    .map((reparto, i) => {
      const anterioresVistos = repartos.slice(0, i).every((anterior) => anterior.sinVer.length === 0)
      return { ...reparto, sinVer: anterioresVistos ? reparto.sinVer : [] }
    })
    .filter(({ porRepasar, sinVer }) => porRepasar.length > 0 || sinVer.length > 0)
  if (candidatos.length === 0) return null
  const { alcance, porRepasar, sinVer, sabidosDeHoy } = candidatos.reduce((elegido, candidato) =>
    candidato.porRepasar.length > elegido.porRepasar.length ? candidato : elegido,
  )

  const huecosParaNuevos = Math.min(Math.max(ELEMENTOS_POR_TANDA - porRepasar.length, NUEVOS_MINIMOS), NUEVOS_MAXIMOS)
  const nuevos = sinVer.slice(0, huecosParaNuevos)
  const repaso = porRepasar.slice(0, ELEMENTOS_POR_TANDA - nuevos.length)
  // Sin nuevos no se rellena: volver a preguntar lo Sabido hoy solo da ocasión de fallarlo, y una Familia
  // ya vista entera no terminaría nunca de quedarse sin Flojos.
  const huecosDeRelleno = nuevos.length > 0 ? ELEMENTOS_POR_TANDA - nuevos.length - repaso.length : 0
  return {
    alcance,
    elementos: barajar([...repaso, ...nuevos, ...sabidosDeHoy.slice(0, huecosDeRelleno)], azar),
    nuevos: nuevos.map((elemento) => elemento.id),
  }
}
