import { describe, expect, it } from 'vitest'
import { almacenEnMemoria, type Almacen } from '../competicion/competicion'
import { DURACION_DEL_SIMULACRO, escribir, iniciarSimulacro, tiempoRestante } from './simulacro'
import { crearSimulacros } from './simulacros-guardados'

const INICIO = 1_000_000
const VEINTE_MINUTOS = 20 * 60 * 1000

function conReloj() {
  return iniciarSimulacro('hidrografia', ['todo-rios'], INICIO, DURACION_DEL_SIMULACRO)
}

function sinReloj() {
  return iniciarSimulacro('hidrografia', ['todo-rios'], INICIO, null)
}

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
    const simulacro = escribir(conReloj(), 'todo-rios', 'turia', 'Turia', INICIO + 60_000)
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
    const bueno = { familia: 'hidrografia', alcances: ['todo-rios'], enVista: 'todo-rios', inicio: INICIO, limite: null, entregadoEn: null }
    const con = (enCurso: unknown) =>
      crearSimulacros(almacenConDatos(JSON.stringify({ version: 1, enCurso, notas: {} }))).enCurso()

    expect(con({ ...bueno, respuestas: { 'todo-rios': { turia: 'Turia', 'rio-que-ya-no-esta': 'x', jucar: 7 }, provincias: { '02': 'x' } } })?.respuestas).toEqual({
      'todo-rios': { turia: 'Turia' },
    })
    expect(con({ ...bueno, respuestas: {}, alcances: ['lo-que-sea'] })).toBeNull()
    expect(con({ ...bueno, respuestas: {}, enVista: 'provincias' })).toBeNull()
    expect(con({ familia: 'hidrografia', alcance: 'todo-rios', inicio: INICIO, limite: null, entregadoEn: null, respuestas: {} })).toBeNull()
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
