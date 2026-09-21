import { describe, expect, it } from 'vitest'
import { render } from 'svelte/server'
import { catalogo } from '../catalogo/catalogo'
import { FAMILIAS } from '../prueba/prueba'
import HojaImprimible from './HojaImprimible.svelte'
import { hojasDe } from './imprimible'

describe('la hoja va muda', () => {
  for (const { familia } of FAMILIAS) {
    it(`no escribe ningún nombre de ${familia}`, () => {
      for (const hoja of hojasDe(familia)) {
        const { body } = render(HojaImprimible, { props: { familia, hoja } })
        // Las cifras de una Altura también salen dentro de los trazados, así que se mira solo el texto.
        const aLaVista = body.replace(/<[^>]*>/g, ' ')
        const escritos = catalogo(hoja.alcance).flatMap(({ nombre, nombreMostrado, alias }) => [
          nombre,
          nombreMostrado,
          ...alias,
        ])

        expect(escritos.filter((nombre) => aLaVista.includes(nombre))).toEqual([])
      }
    })
  }
})
