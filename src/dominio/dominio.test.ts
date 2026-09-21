import { describe, expect, it } from 'vitest'
import { almacenEnMemoria, type Almacen } from '../competicion/competicion'
import { crearDominio, diaLocal, familiaDeEnlace } from './dominio'

const hoy = () => '2026-09-20'

describe('Estados del Dominio', () => {
  it('un Elemento que nunca se ha respondido ni presentado está sin ver: no tiene entrada', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    expect(dominio.entradas('todo-rios')).toEqual({})
  })

  it('un acierto sin ayuda deja el Elemento en Sabido', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('todo-rios', 'ebro', { caso: 'acierto' })

    expect(dominio.entradas('todo-rios')).toEqual({
      ebro: { estado: 'sabido', visto: '2026-09-20', fallos: 0, tipoDeFallo: null, confundidoCon: null },
    })
  })

  it('un Fallo lo deja en Flojo y guarda su tipo y el id que respondió el alumno', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('todo-rios', 'turia', { caso: 'fallo', tipo: 'otro', confundidoCon: 'jucar' })

    expect(dominio.entradas('todo-rios')).toEqual({
      turia: { estado: 'flojo', visto: '2026-09-20', fallos: 1, tipoDeFallo: 'otro', confundidoCon: 'jucar' },
    })
  })

  it.each([{ caso: 'acierto-con-pista' }, { caso: 'presentacion' }] as const)(
    'un resultado de $caso lo deja en Flojo sin contar un fallo',
    (resultado) => {
      const dominio = crearDominio(almacenEnMemoria(), hoy)

      dominio.anotar('todo-rios', 'ebro', resultado)

      expect(dominio.entradas('todo-rios').ebro).toEqual({
        estado: 'flojo',
        visto: '2026-09-20',
        fallos: 0,
        tipoDeFallo: null,
        confundidoCon: null,
      })
    },
  )

  it('manda la última respuesta: un Sabido que se falla vuelve a Flojo y un Flojo que se acierta sin ayuda pasa a Sabido', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('todo-rios', 'jucar', { caso: 'acierto' })
    dominio.anotar('todo-rios', 'jucar', { caso: 'fallo', tipo: 'tilde', confundidoCon: null })
    expect(dominio.entradas('todo-rios').jucar.estado).toBe('flojo')

    dominio.anotar('todo-rios', 'jucar', { caso: 'acierto-con-pista' })
    expect(dominio.entradas('todo-rios').jucar.estado).toBe('flojo')

    dominio.anotar('todo-rios', 'jucar', { caso: 'acierto' })
    expect(dominio.entradas('todo-rios').jucar.estado).toBe('sabido')
  })

  it('los fallos se acumulan, y el tipo y la confusión son los del último Fallo aunque después se acierte', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('todo-rios', 'turia', { caso: 'fallo', tipo: 'otro', confundidoCon: 'jucar' })
    dominio.anotar('todo-rios', 'turia', { caso: 'fallo', tipo: 'tilde', confundidoCon: null })
    dominio.anotar('todo-rios', 'turia', { caso: 'acierto' })

    expect(dominio.entradas('todo-rios').turia).toEqual({
      estado: 'sabido',
      visto: '2026-09-20',
      fallos: 2,
      tipoDeFallo: 'tilde',
      confundidoCon: null,
    })
  })

  it('visto es el día de la última vez, sea respuesta o presentación', () => {
    let dia = '2026-09-19'
    const dominio = crearDominio(almacenEnMemoria(), () => dia)

    dominio.anotar('todo-rios', 'ebro', { caso: 'acierto' })
    dominio.anotar('todo-rios', 'duero', { caso: 'presentacion' })
    dia = '2026-09-20'
    dominio.anotar('todo-rios', 'ebro', { caso: 'acierto' })

    expect(dominio.entradas('todo-rios').ebro.visto).toBe('2026-09-20')
    expect(dominio.entradas('todo-rios').duero.visto).toBe('2026-09-19')
  })

  it('la comunidad 02 y la provincia 02 son dos entradas distintas', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('comunidades', '02', { caso: 'acierto' })
    dominio.anotar('provincias', '02', { caso: 'fallo', tipo: 'errata', confundidoCon: null })

    expect(dominio.entradas('comunidades')['02'].estado).toBe('sabido')
    expect(dominio.entradas('provincias')['02'].estado).toBe('flojo')
    expect(Object.keys(dominio.entradas('comunidades'))).toEqual(['02'])
    expect(Object.keys(dominio.entradas('provincias'))).toEqual(['02'])
  })
})

describe('Familia elegida', () => {
  it('no hay ninguna hasta que el alumno la elige, y elegir otra la sustituye', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)
    expect(dominio.familia()).toBeNull()

    dominio.elegirFamilia('hidrografia')
    expect(dominio.familia()).toBe('hidrografia')

    dominio.elegirFamilia('costas')
    expect(dominio.familia()).toBe('costas')
  })

  it('cambiar de Familia no borra lo anotado, ni anotar cambia la Familia', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.elegirFamilia('hidrografia')
    dominio.anotar('todo-rios', 'ebro', { caso: 'acierto' })
    dominio.elegirFamilia('costas')

    expect(dominio.familia()).toBe('costas')
    expect(dominio.entradas('todo-rios').ebro.estado).toBe('sabido')
  })
})

describe('Enlace con Familia', () => {
  it('una Familia propuesta queda elegida si el alumno no tenía ninguna, y si ya tenía una no la cambia', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.proponerFamilia('hidrografia')
    expect(dominio.familia()).toBe('hidrografia')

    dominio.proponerFamilia('costas')
    expect(dominio.familia()).toBe('hidrografia')
  })

  it('lee la Familia del parámetro familia del enlace', () => {
    expect(familiaDeEnlace('http://localhost:5173/?familia=hidrografia')).toBe('hidrografia')
    expect(familiaDeEnlace('http://localhost:5173/ubicalo/?idioma=es&familia=politico#mapa')).toBe('politico')
  })

  it.each([
    ['sin el parámetro', 'http://localhost:5173/'],
    ['con una Familia que no existe', 'http://localhost:5173/?familia=rios'],
    ['con el parámetro vacío', 'http://localhost:5173/?familia='],
    ['que no es una URL', 'familia de ríos'],
  ])('un enlace %s no trae Familia', (_caso, enlace) => {
    expect(familiaDeEnlace(enlace)).toBeNull()
  })
})

describe('Resumen de una Familia', () => {
  it('sin nada anotado está entera sin ver: los 44 de Hidrografía, y en Político las 19 Comunidades más las 52 Provincias', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    expect(dominio.resumen('hidrografia')).toEqual({ sabidos: 0, flojos: 0, sinVer: 44, total: 44 })
    expect(dominio.resumen('politico')).toEqual({ sabidos: 0, flojos: 0, sinVer: 71, total: 71 })
    expect(dominio.resumen('relieve').total).toBe(44)
    expect(dominio.resumen('costas').total).toBe(25)
  })

  it('cuenta los Sabidos y los Flojos de esa Familia, y no los de otra', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('todo-rios', 'ebro', { caso: 'acierto' })
    dominio.anotar('todo-rios', 'duero', { caso: 'acierto' })
    dominio.anotar('todo-rios', 'turia', { caso: 'fallo', tipo: 'otro', confundidoCon: 'jucar' })
    dominio.anotar('todo-costas', 'cabo-de-gata', { caso: 'acierto' })

    expect(dominio.resumen('hidrografia')).toEqual({ sabidos: 2, flojos: 1, sinVer: 41, total: 44 })
    expect(dominio.resumen('costas')).toEqual({ sabidos: 1, flojos: 0, sinVer: 24, total: 25 })
  })

  it('en Político suma Comunidades y Provincias aunque compartan ids', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    dominio.anotar('comunidades', '02', { caso: 'acierto' })
    dominio.anotar('provincias', '02', { caso: 'presentacion' })

    expect(dominio.resumen('politico')).toEqual({ sabidos: 1, flojos: 1, sinVer: 69, total: 71 })
  })
})

describe('Almacén del Dominio', () => {
  function almacenConDatos(inicial: string): Almacen {
    let guardado: string | null = null
    return {
      getItem: () => guardado ?? inicial,
      setItem: (_clave, valor) => {
        guardado = valor
      },
    }
  }

  const entrada = { estado: 'sabido', visto: '2026-09-19', fallos: 0, tipoDeFallo: null, confundidoCon: null }

  it('la Familia y los Elementos se guardan en el mismo registro, con su versión, bajo ubicalo:dominio', () => {
    const almacen = almacenEnMemoria()
    const dominio = crearDominio(almacen, hoy)

    dominio.elegirFamilia('politico')
    dominio.anotar('provincias', '02', { caso: 'acierto' })

    expect(JSON.parse(almacen.getItem('ubicalo:dominio')!)).toEqual({
      version: 1,
      familia: 'politico',
      elementos: {
        'provincias/02': { estado: 'sabido', visto: '2026-09-20', fallos: 0, tipoDeFallo: null, confundidoCon: null },
      },
    })
  })

  it('otro Dominio sobre el mismo almacén ve la Familia y los Elementos guardados', () => {
    const almacen = almacenEnMemoria()
    const primero = crearDominio(almacen, hoy)
    primero.elegirFamilia('relieve')
    primero.anotar('todo-relieve', 'pirineos', { caso: 'acierto' })

    const dominio = crearDominio(almacen, hoy)

    expect(dominio.familia()).toBe('relieve')
    expect(dominio.entradas('todo-relieve').pirineos.estado).toBe('sabido')
  })

  it.each(['{no es json', '"texto"', 'null', '[]', '{}', '42'])(
    'con datos corruptos (%s) empieza sin Familia ni entradas y vuelve a guardar',
    (corrupto) => {
      const dominio = crearDominio(almacenConDatos(corrupto), hoy)

      expect(dominio.familia()).toBeNull()
      expect(dominio.entradas('provincias')).toEqual({})

      dominio.anotar('provincias', '02', { caso: 'acierto' })
      expect(dominio.entradas('provincias')['02'].estado).toBe('sabido')
    },
  )

  it('una versión que no reconoce se descarta entera, en silencio', () => {
    const guardado = JSON.stringify({ version: 2, familia: 'costas', elementos: { 'provincias/02': entrada } })
    const dominio = crearDominio(almacenConDatos(guardado), hoy)

    expect(dominio.familia()).toBeNull()
    expect(dominio.entradas('provincias')).toEqual({})
  })

  it('un id que ya no está en el catálogo, o un Alcance que ya no existe, se descartan y lo demás se conserva', () => {
    const guardado = JSON.stringify({
      version: 1,
      familia: 'politico',
      elementos: {
        'provincias/02': entrada,
        'provincias/99': entrada,
        'todo-rios/02': entrada,
        'lo-que-sea/02': entrada,
        '02': entrada,
      },
    })
    const dominio = crearDominio(almacenConDatos(guardado), hoy)

    expect(dominio.familia()).toBe('politico')
    expect(dominio.entradas('provincias')).toEqual({ '02': entrada })
    expect(dominio.entradas('todo-rios')).toEqual({})
  })

  it('anotar un id que no está en el catálogo no guarda nada', () => {
    const almacen = almacenEnMemoria()

    crearDominio(almacen, hoy).anotar('provincias', '99', { caso: 'acierto' })

    expect(almacen.getItem('ubicalo:dominio')).toBeNull()
  })

  it('de una entrada guardada solo se leen sus cinco datos', () => {
    const guardado = JSON.stringify({ version: 1, familia: null, elementos: { 'provincias/02': { ...entrada, caja: 3 } } })

    expect(crearDominio(almacenConDatos(guardado), hoy).entradas('provincias')).toEqual({ '02': entrada })
  })

  it('una confusión con un id que ya no está en el catálogo se olvida sin perder la entrada', () => {
    const fallado = { ...entrada, estado: 'flojo', fallos: 1, tipoDeFallo: 'otro', confundidoCon: 'rio-que-ya-no-esta' }
    const guardado = JSON.stringify({ version: 1, familia: null, elementos: { 'todo-rios/turia': fallado } })

    expect(crearDominio(almacenConDatos(guardado), hoy).entradas('todo-rios').turia).toEqual({
      ...fallado,
      confundidoCon: null,
    })
  })

  it.each([
    ['un estado desconocido', { ...entrada, estado: 'dominado' }],
    ['un día que no es un día', { ...entrada, visto: 'ayer' }],
    ['unos fallos negativos', { ...entrada, fallos: -1 }],
    ['un tipo de Fallo desconocido', { ...entrada, tipoDeFallo: 'ortografia' }],
    ['algo que no es una entrada', 'sabido'],
  ])('descarta una entrada guardada con %s', (_caso, rota) => {
    const guardado = JSON.stringify({
      version: 1,
      familia: 'lo-que-sea',
      elementos: { 'provincias/02': rota, 'provincias/03': entrada },
    })
    const dominio = crearDominio(almacenConDatos(guardado), hoy)

    expect(dominio.familia()).toBeNull()
    expect(dominio.entradas('provincias')).toEqual({ '03': entrada })
  })

  it('si el almacén falla al leer y al escribir, anotar y elegir Familia no rompen', () => {
    const dominio = crearDominio(
      {
        getItem: () => {
          throw new Error('no disponible')
        },
        setItem: () => {
          throw new Error('no disponible')
        },
      },
      hoy,
    )

    expect(() => dominio.anotar('provincias', '02', { caso: 'acierto' })).not.toThrow()
    expect(() => dominio.elegirFamilia('politico')).not.toThrow()
    expect(dominio.familia()).toBeNull()
    expect(dominio.entradas('provincias')).toEqual({})
  })
})

describe('Día local', () => {
  it('es el día del calendario del alumno, no el de UTC', () => {
    expect(diaLocal(new Date(2026, 8, 5, 0, 30))).toBe('2026-09-05')
    expect(diaLocal(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05')
    expect(diaLocal(new Date(2026, 11, 31, 12))).toBe('2026-12-31')
  })
})

describe('Lo guardado de Costas sobrevive al reparto en Cabos y Golfos', () => {
  const entrada = (estado: string) => ({ estado, visto: '2026-09-19', fallos: 0, tipoDeFallo: null, confundidoCon: null })

  const conLoViejo = (elementos: Record<string, unknown>): Almacen => {
    const almacen = almacenEnMemoria()
    almacen.setItem('ubicalo:dominio', JSON.stringify({ version: 1, familia: 'costas', elementos }))
    return almacen
  }

  it('lo que sabía de un Cabo se lee ahora bajo el Alcance Cabos', () => {
    const dominio = crearDominio(
      conLoViejo({ 'cabos-y-golfos/cabo-de-gata': entrada('sabido'), 'cabos-y-golfos/cabo-de-creus': entrada('flojo') }),
      hoy,
    )

    expect(dominio.entradas('cabos')).toEqual({
      'cabo-de-gata': entrada('sabido'),
      'cabo-de-creus': entrada('flojo'),
    })
    expect(dominio.entradas('golfos')).toEqual({})
  })

  it('lo que sabía de un Golfo o del Estrecho se lee bajo el Alcance Golfos', () => {
    const dominio = crearDominio(
      conLoViejo({
        'cabos-y-golfos/golfo-de-almeria': entrada('sabido'),
        'cabos-y-golfos/estrecho-de-gibraltar': entrada('flojo'),
      }),
      hoy,
    )

    expect(dominio.entradas('golfos')).toEqual({
      'golfo-de-almeria': entrada('sabido'),
      'estrecho-de-gibraltar': entrada('flojo'),
    })
  })

  it('lo guardado de Pertenencia y de los Tramos se descarta, porque ya no existen', () => {
    const dominio = crearDominio(
      conLoViejo({
        'pertenencia-costas/cabo-de-gata': entrada('sabido'),
        'todo-costas/costa-gallega': entrada('sabido'),
        'todo-costas/cabo-ortegal': entrada('sabido'),
      }),
      hoy,
    )

    expect(dominio.entradas('todo-costas')).toEqual({ 'cabo-ortegal': entrada('sabido') })
    expect(dominio.resumen('costas').sabidos).toBe(1)
  })

  it('un alumno sin nada guardado no nota el reparto', () => {
    const dominio = crearDominio(almacenEnMemoria(), hoy)

    expect(dominio.entradas('cabos')).toEqual({})
    expect(dominio.resumen('costas')).toEqual({ sabidos: 0, flojos: 0, sinVer: 25, total: 25 })
  })

  it('traducir lo guardado no depende de cuántas veces se lea ni de volver a escribirlo', () => {
    const almacen = conLoViejo({ 'cabos-y-golfos/cabo-de-gata': entrada('sabido') })
    const dominio = crearDominio(almacen, hoy)

    dominio.anotar('golfos', 'golfo-de-rosas', { caso: 'acierto' })
    const despues = crearDominio(almacen, hoy)

    expect(despues.entradas('cabos')).toEqual({ 'cabo-de-gata': entrada('sabido') })
    expect(despues.entradas('golfos')['golfo-de-rosas'].estado).toBe('sabido')
  })
})
