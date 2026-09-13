import { describe, expect, it } from 'vitest'
import { catalogo, type Tipo } from './catalogo'

function nombresDelCatalogo(tipo: Tipo) {
  return catalogo(tipo).map(({ vecinos: _vecinos, comunidad: _comunidad, ...nombres }) => nombres)
}

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
    const elementos = nombresDelCatalogo('comunidades')

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
    const elementos = nombresDelCatalogo('comunidades')

    expect(elementos).toContainEqual({
      id: '04',
      nombre: 'Illes Balears',
      nombreMostrado: 'Illes Balears (Islas Baleares)',
      alias: ['Islas Baleares', 'Baleares'],
    })
    expect(elementos).toContainEqual({
      id: '10',
      nombre: 'Comunitat Valenciana',
      nombreMostrado: 'Comunitat Valenciana (Comunidad Valenciana)',
      alias: ['Comunidad Valenciana', 'Valencia'],
    })
    expect(elementos.filter((elemento) => elemento.alias.length > 0)).toHaveLength(11)
  })

  it('acepta como alias las formas cortas habituales sin cambiar el nombre mostrado', () => {
    const elementos = nombresDelCatalogo('comunidades')
    const porId = (id: string) => elementos.find((elemento) => elemento.id === id)!

    expect(porId('03')).toEqual({
      id: '03',
      nombre: 'Principado de Asturias',
      nombreMostrado: 'Principado de Asturias',
      alias: ['Asturias'],
    })
    expect(porId('13').alias).toEqual(['Madrid'])
    expect(porId('14').alias).toEqual(['Murcia'])
    expect(porId('15').alias).toEqual(['Navarra'])
    expect(porId('17').alias).toEqual(['Rioja'])
    expect(porId('18').alias).toEqual(['Ceuta'])
    expect(porId('19').alias).toEqual(['Melilla'])
  })

  it('la Comunidad de Madrid tiene como vecinos exactamente Castilla y León y Castilla-La Mancha', () => {
    const elementos = catalogo('comunidades')
    const madrid = elementos.find((elemento) => elemento.nombre === 'Comunidad de Madrid')!
    const nombresDeVecinos = madrid.vecinos.map((id) => elementos.find((elemento) => elemento.id === id)!.nombre)

    expect(nombresDeVecinos.sort()).toEqual(['Castilla y León', 'Castilla-La Mancha'].sort())
  })

  it('muestra tal cual el nombre oficial cuando no tiene otra forma', () => {
    expect(nombresDelCatalogo('comunidades')).toContainEqual({
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
    const elementos = nombresDelCatalogo('provincias')

    expect(elementos).toContainEqual({ id: '03', nombre: 'Alicante', nombreMostrado: 'Alicante', alias: ['Alacant'] })
    expect(elementos).toContainEqual({ id: '12', nombre: 'Castellón', nombreMostrado: 'Castellón', alias: ['Castelló'] })
    expect(elementos).toContainEqual({ id: '46', nombre: 'Valencia', nombreMostrado: 'Valencia', alias: ['València'] })
    expect(elementos).toContainEqual({ id: '01', nombre: 'Álava', nombreMostrado: 'Álava', alias: ['Araba'] })
    expect(elementos.some((elemento) => elemento.nombreMostrado.includes('/'))).toBe(false)
  })

  it('muestra el nombre oficial con la forma castellana entre paréntesis y acepta esa forma como alias', () => {
    const elementos = nombresDelCatalogo('provincias')

    expect(elementos).toContainEqual({ id: '17', nombre: 'Girona', nombreMostrado: 'Girona (Gerona)', alias: ['Gerona'] })
    expect(elementos).toContainEqual({ id: '25', nombre: 'Lleida', nombreMostrado: 'Lleida (Lérida)', alias: ['Lérida'] })
    expect(elementos).toContainEqual({
      id: '15',
      nombre: 'A Coruña',
      nombreMostrado: 'A Coruña (La Coruña)',
      alias: ['La Coruña', 'Coruña'],
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
      alias: ['Islas Baleares', 'Baleares'],
    })
    expect(elementos.filter((elemento) => elemento.alias.length > 0)).toHaveLength(13)
  })

  it('la provincia de Madrid tiene como vecinos exactamente Toledo, Ávila, Segovia, Guadalajara y Cuenca', () => {
    const elementos = catalogo('provincias')
    const madrid = elementos.find((elemento) => elemento.nombre === 'Madrid')!
    const nombresDeVecinos = madrid.vecinos.map((id) => elementos.find((elemento) => elemento.id === id)!.nombre)

    expect(nombresDeVecinos.sort()).toEqual(['Cuenca', 'Guadalajara', 'Segovia', 'Toledo', 'Ávila'].sort())
  })

  it('acepta como alias las formas cortas habituales sin cambiar el nombre mostrado', () => {
    const elementos = nombresDelCatalogo('provincias')
    const porId = (id: string) => elementos.find((elemento) => elemento.id === id)!

    expect(porId('26')).toEqual({ id: '26', nombre: 'La Rioja', nombreMostrado: 'La Rioja', alias: ['Rioja'] })
    expect(porId('38')).toEqual({
      id: '38',
      nombre: 'Santa Cruz de Tenerife',
      nombreMostrado: 'Santa Cruz de Tenerife',
      alias: ['Tenerife'],
    })
  })

  it('cada provincia conoce la comunidad autónoma que la contiene', () => {
    const provincias = catalogo('provincias')
    const comunidades = catalogo('comunidades')
    const comunidadDe = (provincia: string) => {
      const { comunidad } = provincias.find((elemento) => elemento.nombre === provincia)!
      return comunidades.find((elemento) => elemento.id === comunidad)?.nombre
    }

    expect(comunidadDe('Teruel')).toBe('Aragón')
    expect(comunidadDe('Ceuta')).toBe('Ciudad Autónoma de Ceuta')
    expect(comunidadDe('Melilla')).toBe('Ciudad Autónoma de Melilla')
    expect(comunidadDe('Illes Balears')).toBe('Illes Balears')
    expect(comunidadDe('Las Palmas')).toBe('Canarias')
    expect(comunidadDe('Santa Cruz de Tenerife')).toBe('Canarias')
    expect(comunidadDe('Valladolid')).toBe('Castilla y León')
    expect(comunidadDe('Cádiz')).toBe('Andalucía')
    expect(comunidadDe('Madrid')).toBe('Comunidad de Madrid')
    expect(comunidadDe('Álava')).toBe('País Vasco')
    expect(comunidadDe('Alicante')).toBe('Comunitat Valenciana')
  })

  it('las 52 provincias pertenecen a alguna de las 19 comunidades y todas las comunidades tienen provincia', () => {
    const idsDeComunidades = catalogo('comunidades').map((elemento) => elemento.id)
    const comunidadesDeProvincias = catalogo('provincias').map((elemento) => elemento.comunidad)

    expect(comunidadesDeProvincias).toHaveLength(52)
    expect(comunidadesDeProvincias.every((comunidad) => idsDeComunidades.includes(comunidad!))).toBe(true)
    expect(new Set(comunidadesDeProvincias).size).toBe(19)
  })
})
