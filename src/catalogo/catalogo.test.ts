import { describe, expect, it } from 'vitest'
import { catalogo } from './catalogo'

describe('Catálogo de comunidades autónomas', () => {
  it('entrega las 19 comunidades autónomas', () => {
    expect(catalogo()).toHaveLength(19)
  })

  it('excluye Gibraltar e incluye Ceuta y Melilla', () => {
    const elementos = catalogo()
    const nombres = elementos.map((elemento) => elemento.nombre)

    expect(elementos.map((elemento) => elemento.id)).not.toContain('20')
    expect(nombres.some((nombre) => nombre.includes('Gibraltar'))).toBe(false)
    expect(nombres).toContain('Ciudad Autónoma de Ceuta')
    expect(nombres).toContain('Ciudad Autónoma de Melilla')
  })

  it('muestra en castellano las comunidades con doble nombre oficial y acepta la otra forma como alias', () => {
    const elementos = catalogo()

    expect(elementos).toContainEqual({ id: '09', nombre: 'Cataluña', alias: ['Catalunya'] })
    expect(elementos).toContainEqual({ id: '16', nombre: 'País Vasco', alias: ['Euskadi'] })
    expect(elementos.some((elemento) => elemento.nombre.includes('/'))).toBe(false)
  })
})
