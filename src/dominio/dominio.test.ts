import { describe, expect, it } from 'vitest'
import { almacenEnMemoria, type Almacen } from '../competicion/competicion'
import { crearDominio, diaLocal } from './dominio'

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
