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

describe('Catálogo de simulacro', () => {
  it('entrega las 44 piezas del relieve: cordilleras, sierras, picos y las cuatro alturas', () => {
    const elementos = catalogo('simulacro')

    expect(elementos).toHaveLength(44)
    expect(elementos.filter((elemento) => elemento.clase === 'cordillera')).toHaveLength(11)
    expect(elementos.filter((elemento) => elemento.clase === 'sierra')).toHaveLength(18)
    expect(elementos.filter((elemento) => elemento.clase === 'pico')).toHaveLength(15)
  })

  it('las 11 cordilleras están desbloqueadas desde el principio', () => {
    const cordilleras = catalogo('simulacro').filter((elemento) => elemento.clase === 'cordillera')

    expect(cordilleras).toHaveLength(11)
    expect(cordilleras.every((elemento) => elemento.desbloqueaCon?.length === 0)).toBe(true)
  })

  it('una sierra se desbloquea al acertar su cordillera', () => {
    const elementos = catalogo('simulacro')
    const gredos = elementos.find((elemento) => elemento.id === 'sierra-de-gredos')!

    expect(gredos.desbloqueaCon).toEqual(['sistema-central'])
  })

  it('un pico se desbloquea al acertar su cordillera y todas sus sierras', () => {
    const elementos = catalogo('simulacro')
    const almanzor = elementos.find((elemento) => elemento.id === 'almanzor')!

    expect(almanzor.desbloqueaCon).toHaveLength(5)
    expect(almanzor.desbloqueaCon).toContain('sistema-central')
    expect(almanzor.desbloqueaCon).toEqual(
      expect.arrayContaining(['sierra-de-gata', 'sierra-de-gredos', 'sierra-de-guadarrama', 'sierra-de-bejar']),
    )
  })

  it('el pico de una cordillera sin sierras se desbloquea solo con la cordillera', () => {
    const aizkorri = catalogo('simulacro').find((elemento) => elemento.id === 'aizkorri')!

    expect(aizkorri.desbloqueaCon).toEqual(['montes-vascos'])
  })

  it('las cuatro alturas se desbloquean con su pico, y su id no coincide con el del pico', () => {
    const alturas = catalogo('simulacro').filter((elemento) => elemento.id.startsWith('altura-'))

    expect(alturas).toHaveLength(4)
    const anetoAltura = alturas.find((elemento) => elemento.id === 'altura-aneto')!
    expect(anetoAltura.desbloqueaCon).toEqual(['aneto'])
    expect(anetoAltura.id).not.toBe('aneto')
    expect(anetoAltura.nombreMostrado).toBe('3.404 m')
  })

  it('el mapa del simulacro son las 40 piezas con geometría propia, sin las alturas', () => {
    const mapa = catalogoDelMapa('simulacro')

    expect(mapa).toHaveLength(40)
    expect(mapa.every((elemento) => elemento.id.startsWith('altura-') === false)).toBe(true)
    expect(contornos('simulacro')).toHaveLength(40)
  })
})

describe('Catálogo de ríos', () => {
  it('entrega los 41 ríos de los apuntes: 6 principales, 11 propios y 24 afluentes', () => {
    const rios = catalogo('rios')
    const deClase = (clase: string) => rios.filter((rio) => rio.clase === clase)

    expect(rios).toHaveLength(41)
    expect(deClase('rio-principal').map((rio) => rio.nombre)).toEqual([
      'Ebro',
      'Duero',
      'Tajo',
      'Guadiana',
      'Guadalquivir',
      'Miño',
    ])
    expect(deClase('rio-propio')).toHaveLength(11)
    expect(deClase('afluente')).toHaveLength(24)
  })

  it('cada río del nivel superior conoce su vertiente y ningún afluente la lleva', () => {
    const rios = catalogo('rios')
    const vertienteDe = (id: string) => rios.find((rio) => rio.id === id)?.vertiente

    expect(vertienteDe('ebro')).toBe('vertiente-mediterranea')
    expect(vertienteDe('mino')).toBe('vertiente-atlantica')
    expect(vertienteDe('nervion')).toBe('vertiente-cantabrica')
    expect(rios.filter((rio) => rio.clase === 'afluente').every((rio) => rio.vertiente === undefined)).toBe(true)
  })

  it('cada afluente conoce su río principal, aunque desemboque en otro afluente', () => {
    const rios = catalogo('rios')
    const rio = (id: string) => rios.find((candidato) => candidato.id === id)!

    expect(rio('segre').cuenca).toBe('ebro')
    expect(rio('cinca')).toMatchObject({ desembocaEn: 'segre', cuenca: 'ebro' })
    expect(rio('jiloca')).toMatchObject({ desembocaEn: 'jalon', cuenca: 'ebro' })
    expect(rio('zancara')).toMatchObject({ desembocaEn: 'ciguela', cuenca: 'guadiana' })
    expect(rio('guadiana-menor').cuenca).toBe('guadalquivir')
  })

  it('las seis cuencas reparten los 24 afluentes', () => {
    const afluentes = catalogo('rios').filter((rio) => rio.clase === 'afluente')
    const porCuenca = (cuenca: string) => afluentes.filter((rio) => rio.cuenca === cuenca).length

    expect([porCuenca('ebro'), porCuenca('duero'), porCuenca('tajo')]).toEqual([8, 4, 4])
    expect([porCuenca('guadiana'), porCuenca('guadalquivir'), porCuenca('mino')]).toEqual([4, 3, 1])
  })

  it('los vecinos de un afluente son sus hermanos de cuenca', () => {
    const rios = catalogo('rios')
    const vecinosDe = (id: string) => rios.find((rio) => rio.id === id)!.vecinos

    expect(vecinosDe('tormes').sort()).toEqual(['adaja', 'esla', 'pisuerga'])
    expect(vecinosDe('sil')).toEqual([])
    expect(vecinosDe('jiloca')).toContain('segre')
    expect(vecinosDe('jiloca')).not.toContain('tormes')
  })

  it('los vecinos de un río del nivel superior son los demás de su vertiente', () => {
    const rios = catalogo('rios')
    const vecinosDe = (id: string) => rios.find((rio) => rio.id === id)!.vecinos

    expect(vecinosDe('nalon').sort()).toEqual(['bidasoa', 'nervion'])
    expect(vecinosDe('ebro')).toContain('jucar')
    expect(vecinosDe('ebro')).not.toContain('segre')
    expect(vecinosDe('ebro')).not.toContain('duero')
  })

  it('acepta como alias las otras formas del nombre', () => {
    const rios = catalogo('rios')
    const aliasDe = (id: string) => rios.find((rio) => rio.id === id)!.alias

    expect(aliasDe('jucar')).toEqual(['Xúquer'])
    expect(aliasDe('ciguela')).toEqual(['Gigüela'])
    expect(aliasDe('ebro')).toEqual([])
  })

  it('solo los tres pares que se confunden llevan frase de desambiguación', () => {
    const conDesambiguacion = catalogo('rios').filter((rio) => rio.desambiguacion !== undefined)

    expect(conDesambiguacion.map((rio) => rio.id).sort()).toEqual([
      'alagon',
      'aragon',
      'ciguela',
      'guadiana',
      'guadiana-menor',
      'zancara',
    ])
    expect(conDesambiguacion.find((rio) => rio.id === 'aragon')?.desambiguacion).toContain('Alagón')
  })

  it('el Tiétar está marcado como añadido fuera de los apuntes, y es el único', () => {
    const fuera = catalogo('rios').filter((rio) => rio.fueraDeApuntes)

    expect(fuera.map((rio) => rio.id)).toEqual(['tietar'])
  })

  it('los ríos se tocan como líneas y no llevan relieve de fondo', () => {
    expect(contornos('rios')).toHaveLength(41)
    expect(contornos('rios').every((contorno) => contorno.geometry.type === 'LineString')).toBe(true)
    expect(contextoDe('rios')?.tenues).toEqual([])
    expect(contextoDe('rios')?.rios).toEqual([])
    expect(contextoDe('rios')?.contorno.geometry.type).toBe('MultiPolygon')
  })
})

describe('Pista de área de los ríos', () => {
  const rios = catalogo('rios')
  const areaDe = (id: string) => rios.find((rio) => rio.id === id)!.pistaDeArea!

  it('la de un afluente ilumina su cuenca entera, con el río principal incluido', () => {
    expect(areaDe('tormes').sort()).toEqual(['adaja', 'duero', 'esla', 'pisuerga', 'tormes'])
  })

  it('la de un río principal ilumina su cuenca, no los ríos de su vertiente', () => {
    expect(areaDe('mino').sort()).toEqual(['mino', 'sil'])
    expect(areaDe('ebro')).toHaveLength(9)
    expect(areaDe('ebro')).not.toContain('jucar')
  })

  it('un afluente de afluente ilumina la cuenca de su río principal', () => {
    expect(areaDe('zancara').sort()).toEqual(['ciguela', 'guadiana', 'jabalon', 'zancara', 'zujar'])
  })

  it('un río propio, que no recoge afluentes, ilumina los de su vertiente', () => {
    expect(areaDe('nalon').sort()).toEqual(['bidasoa', 'nalon', 'nervion'])
  })
})
