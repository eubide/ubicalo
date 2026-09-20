import { describe, expect, it } from 'vitest'
import { catalogo, type Alcance, type Elemento } from '../catalogo/catalogo'
import { almacenEnMemoria } from '../competicion/competicion'
import type { Azar } from '../partida/partida'
import type { Familia } from '../prueba/prueba'
import { crearDominio, type Resultado } from './dominio'
import { componerTanda, type CatalogoDeExamen, type Tanda } from './tanda'

const AYER = '2026-09-19'
const HOY = '2026-09-20'

const ACIERTO: Resultado = { caso: 'acierto' }
const FALLO: Resultado = { caso: 'fallo', tipo: 'otro', confundidoCon: null }

function examenDe(...alcances: Alcance[]): CatalogoDeExamen[] {
  return alcances.map((alcance) => ({ alcance, elementos: catalogo(alcance) }))
}

const EXAMENES: Record<Familia, CatalogoDeExamen[]> = {
  politico: examenDe('comunidades', 'provincias'),
  relieve: examenDe('todo-relieve'),
  hidrografia: examenDe('todo-rios'),
  costas: examenDe('todo-costas'),
}

const rios = EXAMENES.hidrografia
const idsDeRios = rios[0].elementos.map((elemento) => elemento.id)

// mulberry32: con la misma semilla, el mismo alumno sintético da siempre los mismos números.
function azarCon(semilla: number): Azar {
  let estado = semilla
  return () => {
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function alumno() {
  let dia = HOY
  const dominio = crearDominio(almacenEnMemoria(), () => dia)
  return {
    dominio,
    elDia(otro: string) {
      dia = otro
    },
    anota(alcance: Alcance, ids: string[], resultado: Resultado) {
      for (const id of ids) dominio.anotar(alcance, id, resultado)
    },
    tanda(examen: CatalogoDeExamen[], azar: Azar = azarCon(1)): Tanda | null {
      return componerTanda(examen, (alcance) => dominio.entradas(alcance), dia, azar)
    },
  }
}

function idsDe(tanda: Tanda | null): string[] {
  return (tanda?.elementos ?? []).map((elemento) => elemento.id)
}

describe('Tamaño y prioridad de la Tanda', () => {
  it.each(Object.keys(EXAMENES) as Familia[])('la primera Tanda de %s trae 6 Elementos, todos nuevos', (familia) => {
    const tanda = alumno().tanda(EXAMENES[familia])

    expect(tanda?.elementos).toHaveLength(6)
    expect([...tanda!.nuevos].sort()).toEqual(idsDe(tanda).sort())
  })

  it('con Flojos de sobra trae 12: los 9 más fallados y 3 nuevos', () => {
    const quien = alumno()
    const flojos = idsDeRios.slice(0, 15)
    quien.anota('todo-rios', flojos, FALLO)
    quien.anota('todo-rios', flojos.slice(6), FALLO)

    const tanda = quien.tanda(rios)

    expect(tanda?.elementos).toHaveLength(12)
    expect(tanda?.nuevos).toHaveLength(3)
    expect(idsDe(tanda).filter((id) => !tanda!.nuevos.includes(id)).sort()).toEqual(flojos.slice(6).sort())
  })

  it('un Sabido visto ayer sale antes que un nuevo: con 8 de ayer entran los 8 y quedan 4 huecos para nuevos', () => {
    const quien = alumno()
    quien.elDia(AYER)
    quien.anota('todo-rios', idsDeRios.slice(0, 8), ACIERTO)
    quien.elDia(HOY)

    const tanda = quien.tanda(rios)

    expect(tanda?.elementos).toHaveLength(12)
    expect(tanda?.nuevos).toHaveLength(4)
    expect(idsDe(tanda)).toEqual(expect.arrayContaining(idsDeRios.slice(0, 8)))
  })

  it('entre los Sabidos que no se han visto hoy, el visto hace más tiempo va primero aunque vaya detrás en el catálogo', () => {
    const quien = alumno()
    quien.elDia(AYER)
    quien.anota('todo-rios', idsDeRios.slice(0, 10), ACIERTO)
    quien.elDia('2026-09-18')
    quien.anota('todo-rios', idsDeRios.slice(10, 15), ACIERTO)
    quien.elDia(HOY)

    const repasados = idsDe(quien.tanda(rios)).filter((id) => idsDeRios.slice(0, 15).includes(id))

    expect(repasados).toHaveLength(9)
    expect(repasados).toEqual(expect.arrayContaining(idsDeRios.slice(10, 15)))
  })

  it('los Flojos van antes que los Sabidos de ayer', () => {
    const quien = alumno()
    quien.elDia(AYER)
    quien.anota('todo-rios', idsDeRios.slice(0, 12), ACIERTO)
    quien.anota('todo-rios', idsDeRios.slice(12, 18), FALLO)
    quien.elDia(HOY)

    expect(idsDe(quien.tanda(rios))).toEqual(expect.arrayContaining(idsDeRios.slice(12, 18)))
  })

  it('un Sabido visto hoy solo sale para rellenar lo que dejan los Flojos y los nuevos de una Tanda que trae nuevos', () => {
    const quien = alumno()
    quien.anota('todo-rios', idsDeRios.slice(0, 3), FALLO)
    quien.anota('todo-rios', idsDeRios.slice(3, 20), ACIERTO)

    const tanda = quien.tanda(rios)

    expect(tanda?.elementos).toHaveLength(12)
    expect(tanda?.nuevos).toHaveLength(6)
    expect(idsDe(tanda)).toEqual(expect.arrayContaining(idsDeRios.slice(0, 3)))
    expect(idsDe(tanda).filter((id) => idsDeRios.slice(3, 20).includes(id))).toHaveLength(3)
  })

  it('sin nuevos que traer no se rellena: la Tanda son solo los Flojos, aunque sea corta', () => {
    const quien = alumno()
    quien.anota('todo-rios', idsDeRios, ACIERTO)
    quien.anota('todo-rios', idsDeRios.slice(0, 2), FALLO)

    const tanda = quien.tanda(rios)

    expect(idsDe(tanda).sort()).toEqual(idsDeRios.slice(0, 2).sort())
    expect(tanda?.nuevos).toEqual([])
  })

  it('cuando quedan menos de 3 sin ver, entran los que quedan', () => {
    const quien = alumno()
    quien.anota('todo-rios', idsDeRios.slice(0, 42), FALLO)

    expect(quien.tanda(rios)?.nuevos).toHaveLength(2)
  })

  it('con toda la Familia Sabida y vista hoy no hay Tanda, y al día siguiente vuelve a haberla', () => {
    const quien = alumno()
    quien.anota('todo-rios', idsDeRios, ACIERTO)

    expect(quien.tanda(rios)).toBeNull()

    quien.elDia('2026-09-21')
    expect(quien.tanda(rios)?.elementos).toHaveLength(12)
    expect(quien.tanda(rios)?.nuevos).toEqual([])
  })
})

describe('Barajado dentro de la Tanda', () => {
  it('el orden depende del azar inyectado, no del catálogo; los Elementos son los mismos', () => {
    const quien = alumno()

    const una = idsDe(quien.tanda(rios, azarCon(1)))
    const otra = idsDe(quien.tanda(rios, azarCon(2)))

    expect(una).not.toEqual(otra)
    expect([...una].sort()).toEqual([...otra].sort())
    expect(una).not.toEqual(idsDeRios.filter((id) => una.includes(id)))
  })
})

// Un alumno que lo acierta todo: deja ver en qué orden entran los nuevos de una Tanda a la siguiente.
function ordenDeLlegada(examen: CatalogoDeExamen[]): { alcance: Alcance; elemento: Elemento }[] {
  const quien = alumno()
  const llegada: { alcance: Alcance; elemento: Elemento }[] = []
  for (let tanda = quien.tanda(examen); tanda !== null; tanda = quien.tanda(examen)) {
    const { alcance, elementos, nuevos } = tanda
    llegada.push(...nuevos.map((id) => ({ alcance, elemento: elementos.find((elemento) => elemento.id === id)! })))
    quien.anota(alcance, elementos.map((elemento) => elemento.id), ACIERTO)
  }
  return llegada
}

function sonSeguidos(posiciones: number[]): boolean {
  const enOrden = [...posiciones].sort((a, b) => a - b)
  return enOrden.every((posicion, i) => i === 0 || posicion === enOrden[i - 1] + 1)
}

describe('Orden de los nuevos entre Tandas', () => {
  it('los Afluentes de un Río principal entran seguidos, y ninguno antes que su Río principal', () => {
    const entrada = ordenDeLlegada(rios).map(({ elemento }) => elemento)
    const posicion = (id: string) => entrada.findIndex((elemento) => elemento.id === id)
    const principales = entrada.filter((elemento) => elemento.clase === 'rio-principal')

    expect(principales).toHaveLength(6)
    for (const rio of principales) {
      const afluentes = entrada.filter((elemento) => elemento.cuenca === rio.id).map((afluente) => posicion(afluente.id))
      expect(sonSeguidos(afluentes)).toBe(true)
      expect(Math.min(...afluentes)).toBeGreaterThan(posicion(rio.id))
    }
  })

  it('las Vertientes entran antes que cualquier río, los Tramos de costa antes que cualquier Cabo o Golfo y las Cordilleras antes que cualquier Sierra', () => {
    const primeros = (familia: Familia, cuantos: number) =>
      ordenDeLlegada(EXAMENES[familia])
        .slice(0, cuantos)
        .map(({ elemento }) => elemento.clase)

    expect(new Set(primeros('hidrografia', 3))).toEqual(new Set(['vertiente']))
    expect(new Set(primeros('costas', 5))).toEqual(new Set(['tramo-de-costa']))
    expect(new Set(primeros('relieve', 11))).toEqual(new Set(['cordillera']))
  })

  it.each(['relieve', 'hidrografia', 'costas'] as Familia[])(
    'en %s entran todos, una sola vez, y ninguno antes que los Elementos de los que cuelga',
    (familia) => {
      const entrada = ordenDeLlegada(EXAMENES[familia]).map(({ elemento }) => elemento)
      const posicion = (id: string) => entrada.findIndex((elemento) => elemento.id === id)

      expect(entrada.map((elemento) => elemento.id).sort()).toEqual(EXAMENES[familia][0].elementos.map((elemento) => elemento.id).sort())
      for (const elemento of entrada) {
        for (const padre of elemento.desbloqueaCon ?? []) expect(posicion(padre)).toBeLessThan(posicion(elemento.id))
      }
    },
  )

  it('ninguna Provincia entra antes de haberse visto todas las Comunidades, y las de una comunidad entran juntas', () => {
    const entrada = ordenDeLlegada(EXAMENES.politico)
    const primeraProvincia = entrada.findIndex(({ alcance }) => alcance === 'provincias')
    const provincias = entrada.slice(primeraProvincia).map(({ elemento }) => elemento)

    expect(primeraProvincia).toBe(19)
    expect(entrada.slice(primeraProvincia).every(({ alcance }) => alcance === 'provincias')).toBe(true)
    expect(provincias).toHaveLength(52)
    for (const comunidad of new Set(provincias.map((provincia) => provincia.comunidad))) {
      const posiciones = provincias.flatMap((provincia, i) => (provincia.comunidad === comunidad ? [i] : []))
      expect(sonSeguidos(posiciones)).toBe(true)
    }
  })
})

describe('Político', () => {
  it('ninguna Tanda mezcla Comunidades y Provincias, aunque haya Flojos en las dos; a igualdad van las Comunidades', () => {
    const quien = alumno()
    const comunidades = EXAMENES.politico[0].elementos
    const provincias = EXAMENES.politico[1].elementos
    quien.anota('comunidades', comunidades.map((comunidad) => comunidad.id), ACIERTO)
    quien.anota('comunidades', ['01', '02', '03'], FALLO)
    quien.anota('provincias', ['02', '03', '04'], FALLO)

    const tanda = quien.tanda(EXAMENES.politico)

    expect(tanda?.alcance).toBe('comunidades')
    expect(tanda?.elementos.every((elemento) => comunidades.includes(elemento))).toBe(true)
    expect(tanda?.elementos.some((elemento) => provincias.includes(elemento))).toBe(false)
    expect(tanda?.nuevos).toEqual([])
  })

  it('vistas todas las Comunidades, la Tanda es del mapa con más por repasar', () => {
    const quien = alumno()
    quien.elDia(AYER)
    quien.anota('comunidades', EXAMENES.politico[0].elementos.map((comunidad) => comunidad.id), ACIERTO)
    quien.anota('provincias', EXAMENES.politico[1].elementos.slice(0, 30).map((provincia) => provincia.id), ACIERTO)
    quien.elDia(HOY)

    const tanda = quien.tanda(EXAMENES.politico)

    expect(tanda?.alcance).toBe('provincias')
    expect(tanda?.elementos).toHaveLength(12)
  })

  it('mientras quede una Comunidad sin ver no entra ninguna Provincia nueva, aunque las Provincias tengan más por repasar', () => {
    const quien = alumno()
    quien.anota('comunidades', ['01', '02'], FALLO)
    quien.anota('provincias', ['02', '03', '04', '05'], FALLO)

    const tanda = quien.tanda(EXAMENES.politico)

    expect(tanda?.alcance).toBe('provincias')
    expect(tanda?.nuevos).toEqual([])
    expect(idsDe(tanda).sort()).toEqual(['02', '03', '04', '05'])
  })

  it('con las Comunidades Sabidas y vistas hoy, la Tanda es de Provincias', () => {
    const quien = alumno()
    quien.anota('comunidades', EXAMENES.politico[0].elementos.map((comunidad) => comunidad.id), ACIERTO)

    const tanda = quien.tanda(EXAMENES.politico)

    expect(tanda?.alcance).toBe('provincias')
    expect(tanda?.nuevos).toHaveLength(6)
  })
})

const TANDAS_DE_SOBRA = 100
const SEMILLAS = [1, 2, 3, 4, 5]

// Juega Tandas encadenadas el mismo día. Lo nuevo se presenta y cada Elemento de la Tanda se pregunta una
// vez; acertar depende solo de la tasa del alumno, que no aprende: es el peor caso, no un alumno real.
function estudiar(familia: Familia, tasaDeAcierto: number, semilla: number) {
  const quien = alumno()
  const azar = azarCon(semilla)
  const examen = EXAMENES[familia]
  const total = examen.reduce((suma, { elementos }) => suma + elementos.length, 0)
  const entradas = () => examen.flatMap(({ alcance }) => Object.values(quien.dominio.entradas(alcance)))
  let tandas = 0
  let hastaVerlaEntera = Infinity
  for (let tanda = quien.tanda(examen, azar); tanda !== null && tandas < TANDAS_DE_SOBRA; tanda = quien.tanda(examen, azar)) {
    tandas++
    quien.anota(tanda.alcance, tanda.nuevos, { caso: 'presentacion' })
    for (const elemento of tanda.elementos) {
      quien.anota(tanda.alcance, [elemento.id], azar() < tasaDeAcierto ? ACIERTO : FALLO)
    }
    if (entradas().length === total) hastaVerlaEntera = Math.min(hastaVerlaEntera, tandas)
  }
  const sinFlojos = entradas().length === total && entradas().every((entrada) => entrada.estado === 'sabido')
  return { hastaVerlaEntera, hastaNoTenerFlojos: sinFlojos ? tandas : Infinity }
}

describe('Alumnos sintéticos', () => {
  const casos = (Object.keys(EXAMENES) as Familia[]).flatMap((familia) =>
    [50, 70, 90].map((porcentaje): [number, Familia] => [porcentaje, familia]),
  )

  it.each(casos)(
    'el que acierta el %i %% en %s la ve entera en 25 Tandas como mucho y se queda sin Flojos en 30',
    (porcentaje, familia) => {
      for (const semilla of SEMILLAS) {
        const { hastaVerlaEntera, hastaNoTenerFlojos } = estudiar(familia, porcentaje / 100, semilla)

        expect(hastaVerlaEntera).toBeLessThanOrEqual(25)
        expect(hastaNoTenerFlojos).toBeLessThanOrEqual(30)
      }
    },
  )
})
