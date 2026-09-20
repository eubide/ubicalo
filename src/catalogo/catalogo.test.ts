import { describe, expect, it } from 'vitest'
import { geoPath } from 'd3-geo'
import { geoConicConformalSpain } from 'd3-composite-projections'
import { catalogo, catalogoDelMapa, contextoDe, contornos, siluetaDeEspana, type Alcance } from './catalogo'
import { esIdDeAltura } from './relieve'

function nombresDelCatalogo(alcance: Alcance) {
  return catalogo(alcance).map(({ vecinos: _v, comunidad: _c, cordillera: _cord, clase: _cl, altura: _a, ...nombres }) => nombres)
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
    expect(elementos.filter((elemento) => elemento.alias.length > 0)).toHaveLength(10)
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
    expect(elementos.filter((elemento) => elemento.alias.length > 0)).toHaveLength(12)
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

    expect(porId('26')).toEqual({ id: '26', nombre: 'La Rioja', nombreMostrado: 'La Rioja', alias: [] })
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
    const ciudadesAutonomas = (alcance: Alcance) =>
      catalogo(alcance)
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
    const picos = catalogoDelMapa('picos')
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

    expect(elementos).toContainEqual({ id: 'torre-cerredo', nombre: 'Torre Cerredo', nombreMostrado: 'Torre Cerredo', alias: [] })
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

describe('Catálogo de Pertenencia', () => {
  it('pregunta sierras y picos hacia su cordillera, y cordilleras hacia su pico', () => {
    const elementos = catalogo('pertenencia-relieve')
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
    const elementos = catalogo('pertenencia-relieve')
    const mapa = catalogoDelMapa('pertenencia-relieve')
    const porId = (lista: typeof elementos, id: string) => lista.find((elemento) => elemento.id === id)!

    expect(porId(elementos, 'sierra-de-gredos').vecinos).toEqual(porId(mapa, 'sistema-central').vecinos)
    expect(porId(elementos, 'pirineos').vecinos).toEqual(porId(mapa, 'aneto').vecinos)
  })

  it('el mapa de Pertenencia son las 11 cordilleras y los 11 picos', () => {
    const mapa = catalogoDelMapa('pertenencia-relieve')

    expect(mapa).toHaveLength(22)
    expect(mapa.map((elemento) => elemento.clase)).toEqual([...Array(11).fill('cordillera'), ...Array(11).fill('pico')])
    expect(contornos('pertenencia-relieve').map((contorno) => contorno.id)).toEqual(mapa.map((elemento) => elemento.id))
    expect(catalogoDelMapa('picos')).toHaveLength(11)
  })
})

describe('Catálogo de picos', () => {
  it('son los once picos y las cuatro alturas, que no se tocan en el mapa', () => {
    const elementos = catalogo('picos')

    expect(elementos).toHaveLength(15)
    expect(elementos.filter((elemento) => esIdDeAltura(elemento.id)).map((elemento) => elemento.pregunta)).toEqual([
      'Altura del Moncayo',
      'Altura del Aneto',
      'Altura del Teide',
      'Altura del Mulhacén',
    ])
    expect(catalogoDelMapa('picos').some((elemento) => esIdDeAltura(elemento.id))).toBe(false)
  })

  it('una altura se acepta con o sin punto de millar y rotula su pico en el Repaso', () => {
    expect(catalogo('picos').find((elemento) => elemento.id === 'altura-aneto')).toEqual({
      id: 'altura-aneto',
      nombre: '3404',
      nombreMostrado: '3.404 m',
      alias: ['3.404', '3404 m', '3.404 m'],
      vecinos: ['altura-moncayo', 'altura-teide', 'altura-mulhacen'],
      clase: 'pico',
      cordillera: 'pirineos',
      pregunta: 'Altura del Aneto',
      rotulo: 'Aneto · 3.404 m',
      seEscribe: true,
    })
  })
})

describe('Contexto geográfico del relieve', () => {
  it('provincias y comunidades no llevan contexto de relieve', () => {
    expect(contextoDe('provincias')).toBeNull()
    expect(contextoDe('comunidades')).toBeNull()
  })

  it('el relieve lleva el contorno de España y los ríos; los picos además las cordilleras en tenue', () => {
    expect(contextoDe('cordilleras-y-sierras')?.contorno.geometry.type).toBe('MultiPolygon')
    expect(contextoDe('cordilleras-y-sierras')?.rios.length).toBeGreaterThan(20)
    expect(contextoDe('cordilleras-y-sierras')?.tenues).toEqual([])
    expect(contextoDe('pertenencia-relieve')?.tenues).toEqual([])
    expect(contextoDe('picos')?.tenues).toHaveLength(11)
  })
})

describe('Catálogo de Todo en Relieve', () => {
  it('entrega las 44 piezas del relieve: cordilleras, sierras, picos y las cuatro alturas', () => {
    const elementos = catalogo('todo-relieve')

    expect(elementos).toHaveLength(44)
    expect(elementos.filter((elemento) => elemento.clase === 'cordillera')).toHaveLength(11)
    expect(elementos.filter((elemento) => elemento.clase === 'sierra')).toHaveLength(18)
    expect(elementos.filter((elemento) => elemento.clase === 'pico')).toHaveLength(15)
  })

  it('las 11 cordilleras están desbloqueadas desde el principio', () => {
    const cordilleras = catalogo('todo-relieve').filter((elemento) => elemento.clase === 'cordillera')

    expect(cordilleras).toHaveLength(11)
    expect(cordilleras.every((elemento) => elemento.desbloqueaCon?.length === 0)).toBe(true)
  })

  it('una sierra se desbloquea al acertar su cordillera', () => {
    const elementos = catalogo('todo-relieve')
    const gredos = elementos.find((elemento) => elemento.id === 'sierra-de-gredos')!

    expect(gredos.desbloqueaCon).toEqual(['sistema-central'])
  })

  it('un pico se desbloquea al acertar su cordillera y todas sus sierras', () => {
    const elementos = catalogo('todo-relieve')
    const almanzor = elementos.find((elemento) => elemento.id === 'almanzor')!

    expect(almanzor.desbloqueaCon).toHaveLength(5)
    expect(almanzor.desbloqueaCon).toContain('sistema-central')
    expect(almanzor.desbloqueaCon).toEqual(
      expect.arrayContaining(['sierra-de-gata', 'sierra-de-gredos', 'sierra-de-guadarrama', 'sierra-de-bejar']),
    )
  })

  it('el pico de una cordillera sin sierras se desbloquea solo con la cordillera', () => {
    const aizkorri = catalogo('todo-relieve').find((elemento) => elemento.id === 'aizkorri')!

    expect(aizkorri.desbloqueaCon).toEqual(['montes-vascos'])
  })

  it('las cuatro alturas se desbloquean con su pico, y su id no coincide con el del pico', () => {
    const alturas = catalogo('todo-relieve').filter((elemento) => elemento.id.startsWith('altura-'))

    expect(alturas).toHaveLength(4)
    const anetoAltura = alturas.find((elemento) => elemento.id === 'altura-aneto')!
    expect(anetoAltura.desbloqueaCon).toEqual(['aneto'])
    expect(anetoAltura.id).not.toBe('aneto')
    expect(anetoAltura.nombreMostrado).toBe('3.404 m')
  })

  it('el mapa de Todo son las 40 piezas con geometría propia, sin las alturas', () => {
    const mapa = catalogoDelMapa('todo-relieve')

    expect(mapa).toHaveLength(40)
    expect(mapa.every((elemento) => elemento.id.startsWith('altura-') === false)).toBe(true)
    expect(contornos('todo-relieve')).toHaveLength(40)
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

  it('cada río conoce su vertiente, y un afluente hereda la de su cuenca', () => {
    const rios = catalogo('rios')
    const vertienteDe = (id: string) => rios.find((rio) => rio.id === id)?.vertiente

    expect(vertienteDe('ebro')).toBe('vertiente-mediterranea')
    expect(vertienteDe('mino')).toBe('vertiente-atlantica')
    expect(vertienteDe('nervion')).toBe('vertiente-cantabrica')
    expect(vertienteDe('segre')).toBe('vertiente-mediterranea')
    expect(vertienteDe('jiloca')).toBe('vertiente-mediterranea')
    expect(vertienteDe('sil')).toBe('vertiente-atlantica')
    expect(rios.every((rio) => rio.vertiente !== undefined)).toBe(true)
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

describe('Catálogo de jerarquía de ríos', () => {
  it('pregunta los 24 afluentes hacia su río principal, y ningún río propio', () => {
    const elementos = catalogo('pertenencia-rios')
    const porNombre = (nombre: string) => elementos.find((elemento) => elemento.nombre === nombre)!

    expect(elementos).toHaveLength(24)
    expect(porNombre('Segre')).toMatchObject({ respuesta: 'ebro', pregunta: 'Toca su río principal' })
    expect(porNombre('Sil').respuesta).toBe('mino')
    expect(elementos.some((elemento) => elemento.id === 'jucar')).toBe(false)
    expect(elementos.some((elemento) => elemento.id === 'ebro')).toBe(false)
  })

  it('el Jiloca se responde con el Ebro y el Záncara con el Guadiana, aunque desemboquen en un afluente', () => {
    const elementos = catalogo('pertenencia-rios')
    const respuestaDe = (id: string) => elementos.find((elemento) => elemento.id === id)!.respuesta

    expect(respuestaDe('jiloca')).toBe('ebro')
    expect(respuestaDe('zancara')).toBe('guadiana')
    expect(respuestaDe('cinca')).toBe('ebro')
  })

  it('los vecinos son los del río que hay que tocar, para que la Pista de área ilumine lo tocable', () => {
    const elementos = catalogo('pertenencia-rios')
    const mapa = catalogoDelMapa('pertenencia-rios')
    const porId = (lista: typeof elementos, id: string) => lista.find((elemento) => elemento.id === id)!

    expect(porId(elementos, 'segre').vecinos).toEqual(porId(mapa, 'ebro').vecinos)
    expect(porId(elementos, 'sil').vecinos).toEqual(porId(mapa, 'mino').vecinos)
    expect(porId(elementos, 'segre').pistaDeArea).toBeUndefined()
  })

  it('el mapa de la jerarquía de ríos son los 41 ríos', () => {
    const mapa = catalogoDelMapa('pertenencia-rios')

    expect(mapa).toHaveLength(41)
    expect(contornos('pertenencia-rios').map((contorno) => contorno.id)).toEqual(mapa.map((elemento) => elemento.id))
    expect(contextoDe('pertenencia-rios')?.tenues).toEqual([])
  })
})

describe('Catálogo de Todo en Hidrografía', () => {
  it('entrega las 44 piezas: 3 vertientes, 17 ríos del nivel superior y 24 afluentes', () => {
    const elementos = catalogo('todo-rios')
    const deClase = (clase: string) => elementos.filter((elemento) => elemento.clase === clase)

    expect(elementos).toHaveLength(44)
    expect(deClase('vertiente')).toHaveLength(3)
    expect(deClase('rio-principal')).toHaveLength(6)
    expect(deClase('rio-propio')).toHaveLength(11)
    expect(deClase('afluente')).toHaveLength(24)
  })

  it('solo las tres vertientes están desbloqueadas desde el principio', () => {
    const elementos = catalogo('todo-rios')
    const sinDependencias = elementos.filter((elemento) => elemento.desbloqueaCon?.length === 0)

    expect(sinDependencias.map((elemento) => elemento.id)).toEqual([
      'vertiente-cantabrica',
      'vertiente-atlantica',
      'vertiente-mediterranea',
    ])
    expect(elementos.every((elemento) => elemento.desbloqueaCon !== undefined)).toBe(true)
  })

  it('un río del nivel superior se desbloquea al acertar su vertiente', () => {
    const elementos = catalogo('todo-rios')
    const porId = (id: string) => elementos.find((elemento) => elemento.id === id)!

    expect(porId('ebro').desbloqueaCon).toEqual(['vertiente-mediterranea'])
    expect(porId('nalon').desbloqueaCon).toEqual(['vertiente-cantabrica'])
    expect(porId('mino').desbloqueaCon).toEqual(['vertiente-atlantica'])
  })

  it('un afluente se desbloquea al acertar el río principal de su cuenca, aunque desemboque en otro afluente', () => {
    const elementos = catalogo('todo-rios')
    const porId = (id: string) => elementos.find((elemento) => elemento.id === id)!

    expect(porId('segre').desbloqueaCon).toEqual(['ebro'])
    expect(porId('jiloca').desbloqueaCon).toEqual(['ebro'])
    expect(porId('zancara').desbloqueaCon).toEqual(['guadiana'])
    expect(porId('sil').desbloqueaCon).toEqual(['mino'])
  })

  it('las vertientes se tocan como manchas y los ríos como líneas', () => {
    const formas = contornos('todo-rios')

    expect(formas).toHaveLength(44)
    expect(formas.slice(0, 3).every((forma) => forma.geometry.type !== 'LineString')).toBe(true)
    expect(formas.slice(3).every((forma) => forma.geometry.type === 'LineString')).toBe(true)
    expect(catalogoDelMapa('todo-rios').map((elemento) => elemento.id)).toEqual(
      formas.map((forma) => String(forma.id)),
    )
  })

  it('los vecinos de una vertiente son las otras dos', () => {
    const cantabrica = catalogo('todo-rios').find((elemento) => elemento.id === 'vertiente-cantabrica')!

    expect(cantabrica.vecinos.sort()).toEqual(['vertiente-atlantica', 'vertiente-mediterranea'])
  })
})

describe('Catálogo de grandes unidades', () => {
  const porId = new Map(catalogo('unidades').map((elemento) => [elemento.id, elemento]))

  it('suma a las once cordilleras la Meseta y las dos depresiones', () => {
    expect(porId.size).toBe(14)
    expect([...porId.keys()]).toEqual(
      expect.arrayContaining(['meseta', 'depresion-del-ebro', 'depresion-del-guadalquivir']),
    )
  })

  it('da a cada unidad el papel que la capa del IGN le asigna respecto a la Meseta', () => {
    expect(porId.get('meseta')?.papel).toBe('meseta')
    expect(porId.get('sistema-central')?.papel).toBe('interior')
    expect(porId.get('sierra-morena')?.papel).toBe('reborde')
    expect(porId.get('depresion-del-ebro')?.papel).toBe('depresion')
    expect(porId.get('pirineos')?.papel).toBe('exterior')
    expect(porId.get('montanas-de-canarias')?.papel).toBe('volcanico')
  })

  it('abre la partida con la Meseta y cierra cada rama por la cordillera exterior', () => {
    expect(porId.get('meseta')?.desbloqueaCon).toEqual([])
    expect(porId.get('sistema-central')?.desbloqueaCon).toEqual(['meseta'])
    expect(porId.get('sistema-iberico')?.desbloqueaCon).toEqual(['meseta'])
    expect(porId.get('depresion-del-ebro')?.desbloqueaCon).toEqual(['sistema-iberico'])
    expect(porId.get('pirineos')?.desbloqueaCon).toEqual(['depresion-del-ebro'])
  })

  it('deja Canarias para el final, porque no se define respecto a la Meseta', () => {
    const peninsulares = [...porId.keys()].filter((id) => id !== 'montanas-de-canarias')

    expect(porId.get('montanas-de-canarias')?.desbloqueaCon).toEqual(peninsulares)
  })
})

describe('Catálogo de cabos y golfos', () => {
  const costas = catalogo('cabos-y-golfos')
  const elementoDe = (id: string) => costas.find((candidato) => candidato.id === id)!
  const deClase = (clase: string) => costas.filter((candidato) => candidato.clase === clase)

  it('entrega los 20 Elementos de la costa: 13 cabos, 6 golfos y el estrecho', () => {
    expect(costas).toHaveLength(20)
    expect(deClase('cabo')).toHaveLength(13)
    expect(deClase('golfo')).toHaveLength(6)
    expect(deClase('estrecho').map(({ nombre }) => nombre)).toEqual(['Estrecho de Gibraltar'])
  })

  it('reparte los 20 Elementos en los cinco tramos de costa', () => {
    const porTramo = (tramo: string) => costas.filter((candidato) => candidato.tramo === tramo).length

    expect([porTramo('costa-cantabrica'), porTramo('costa-gallega'), porTramo('costa-de-la-luz')]).toEqual([4, 3, 4])
    expect([porTramo('costa-levantina'), porTramo('costa-catalana')]).toEqual([6, 3])
    expect(costas.every(({ tramo }) => tramo !== undefined)).toBe(true)
  })

  it('las dos Puntas del listado conservan su nombre y se juegan como Cabos', () => {
    expect(elementoDe('punta-de-estaca-de-bares')).toMatchObject({
      nombre: 'Punta de Estaca de Bares',
      clase: 'cabo',
      tramo: 'costa-gallega',
    })
    expect(elementoDe('punta-de-tarifa').clase).toBe('cabo')
  })

  it('un Golfo que muere en el Tramo siguiente sigue perteneciendo al suyo', () => {
    expect(elementoDe('golfo-de-vizcaya').tramo).toBe('costa-cantabrica')
    expect(elementoDe('golfo-de-valencia').tramo).toBe('costa-levantina')
  })

  it('los Vecinos de un Elemento son sus hermanos de Tramo', () => {
    expect(elementoDe('cabo-de-ajo').vecinos.sort()).toEqual(['cabo-de-penas', 'cabo-machichaco', 'golfo-de-vizcaya'])
    expect(elementoDe('cabo-de-creus').vecinos.sort()).toEqual(['golfo-de-rosas', 'golfo-de-san-jorge'])
    expect(elementoDe('cabo-de-gata').vecinos).not.toContain('cabo-de-creus')
    expect(costas.every(({ vecinos }) => vecinos.length > 0)).toBe(true)
  })

  it('la Pista de área ilumina el Tramo del Elemento preguntado', () => {
    expect(elementoDe('cabo-de-creus').pistaDeArea!.sort()).toEqual([
      'cabo-de-creus',
      'golfo-de-rosas',
      'golfo-de-san-jorge',
    ])
    expect(elementoDe('golfo-de-cadiz').pistaDeArea).toHaveLength(4)
  })

  it('los Cabos son puntos y los Golfos líneas, sobre un mapa con los ríos en tenue y sin relieve', () => {
    const formas = contornos('cabos-y-golfos')

    expect(formas.filter(({ geometry }) => geometry.type === 'Point')).toHaveLength(13)
    expect(formas.filter(({ geometry }) => geometry.type === 'LineString')).toHaveLength(7)
    expect(catalogoDelMapa('cabos-y-golfos')).toHaveLength(20)
    expect(contextoDe('cabos-y-golfos')?.tenues).toEqual([])
    expect(contextoDe('cabos-y-golfos')?.rios).toHaveLength(41)
    expect(contextoDe('cabos-y-golfos')?.contorno.geometry.type).toBe('MultiPolygon')
  })
})

describe('Catálogo de Pertenencia en Costas', () => {
  const pertenencia = catalogo('pertenencia-costas')
  const elementoDe = (id: string) => pertenencia.find((candidato) => candidato.id === id)!

  it('pregunta los 20 Elementos hacia su Tramo de costa, y ningún Tramo hacia los suyos', () => {
    expect(pertenencia).toHaveLength(20)
    expect(pertenencia.every(({ pregunta }) => pregunta === 'Toca su tramo de costa')).toBe(true)
    expect(pertenencia.every(({ clase }) => clase !== 'tramo-de-costa')).toBe(true)
  })

  it('cada uno de los 20 se responde tocando el Tramo que dice el dato', () => {
    const suTramo = new Map(catalogo('cabos-y-golfos').map(({ id, tramo }) => [id, tramo]))
    const mal = pertenencia.filter(({ id, respuesta }) => respuesta !== suTramo.get(id))

    expect(mal.map(({ id }) => id)).toEqual([])
    expect(elementoDe('cabo-de-gata').respuesta).toBe('costa-levantina')
    expect(elementoDe('golfo-de-vizcaya').respuesta).toBe('costa-cantabrica')
    expect(elementoDe('estrecho-de-gibraltar').respuesta).toBe('costa-de-la-luz')
  })

  it('los Vecinos son los del Tramo que se toca, así que los Distractores son otros Tramos', () => {
    expect(elementoDe('cabo-de-creus').vecinos.sort()).toEqual([
      'costa-cantabrica',
      'costa-de-la-luz',
      'costa-gallega',
      'costa-levantina',
    ])
  })

  it('la Pista de área ilumina el Tramo correcto', () => {
    expect(elementoDe('cabo-de-palos').pistaDeArea).toEqual(['costa-levantina'])
    expect(elementoDe('golfo-de-valencia').pistaDeArea).toEqual(['costa-levantina'])
  })

  it('el mapa de Pertenencia son solo los 5 Tramos: no hay nada más que tocar', () => {
    const formas = contornos('pertenencia-costas')

    expect(formas).toHaveLength(5)
    expect(catalogoDelMapa('pertenencia-costas')).toHaveLength(5)
    expect(formas.every(({ geometry }) => geometry.type === 'MultiPolygon')).toBe(true)
  })

  it('los Vecinos de un Tramo son los otros cuatro', () => {
    const tramo = catalogoDelMapa('pertenencia-costas').find(({ id }) => id === 'costa-gallega')!

    expect(tramo.clase).toBe('tramo-de-costa')
    expect(tramo.vecinos).toHaveLength(4)
    expect(tramo.vecinos).not.toContain('costa-gallega')
  })
})

describe('Catálogo de Todo en Costas', () => {
  const todo = catalogo('todo-costas')
  const elementoDe = (id: string) => todo.find((candidato) => candidato.id === id)!

  it('entrega las 25 piezas: los 5 Tramos y los 20 Elementos de la costa', () => {
    const deClase = (clase: string) => todo.filter((pieza) => pieza.clase === clase)

    expect(todo).toHaveLength(25)
    expect(deClase('tramo-de-costa')).toHaveLength(5)
    expect(deClase('cabo')).toHaveLength(13)
    expect(deClase('golfo')).toHaveLength(6)
    expect(deClase('estrecho')).toHaveLength(1)
  })

  it('solo los cinco Tramos arrancan desbloqueados', () => {
    const sueltos = todo.filter(({ desbloqueaCon }) => desbloqueaCon!.length === 0).map(({ id }) => id)

    expect(sueltos.sort()).toEqual([
      'costa-cantabrica',
      'costa-catalana',
      'costa-de-la-luz',
      'costa-gallega',
      'costa-levantina',
    ])
  })

  it('cada Cabo, Golfo y el Estrecho se desbloquean al acertar su Tramo, y solo con él', () => {
    expect(elementoDe('cabo-de-gata').desbloqueaCon).toEqual(['costa-levantina'])
    expect(elementoDe('golfo-de-vizcaya').desbloqueaCon).toEqual(['costa-cantabrica'])
    expect(elementoDe('estrecho-de-gibraltar').desbloqueaCon).toEqual(['costa-de-la-luz'])
    expect(todo.every(({ desbloqueaCon }) => desbloqueaCon!.length <= 1)).toBe(true)
  })

  it('acertar un Tramo no desbloquea los Elementos de los demás', () => {
    const conLaCatalana = todo.filter(({ desbloqueaCon }) => desbloqueaCon!.includes('costa-catalana'))

    expect(conLaCatalana.map(({ id }) => id).sort()).toEqual(['cabo-de-creus', 'golfo-de-rosas', 'golfo-de-san-jorge'])
  })

  it('los Tramos y los Elementos de la costa se tocan como manchas, puntos y líneas', () => {
    const formas = contornos('todo-costas')

    expect(formas).toHaveLength(25)
    expect(formas.filter(({ geometry }) => geometry.type === 'MultiPolygon')).toHaveLength(5)
    expect(formas.filter(({ geometry }) => geometry.type === 'Point')).toHaveLength(13)
    expect(formas.filter(({ geometry }) => geometry.type === 'LineString')).toHaveLength(7)
  })
})

describe('Lo que basta escribir en las costas', () => {
  const costas = catalogo('cabos-y-golfos')
  const elementoDe = (id: string) => costas.find((candidato) => candidato.id === id)!

  it('acepta la grafía del Nomenclátor y la catalana como Alias', () => {
    expect(elementoDe('cabo-machichaco').alias).toEqual(['Matxitxako'])
    expect(elementoDe('cabo-de-finisterre').alias).toEqual(['Fisterra'])
  })

  it('a los Golfos, al Estrecho y a Estaca de Bares les sobra el sustantivo', () => {
    expect(elementoDe('golfo-de-vizcaya').alias).toEqual(['Vizcaya'])
    expect(elementoDe('golfo-de-cadiz').alias).toEqual(['Cádiz'])
    expect(elementoDe('golfo-de-almeria').alias).toEqual(['Almería'])
    expect(elementoDe('golfo-de-valencia').alias).toEqual(['Valencia'])
    expect(elementoDe('golfo-de-san-jorge').alias).toEqual(['Sant Jordi', 'San Jorge'])
    expect(elementoDe('golfo-de-rosas').alias).toEqual(['Roses', 'Rosas'])
    expect(elementoDe('estrecho-de-gibraltar').alias).toEqual(['Gibraltar'])
    expect(elementoDe('punta-de-estaca-de-bares').alias).toEqual(['Estaca de Bares'])
  })

  it('los demás Cabos se escriben enteros, como las Sierras del relieve', () => {
    const sinAlias = costas.filter(({ alias }) => alias.length === 0).map(({ id }) => id)

    expect(sinAlias.sort()).toEqual([
      'cabo-de-ajo',
      'cabo-de-creus',
      'cabo-de-gata',
      'cabo-de-la-nao',
      'cabo-de-palos',
      'cabo-de-penas',
      'cabo-de-san-antonio',
      'cabo-de-trafalgar',
      'cabo-ortegal',
      'punta-de-tarifa',
    ])
  })

  it('ningún Elemento acepta un Alias que no esté declarado', () => {
    const conAlias = Object.fromEntries(costas.filter(({ alias }) => alias.length > 0).map(({ id, alias }) => [id, alias]))

    expect(conAlias).toEqual({
      'cabo-machichaco': ['Matxitxako'],
      'cabo-de-finisterre': ['Fisterra'],
      'golfo-de-vizcaya': ['Vizcaya'],
      'golfo-de-cadiz': ['Cádiz'],
      'golfo-de-almeria': ['Almería'],
      'golfo-de-valencia': ['Valencia'],
      'golfo-de-san-jorge': ['Sant Jordi', 'San Jorge'],
      'golfo-de-rosas': ['Roses', 'Rosas'],
      'estrecho-de-gibraltar': ['Gibraltar'],
      'punta-de-estaca-de-bares': ['Estaca de Bares'],
    })
  })

  it('solo los tres pares que se pisan en el mapa llevan frase de desambiguación', () => {
    const conFrase = costas.filter(({ desambiguacion }) => desambiguacion).map(({ id }) => id)

    expect(conFrase.sort()).toEqual([
      'cabo-de-creus',
      'cabo-de-la-nao',
      'cabo-de-san-antonio',
      'estrecho-de-gibraltar',
      'golfo-de-rosas',
      'punta-de-tarifa',
    ])
    expect(elementoDe('cabo-de-la-nao').desambiguacion).toContain('Cabo de San Antonio')
  })
})

describe('Lo que basta escribir en el relieve y la hidrografía', () => {
  function elementoDe(alcance: Alcance, id: string) {
    return catalogo(alcance).find((elemento) => elemento.id === id)!
  }

  it('las tres vertientes se responden sin el genérico, que sigue en el nombre mostrado', () => {
    expect(elementoDe('todo-rios', 'vertiente-mediterranea')).toMatchObject({
      nombreMostrado: 'Vertiente Mediterránea',
      alias: ['Mediterránea'],
    })
    expect(elementoDe('todo-rios', 'vertiente-cantabrica').alias).toEqual(['Cantábrica'])
    expect(elementoDe('todo-rios', 'vertiente-atlantica').alias).toEqual(['Atlántica'])
  })

  it('las dos depresiones se responden con el río que las nombra', () => {
    expect(elementoDe('unidades', 'depresion-del-guadalquivir')).toMatchObject({
      nombreMostrado: 'Depresión del Guadalquivir',
      alias: ['Guadalquivir'],
    })
    expect(elementoDe('unidades', 'depresion-del-ebro').alias).toEqual(['Ebro'])
  })

  it('el Turó de l\'Home se responde con "Turó", donde la regla general no llega', () => {
    expect(elementoDe('picos', 'turo-de-l-home')).toMatchObject({
      nombreMostrado: "Turó de l'Home",
      alias: ['Turó'],
    })
  })
})

describe('Silueta de España', () => {
  it('es una sola mancha que se puede trazar', () => {
    const espana = siluetaDeEspana()

    expect(espana.geometry.type).toBe('MultiPolygon')
    expect(geoPath(geoConicConformalSpain().fitExtent([[0, 0], [52, 34]], espana))(espana)).toMatch(/^M/)
  })
})
