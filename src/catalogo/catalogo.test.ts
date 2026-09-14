import { describe, expect, it } from 'vitest'
import { catalogo, catalogoDelMapa, contextoDe, contornos, type Tipo } from './catalogo'

function nombresDelCatalogo(tipo: Tipo) {
  return catalogo(tipo).map(({ vecinos: _v, comunidad: _c, cordillera: _cord, clase: _cl, altura: _a, ...nombres }) => nombres)
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

  it('solo Ceuta y Melilla son ciudades autónomas, como provincias y como comunidades', () => {
    const ciudadesAutonomas = (tipo: Tipo) =>
      catalogo(tipo)
        .filter((elemento) => elemento.ciudadAutonoma)
        .map((elemento) => elemento.nombre)

    expect(ciudadesAutonomas('provincias')).toEqual(['Ceuta', 'Melilla'])
    expect(ciudadesAutonomas('comunidades')).toEqual(['Ciudad Autónoma de Ceuta', 'Ciudad Autónoma de Melilla'])
  })

  it('las 52 provincias pertenecen a alguna de las 19 comunidades y todas las comunidades tienen provincia', () => {
    const idsDeComunidades = catalogo('comunidades').map((elemento) => elemento.id)
    const comunidadesDeProvincias = catalogo('provincias').map((elemento) => elemento.comunidad)

    expect(comunidadesDeProvincias).toHaveLength(52)
    expect(comunidadesDeProvincias.every((comunidad) => idsDeComunidades.includes(comunidad!))).toBe(true)
    expect(new Set(comunidadesDeProvincias).size).toBe(19)
  })
})

describe('Catálogo de cordilleras y sierras', () => {
  it('entrega las 11 cordilleras de los apuntes seguidas de las 15 sierras y las 3 partes del Pirineo', () => {
    const elementos = catalogo('cordilleras-y-sierras')
    const nombres = elementos.map((elemento) => elemento.nombre)

    expect(nombres.slice(0, 11)).toEqual([
      'Pirineos',
      'Cordillera Cantábrica',
      'Macizo Galaico-Leonés',
      'Montes Vascos',
      'Sistema Ibérico',
      'Sistema Central',
      'Montes de Toledo',
      'Sierra Morena',
      'Cordilleras Béticas',
      'Cordillera Costero-Catalana',
      'Montañas de Canarias',
    ])
    expect(elementos).toHaveLength(29)
    expect(elementos.filter((elemento) => elemento.clase === 'cordillera')).toHaveLength(11)
    expect(elementos.filter((elemento) => elemento.clase === 'sierra')).toHaveLength(18)
  })

  it('cada sierra y parte del Pirineo conoce su cordillera, y las cordilleras no tienen', () => {
    const elementos = catalogo('cordilleras-y-sierras')
    const cordilleraDe = (nombre: string) => elementos.find((elemento) => elemento.nombre === nombre)!.cordillera

    expect(cordilleraDe('Sierra de Gredos')).toBe('sistema-central')
    expect(cordilleraDe('Picos de Europa')).toBe('cordillera-cantabrica')
    expect(cordilleraDe('Montserrat')).toBe('cordillera-costero-catalana')
    expect(cordilleraDe('Pirineo Aragonés')).toBe('pirineos')
    expect(cordilleraDe('Pirineos')).toBeUndefined()
  })

  it('muestra el nombre tal cual, con su clase, y acepta las formas de los libros como alias', () => {
    const elementos = catalogo('cordilleras-y-sierras')
    const porId = (id: string) => elementos.find((elemento) => elemento.id === id)!

    expect(porId('cordillera-cantabrica')).toMatchObject({
      nombre: 'Cordillera Cantábrica',
      nombreMostrado: 'Cordillera Cantábrica',
      alias: ['Cantábrica', 'Montes Cantábricos'],
      clase: 'cordillera',
    })
    expect(porId('cordilleras-beticas').alias).toEqual(['Béticas', 'Sistema Bético', 'Sistemas Béticos'])
    expect(porId('sierra-de-gredos')).toMatchObject({ nombreMostrado: 'Sierra de Gredos', alias: ['Gredos'], clase: 'sierra' })
    expect(porId('pirineo-aragones').alias).toEqual(['Aragonés'])
    expect(porId('montes-vascos').alias).toEqual([])
  })

  it('los vecinos son los tres más cercanos entre cordilleras y sierras', () => {
    const elementos = catalogo('cordilleras-y-sierras')
    const vecinosDe = (nombre: string) =>
      elementos
        .find((elemento) => elemento.nombre === nombre)!
        .vecinos.map((id) => elementos.find((elemento) => elemento.id === id)!.nombre)

    expect(vecinosDe('Montes de Toledo')).toEqual(['Sierra de Gredos', 'Sierra de Béjar', 'Sistema Central'])
    expect(vecinosDe('Sierra de Gredos')).toEqual(['Sistema Central', 'Sierra de Béjar', 'Montes de Toledo'])
    expect(elementos.every((elemento) => elemento.vecinos.length === 3)).toBe(true)
  })
})

describe('Catálogo de picos', () => {
  it('entrega un pico por cordillera, en el orden de las cordilleras', () => {
    const picos = catalogo('picos')
    const cordilleras = catalogo('cordilleras-y-sierras').filter((elemento) => elemento.clase === 'cordillera')

    expect(picos.map((elemento) => elemento.nombre)).toEqual([
      'Aneto',
      'Torre Cerredo',
      'Peña Trevinca',
      'Aizkorri',
      'Moncayo',
      'Almanzor',
      'Rocigalgo',
      'Bañuela',
      'Mulhacén',
      "Turó de l'Home",
      'Teide',
    ])
    expect(picos.map((elemento) => elemento.cordillera)).toEqual(cordilleras.map((elemento) => elemento.id))
    expect(picos.every((elemento) => elemento.clase === 'pico' && elemento.pregunta === undefined)).toBe(true)
  })

  it('solo los cuatro picos examinados llevan su altura, para escribirla bajo el icono', () => {
    const conAltura = catalogo('picos').filter((elemento) => elemento.altura !== undefined)

    expect(conAltura.map((elemento) => [elemento.id, elemento.altura])).toEqual([
      ['aneto', 3404],
      ['moncayo', 2314],
      ['mulhacen', 3479],
      ['teide', 3715],
    ])
  })

  it('acepta las otras formas habituales como alias', () => {
    const elementos = nombresDelCatalogo('picos')

    expect(elementos).toContainEqual({
      id: 'torre-cerredo',
      nombre: 'Torre Cerredo',
      nombreMostrado: 'Torre Cerredo',
      alias: ['Torrecerredo', 'Torre de Cerredo'],
    })
    expect(elementos).toContainEqual({ id: 'aizkorri', nombre: 'Aizkorri', nombreMostrado: 'Aizkorri', alias: ['Aketegi'] })
    expect(elementos).toContainEqual({ id: 'aneto', nombre: 'Aneto', nombreMostrado: 'Aneto', alias: [] })
  })

  it('los vecinos de un pico son los tres más cercanos', () => {
    const elementos = catalogo('picos')
    const almanzor = elementos.find((elemento) => elemento.nombre === 'Almanzor')!
    const nombres = almanzor.vecinos.map((id) => elementos.find((elemento) => elemento.id === id)!.nombre)

    expect(nombres).toEqual(['Rocigalgo', 'Bañuela', 'Peña Trevinca'])
  })
})

describe('Catálogo de jerarquía', () => {
  it('pregunta sierras y picos hacia su cordillera, y cordilleras hacia su pico', () => {
    const elementos = catalogo('jerarquia')
    const porNombre = (nombre: string) => elementos.find((elemento) => elemento.nombre === nombre)!

    expect(elementos).toHaveLength(40)
    expect(porNombre('Sierra de Gredos')).toMatchObject({
      nombreMostrado: 'Sierra de Gredos (sierra)',
      respuesta: 'sistema-central',
      pregunta: 'Toca su cordillera',
    })
    expect(porNombre('Pirineo Catalán').nombreMostrado).toBe('Pirineo Catalán (sierra)')
    expect(porNombre('Rocigalgo')).toMatchObject({ nombreMostrado: 'Rocigalgo (pico)', respuesta: 'montes-de-toledo' })
    expect(porNombre('Teide').respuesta).toBe('montanas-de-canarias')
    expect(porNombre('Pirineos')).toMatchObject({
      nombreMostrado: 'Pirineos',
      respuesta: 'aneto',
      pregunta: 'Toca su pico',
      destacar: true,
    })
    expect(porNombre('Sierra de Gredos').destacar).toBeUndefined()
  })

  it('los vecinos son los del elemento que se toca, para que la Pista de área ilumine lo tocable', () => {
    const elementos = catalogo('jerarquia')
    const mapa = catalogoDelMapa('jerarquia')
    const porId = (lista: typeof elementos, id: string) => lista.find((elemento) => elemento.id === id)!

    expect(porId(elementos, 'sierra-de-gredos').vecinos).toEqual(porId(mapa, 'sistema-central').vecinos)
    expect(porId(elementos, 'pirineos').vecinos).toEqual(porId(mapa, 'aneto').vecinos)
  })

  it('el mapa de la jerarquía son las 11 cordilleras y los 11 picos', () => {
    const mapa = catalogoDelMapa('jerarquia')

    expect(mapa).toHaveLength(22)
    expect(mapa.map((elemento) => elemento.clase)).toEqual([...Array(11).fill('cordillera'), ...Array(11).fill('pico')])
    expect(contornos('jerarquia').map((contorno) => contorno.id)).toEqual(mapa.map((elemento) => elemento.id))
    expect(catalogoDelMapa('picos')).toEqual(catalogo('picos'))
  })
})

describe('Catálogo de alturas', () => {
  it('pregunta la altura de Moncayo, Aneto, Teide y Mulhacén y acepta la cifra con o sin punto', () => {
    const elementos = catalogo('alturas')

    expect(elementos.map((elemento) => elemento.pregunta)).toEqual([
      'Altura del Moncayo',
      'Altura del Aneto',
      'Altura del Teide',
      'Altura del Mulhacén',
    ])
    expect(elementos.find((elemento) => elemento.id === 'aneto')).toEqual({
      id: 'aneto',
      nombre: '3404',
      nombreMostrado: '3.404 m',
      alias: ['3.404', '3404 m', '3.404 m'],
      vecinos: [],
      clase: 'pico',
      cordillera: 'pirineos',
      pregunta: 'Altura del Aneto',
      rotulo: 'Aneto · 3.404 m',
    })
  })
})

describe('Contexto geográfico del relieve', () => {
  it('provincias y comunidades no llevan contexto de relieve', () => {
    expect(contextoDe('provincias')).toBeNull()
    expect(contextoDe('comunidades')).toBeNull()
  })

  it('el relieve lleva el contorno de España y los ríos; picos y alturas además las cordilleras en tenue', () => {
    expect(contextoDe('cordilleras-y-sierras')?.contorno.geometry.type).toBe('MultiPolygon')
    expect(contextoDe('cordilleras-y-sierras')?.rios.length).toBeGreaterThan(20)
    expect(contextoDe('cordilleras-y-sierras')?.tenues).toEqual([])
    expect(contextoDe('jerarquia')?.tenues).toEqual([])
    expect(contextoDe('picos')?.tenues).toHaveLength(11)
    expect(contextoDe('alturas')?.tenues).toHaveLength(11)
  })

  it('los contornos de alturas son los cuatro picos examinados, en el orden de los apuntes', () => {
    expect(contornos('alturas').map((contorno) => contorno.id)).toEqual(['moncayo', 'aneto', 'teide', 'mulhacen'])
  })
})
