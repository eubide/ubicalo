import { describe, expect, it } from 'vitest'
import { catalogo } from './catalogo'

describe('Catálogo de comunidades autónomas', () => {
  it('entrega las 19 comunidades autónomas', () => {
    expect(catalogo('comunidades')).toHaveLength(19)
  })

  it('excluye Gibraltar e incluye Ceuta y Melilla', () => {
    const elementos = catalogo('comunidades')
    const nombres = elementos.map((elemento) => elemento.nombre)

    expect(elementos.map((elemento) => elemento.id)).not.toContain('20')
    expect(nombres.some((nombre) => nombre.includes('Gibraltar'))).toBe(false)
    expect(nombres).toContain('Ciudad Autónoma de Ceuta')
    expect(nombres).toContain('Ciudad Autónoma de Melilla')
  })

  it('muestra en castellano las comunidades con doble nombre oficial y acepta la otra forma como alias', () => {
    const elementos = catalogo('comunidades')

    expect(elementos).toContainEqual({ id: '09', nombre: 'Cataluña', nombreMostrado: 'Cataluña', alias: ['Catalunya'] })
    expect(elementos).toContainEqual({
      id: '16',
      nombre: 'País Vasco',
      nombreMostrado: 'País Vasco',
      alias: ['Euskadi'],
    })
    expect(elementos.some((elemento) => elemento.nombreMostrado.includes('/'))).toBe(false)
  })

  it('muestra el nombre oficial con la forma castellana entre paréntesis y acepta esa forma como alias', () => {
    const elementos = catalogo('comunidades')

    expect(elementos).toContainEqual({
      id: '04',
      nombre: 'Illes Balears',
      nombreMostrado: 'Illes Balears (Islas Baleares)',
      alias: ['Islas Baleares'],
    })
    expect(elementos).toContainEqual({
      id: '10',
      nombre: 'Comunitat Valenciana',
      nombreMostrado: 'Comunitat Valenciana (Comunidad Valenciana)',
      alias: ['Comunidad Valenciana'],
    })
    expect(elementos.filter((elemento) => elemento.alias.length > 0)).toHaveLength(4)
  })

  it('muestra tal cual el nombre oficial cuando no tiene otra forma', () => {
    expect(catalogo('comunidades')).toContainEqual({
      id: '11',
      nombre: 'Extremadura',
      nombreMostrado: 'Extremadura',
      alias: [],
    })
  })
})

describe('Catálogo de provincias', () => {
  it('entrega las 52 provincias, sin Gibraltar y con Ceuta y Melilla', () => {
    const elementos = catalogo('provincias')
    const nombres = elementos.map((elemento) => elemento.nombre)

    expect(elementos).toHaveLength(52)
    expect(elementos.map((elemento) => elemento.id)).not.toContain('54')
    expect(nombres.some((nombre) => nombre.includes('Gibraltar'))).toBe(false)
    expect(nombres).toContain('Ceuta')
    expect(nombres).toContain('Melilla')
  })

  it('muestra en castellano las provincias con doble nombre oficial y acepta la otra forma como alias', () => {
    const elementos = catalogo('provincias')

    expect(elementos).toContainEqual({ id: '03', nombre: 'Alicante', nombreMostrado: 'Alicante', alias: ['Alacant'] })
    expect(elementos).toContainEqual({ id: '12', nombre: 'Castellón', nombreMostrado: 'Castellón', alias: ['Castelló'] })
    expect(elementos).toContainEqual({ id: '46', nombre: 'Valencia', nombreMostrado: 'Valencia', alias: ['València'] })
    expect(elementos).toContainEqual({ id: '01', nombre: 'Álava', nombreMostrado: 'Álava', alias: ['Araba'] })
    expect(elementos.some((elemento) => elemento.nombreMostrado.includes('/'))).toBe(false)
  })

  it('muestra el nombre oficial con la forma castellana entre paréntesis y acepta esa forma como alias', () => {
    const elementos = catalogo('provincias')

    expect(elementos).toContainEqual({ id: '17', nombre: 'Girona', nombreMostrado: 'Girona (Gerona)', alias: ['Gerona'] })
    expect(elementos).toContainEqual({ id: '25', nombre: 'Lleida', nombreMostrado: 'Lleida (Lérida)', alias: ['Lérida'] })
    expect(elementos).toContainEqual({
      id: '15',
      nombre: 'A Coruña',
      nombreMostrado: 'A Coruña (La Coruña)',
      alias: ['La Coruña'],
    })
    expect(elementos).toContainEqual({ id: '32', nombre: 'Ourense', nombreMostrado: 'Ourense (Orense)', alias: ['Orense'] })
    expect(elementos).toContainEqual({
      id: '20',
      nombre: 'Gipuzkoa',
      nombreMostrado: 'Gipuzkoa (Guipúzcoa)',
      alias: ['Guipúzcoa'],
    })
    expect(elementos).toContainEqual({
      id: '48',
      nombre: 'Bizkaia',
      nombreMostrado: 'Bizkaia (Vizcaya)',
      alias: ['Vizcaya'],
    })
    expect(elementos).toContainEqual({
      id: '07',
      nombre: 'Illes Balears',
      nombreMostrado: 'Illes Balears (Islas Baleares)',
      alias: ['Islas Baleares'],
    })
    expect(elementos.filter((elemento) => elemento.alias.length > 0)).toHaveLength(11)
  })
})
