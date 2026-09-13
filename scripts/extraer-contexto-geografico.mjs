import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const mundo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'))

// ISO 3166-1 numérico: Portugal, Francia, Andorra y Marruecos.
const PAISES = new Set(['620', '250', '020', '504'])

const paises = feature(mundo, mundo.objects.countries)
const contexto = {
  type: 'FeatureCollection',
  features: paises.features.filter((pais) => PAISES.has(pais.id)),
}

mkdirSync('src/datos', { recursive: true })
writeFileSync('src/datos/contexto-geografico.json', JSON.stringify(contexto))
console.log(`${contexto.features.length} países escritos en src/datos/contexto-geografico.json`)
