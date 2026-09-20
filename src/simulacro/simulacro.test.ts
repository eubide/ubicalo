import { describe, expect, it } from 'vitest'
import type { Elemento } from '../catalogo/catalogo'
import { almacenEnMemoria, type Almacen } from '../competicion/competicion'
import {
  anotacionesDelSimulacro,
  blancosDe,
  corregir,
  crearSimulacros,
  DURACION_DEL_SIMULACRO,
  entregar,
  esLoPrincipal,
  etiquetaDeSimulacro,
  escribir,
  iniciarSimulacro,
  notaDe,
  ponerAlDia,
  sobreDiez,
  tiempoRestante,
} from './simulacro'

function elemento(id: string, nombre: string, alias: string[] = []): Elemento {
  return { id, nombre, nombreMostrado: nombre, alias, vecinos: [] }
}

const cadiz = elemento('cadiz', 'Golfo de Cádiz', ['Cádiz'])
const turia = elemento('turia', 'Turia')
const jucar = elemento('jucar', 'Júcar')
const guadalquivir = elemento('guadalquivir', 'Guadalquivir')
const elementos = [cadiz, turia, jucar, guadalquivir]

const INICIO = 1_000_000
const VEINTE_MINUTOS = 20 * 60 * 1000

function conReloj() {
  return iniciarSimulacro('hidrografia', 'todo-rios', INICIO, DURACION_DEL_SIMULACRO)
}

function sinReloj() {
  return iniciarSimulacro('hidrografia', 'todo-rios', INICIO, null)
}

describe('Escribir en el Simulacro', () => {
  it('el Rótulo queda como lo escribió el alumno, sin juzgar nada hasta entregar', () => {
    const simulacro = escribir(sinReloj(), 'cadiz', '  Cadiz ', INICIO + 5_000)

    expect(simulacro.respuestas).toEqual({ cadiz: 'Cadiz' })
    expect(corregir(simulacro, elementos)).toBeNull()
  })

  it('un Rótulo ya escrito se puede cambiar, y escribirlo vacío lo borra', () => {
    let simulacro = escribir(sinReloj(), 'turia', 'Jucar', INICIO)
    simulacro = escribir(simulacro, 'turia', 'Turia', INICIO)
    expect(simulacro.respuestas).toEqual({ turia: 'Turia' })

    expect(escribir(simulacro, 'turia', '   ', INICIO).respuestas).toEqual({})
  })

  it('los blancos son los Elementos sin nada escrito', () => {
    const simulacro = escribir(escribir(sinReloj(), 'turia', 'Turia', INICIO), 'jucar', 'x', INICIO)

    expect(blancosDe(simulacro, elementos)).toEqual([cadiz, guadalquivir])
  })
})

describe('Cuenta atrás', () => {
  it('la primera vez no hay límite: no hay tiempo restante y nunca se entrega solo', () => {
    const simulacro = sinReloj()

    expect(tiempoRestante(simulacro, INICIO + 3 * VEINTE_MINUTOS)).toBeNull()
    expect(ponerAlDia(simulacro, INICIO + 3 * VEINTE_MINUTOS).entregadoEn).toBeNull()
  })

  it('con reloj son 20 minutos para el mapa entero, nunca por pregunta', () => {
    const simulacro = escribir(conReloj(), 'turia', 'Turia', INICIO + 60_000)

    expect(DURACION_DEL_SIMULACRO).toBe(VEINTE_MINUTOS)
    expect(tiempoRestante(simulacro, INICIO)).toBe(VEINTE_MINUTOS)
    expect(tiempoRestante(simulacro, INICIO + 90_000)).toBe(VEINTE_MINUTOS - 90_000)
    expect(tiempoRestante(simulacro, INICIO + VEINTE_MINUTOS + 5_000)).toBe(0)
  })

  it('a cero se entrega solo, con la hora del límite y no la de cuando se mira', () => {
    const simulacro = ponerAlDia(conReloj(), INICIO + VEINTE_MINUTOS + 90_000)

    expect(simulacro.entregadoEn).toBe(INICIO + VEINTE_MINUTOS)
  })

  it('lo que se escribe con el tiempo agotado no entra', () => {
    const simulacro = escribir(conReloj(), 'turia', 'Turia', INICIO + VEINTE_MINUTOS + 1)

    expect(simulacro.respuestas).toEqual({})
    expect(simulacro.entregadoEn).toBe(INICIO + VEINTE_MINUTOS)
  })

  it('se puede entregar antes, y una vez entregado ni se escribe ni se vuelve a entregar', () => {
    const entregado = entregar(escribir(conReloj(), 'turia', 'Turia', INICIO), INICIO + 60_000)

    expect(entregado.entregadoEn).toBe(INICIO + 60_000)
    expect(escribir(entregado, 'jucar', 'Júcar', INICIO + 61_000)).toBe(entregado)
    expect(entregar(entregado, INICIO + 99_000)).toBe(entregado)
  })
})

describe('El mapa corregido', () => {
  function entregado(respuestas: Record<string, string>) {
    const escrito = Object.entries(respuestas).reduce(
      (simulacro, [id, texto]) => escribir(simulacro, id, texto, INICIO),
      sinReloj(),
    )
    return entregar(escrito, INICIO + 1)
  }

  it('distingue acierto, Fallo y blanco, con lo escrito junto a cada Elemento', () => {
    const correcciones = corregir(entregado({ turia: 'Turia', jucar: 'Segura' }), elementos)

    expect(correcciones).toEqual([
      { elemento: cadiz, escrito: null, resultado: 'blanco' },
      { elemento: turia, escrito: 'Turia', resultado: 'acierto' },
      { elemento: jucar, escrito: 'Segura', resultado: 'fallo', fallo: { tipo: 'otro', confundidoCon: null } },
      { elemento: guadalquivir, escrito: null, resultado: 'blanco' },
    ])
  })

  it('juzga con Juicio estricto: "Cadiz" es Fallo por la tilde, "Guadalquibir" por la errata, y los Alias siguen valiendo', () => {
    const correcciones = corregir(entregado({ cadiz: 'Cadiz', guadalquivir: 'Guadalquibir', jucar: 'Júcar' }), elementos)!
    const de = (id: string) => correcciones.find((correccion) => correccion.elemento.id === id)

    expect(de('cadiz')).toMatchObject({ resultado: 'fallo', fallo: { tipo: 'tilde' } })
    expect(de('guadalquivir')).toMatchObject({ resultado: 'fallo', fallo: { tipo: 'errata' } })
    expect(de('jucar')?.resultado).toBe('acierto')
    expect(corregir(entregado({ cadiz: 'Cádiz' }), elementos)![0].resultado).toBe('acierto')
  })

  it('escribir el nombre de otro Elemento dice con cuál se confundió', () => {
    const correcciones = corregir(entregado({ turia: 'Júcar' }), elementos)!

    expect(correcciones[1]).toMatchObject({ resultado: 'fallo', fallo: { tipo: 'otro', confundidoCon: 'jucar' } })
  })

  it('la nota es lineal, aciertos entre total por 10 con un decimal, porque un fallo no resta', () => {
    const nota = notaDe(corregir(entregado({ turia: 'Turia', jucar: 'Segura' }), elementos)!)

    expect(nota).toEqual({ aciertos: 1, total: 4 })
    expect(sobreDiez(nota)).toBe('2,5')
    expect(sobreDiez({ aciertos: 28, total: 44 })).toBe('6,4')
    expect(sobreDiez({ aciertos: 22, total: 44 })).toBe('5,0')
    expect(sobreDiez({ aciertos: 43, total: 44 })).toBe('9,8')
    expect(sobreDiez({ aciertos: 44, total: 44 })).toBe('10,0')
    expect(sobreDiez({ aciertos: 0, total: 44 })).toBe('0,0')
  })

  it('al Dominio pasan el acierto como acierto, el Fallo con su tipo y el blanco como presentado', () => {
    const correcciones = corregir(entregado({ turia: 'Turia', cadiz: 'Cadiz' }), [cadiz, turia, jucar])!

    expect(anotacionesDelSimulacro(correcciones)).toEqual([
      { id: 'cadiz', resultado: { caso: 'fallo', tipo: 'tilde', confundidoCon: null } },
      { id: 'turia', resultado: { caso: 'acierto' } },
      { id: 'jucar', resultado: { caso: 'presentacion' } },
    ])
  })
})

describe('Simulacro guardado', () => {
  function almacenConDatos(inicial: string): Almacen {
    let guardado: string | null = null
    return {
      getItem: () => guardado ?? inicial,
      setItem: (_clave, valor) => {
        guardado = valor
      },
    }
  }

  it('lo escrito y la hora de inicio se guardan, y al volver el reloj ha seguido corriendo', () => {
    const almacen = almacenEnMemoria()
    const simulacro = escribir(conReloj(), 'turia', 'Turia', INICIO + 60_000)
    crearSimulacros(almacen).guardar(simulacro)

    const reanudado = crearSimulacros(almacen).enCurso()

    expect(reanudado).toEqual(simulacro)
    expect(tiempoRestante(reanudado!, INICIO + 5 * 60_000)).toBe(VEINTE_MINUTOS - 5 * 60_000)
  })

  it('sin nada guardado no hay Simulacro en curso ni notas', () => {
    const simulacros = crearSimulacros(almacenEnMemoria())

    expect(simulacros.enCurso()).toBeNull()
    expect(simulacros.notas('hidrografia')).toBeNull()
  })

  it('cerrarlo guarda la última nota y la mejor de esa Familia, y deja de estar en curso', () => {
    const almacen = almacenEnMemoria()
    const simulacros = crearSimulacros(almacen)
    simulacros.guardar(conReloj())

    simulacros.cerrar('hidrografia', { aciertos: 28, total: 44 }, true)
    expect(simulacros.enCurso()).toBeNull()
    expect(simulacros.notas('hidrografia')).toEqual({
      ultima: { aciertos: 28, total: 44 },
      mejor: { aciertos: 28, total: 44 },
      ultimaConReloj: true,
    })

    simulacros.cerrar('hidrografia', { aciertos: 20, total: 44 }, true)
    expect(crearSimulacros(almacen).notas('hidrografia')).toEqual({
      ultima: { aciertos: 20, total: 44 },
      mejor: { aciertos: 28, total: 44 },
      ultimaConReloj: true,
    })
    expect(simulacros.notas('costas')).toBeNull()
  })

  it('la primera vez, sin reloj, guarda su resultado pero dice que no fue con reloj, para no enseñarlo como nota', () => {
    const simulacros = crearSimulacros(almacenEnMemoria())

    simulacros.cerrar('costas', { aciertos: 3, total: 25 }, false)

    expect(simulacros.notas('costas')?.ultimaConReloj).toBe(false)
  })

  it('salir sin entregar lo descarta sin tocar las notas', () => {
    const simulacros = crearSimulacros(almacenEnMemoria())
    simulacros.cerrar('hidrografia', { aciertos: 28, total: 44 }, true)
    simulacros.guardar(conReloj())

    simulacros.descartar()

    expect(simulacros.enCurso()).toBeNull()
    expect(simulacros.notas('hidrografia')?.ultima).toEqual({ aciertos: 28, total: 44 })
  })

  it.each(['{no es json', '"texto"', 'null', '[]', '42', '{"version":2,"enCurso":null,"notas":{}}'])(
    'con datos que no reconoce (%s) empieza de cero y vuelve a guardar',
    (corrupto) => {
      const simulacros = crearSimulacros(almacenConDatos(corrupto))

      expect(simulacros.enCurso()).toBeNull()
      expect(simulacros.notas('hidrografia')).toBeNull()

      simulacros.guardar(sinReloj())
      expect(simulacros.enCurso()).toEqual(sinReloj())
    },
  )

  it('descarta un Simulacro en curso mal formado y las respuestas de ids que ya no están en el catálogo', () => {
    const bueno = { familia: 'hidrografia', alcance: 'todo-rios', inicio: INICIO, limite: null, entregadoEn: null }
    const con = (enCurso: unknown) =>
      crearSimulacros(almacenConDatos(JSON.stringify({ version: 1, enCurso, notas: {} }))).enCurso()

    expect(con({ ...bueno, respuestas: { turia: 'Turia', 'rio-que-ya-no-esta': 'x', jucar: 7 } })?.respuestas).toEqual({ turia: 'Turia' })
    expect(con({ ...bueno, respuestas: {}, alcance: 'lo-que-sea' })).toBeNull()
    expect(con({ ...bueno, respuestas: {}, familia: 'rios' })).toBeNull()
    expect(con({ ...bueno, respuestas: {}, familia: 'costas' })).toBeNull()
    expect(con({ ...bueno, respuestas: {}, inicio: 'ayer' })).toBeNull()
    expect(con({ ...bueno, respuestas: {}, limite: -5 })).toBeNull()
  })

  it('si el almacén falla, guardar y cerrar no rompen', () => {
    const simulacros = crearSimulacros({
      getItem: () => {
        throw new Error('no disponible')
      },
      setItem: () => {
        throw new Error('no disponible')
      },
    })

    expect(() => simulacros.guardar(sinReloj())).not.toThrow()
    expect(() => simulacros.cerrar('hidrografia', { aciertos: 1, total: 4 }, true)).not.toThrow()
    expect(simulacros.enCurso()).toBeNull()
  })
})

describe('Cuándo el Simulacro pasa a ser la acción principal', () => {
  const conTrabajo = { sabidos: 10, flojos: 5, sinVer: 29, total: 44 }

  it('tras cuatro Tandas seguidas', () => {
    expect(esLoPrincipal(3, conTrabajo)).toBe(false)
    expect(esLoPrincipal(4, conTrabajo)).toBe(true)
  })

  it('cuando no queda nada sin ver ni Flojo, aunque no se haya hecho ninguna Tanda', () => {
    expect(esLoPrincipal(0, { sabidos: 44, flojos: 0, sinVer: 0, total: 44 })).toBe(true)
    expect(esLoPrincipal(0, { sabidos: 43, flojos: 1, sinVer: 0, total: 44 })).toBe(false)
  })
})

describe('Cómo se llama el Simulacro', () => {
  it('la primera vez pregunta qué te sabes ya, y después promete los 20 minutos', () => {
    expect(etiquetaDeSimulacro(true)).toBe('¿Qué te sabes ya?')
    expect(etiquetaDeSimulacro(false)).toBe('Simulacro · 20 min')
  })
})
