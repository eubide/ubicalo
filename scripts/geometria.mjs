import { writeFileSync } from 'node:fs'
import { geoArea } from 'd3-geo'

export function distancia([unLon, unLat], [otroLon, otroLat]) {
  return Math.hypot(unLon - otroLon, unLat - otroLat)
}

export function largoDe(linea) {
  let total = 0
  for (let i = 1; i < linea.length; i++) total += distancia(linea[i], linea[i - 1])
  return total
}

function distanciaARecta(punto, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const longitud = Math.hypot(dx, dy)
  if (longitud === 0) return Math.hypot(punto[0] - a[0], punto[1] - a[1])
  return Math.abs(dy * punto[0] - dx * punto[1] + b[0] * a[1] - b[1] * a[0]) / longitud
}

export function douglasPeucker(puntos, tolerancia) {
  if (puntos.length < 3) return puntos
  const [primero, ultimo] = [puntos[0], puntos.at(-1)]
  let indice = 0
  let maxima = 0
  for (let i = 1; i < puntos.length - 1; i++) {
    const separacion = distanciaARecta(puntos[i], primero, ultimo)
    if (separacion > maxima) [maxima, indice] = [separacion, i]
  }
  if (maxima <= tolerancia) return [primero, ultimo]
  return [
    ...douglasPeucker(puntos.slice(0, indice + 1), tolerancia).slice(0, -1),
    ...douglasPeucker(puntos.slice(indice), tolerancia),
  ]
}

// d3-geo exige anillos exteriores en sentido horario; las capas del IGN los traen al revés.
export function orientado(anillo) {
  const poligono = { type: 'Polygon', coordinates: [anillo] }
  return geoArea(poligono) > 2 * Math.PI ? [...anillo].reverse() : anillo
}

function simplificarAnillo(anillo, tolerancia) {
  const abierto = anillo.slice(0, -1)
  const mitad = Math.floor(abierto.length / 2)
  const simplificado = [
    ...douglasPeucker(abierto.slice(0, mitad + 1), tolerancia).slice(0, -1),
    ...douglasPeucker([...abierto.slice(mitad), abierto[0]], tolerancia).slice(0, -1),
  ]
  return [...simplificado, simplificado[0]]
}

export function simplificar(geometria, tolerancia, orientar = false) {
  const anillos = (lista) => lista.map((anillo) => simplificarAnillo(orientar ? orientado(anillo) : anillo, tolerancia))
  return geometria.type === 'Polygon'
    ? { type: 'Polygon', coordinates: anillos(geometria.coordinates) }
    : { type: 'MultiPolygon', coordinates: geometria.coordinates.map(anillos) }
}

export function elemento(id, properties, geometry) {
  return { type: 'Feature', id, properties, geometry }
}

export async function descargar(url) {
  const respuesta = await fetch(url)
  if (!respuesta.ok) throw new Error(`${url} respondió ${respuesta.status}`)
  return respuesta.json()
}

export function escribir(nombre, features) {
  writeFileSync(`src/datos/${nombre}.json`, JSON.stringify({ type: 'FeatureCollection', features }))
  console.log(`${features.length} elementos escritos en src/datos/${nombre}.json`)
}
