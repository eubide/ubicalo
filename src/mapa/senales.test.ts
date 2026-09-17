import { describe, expect, it } from 'vitest'
import { abierta, senalDe, type EstadoDelMapa } from './senales'

const vacio: EstadoDelMapa = {
  tocado: null,
  tentativa: null,
  diana: [],
  pistaDeArea: [],
  fallados: [],
  acertados: [],
  parcial: [],
  frontera: [],
}

function estado(cambios: Partial<EstadoDelMapa>): EstadoDelMapa {
  return { ...vacio, ...cambios }
}

describe('senalDe', () => {
  it('no señala un elemento del que no se sabe nada', () => {
    expect(senalDe('a', vacio)).toBeNull()
  })

  it('señala cada estado con su nombre', () => {
    expect(senalDe('a', estado({ frontera: ['a'] }))).toBe('frontera')
    expect(senalDe('a', estado({ parcial: ['a'] }))).toBe('parcial')
    expect(senalDe('a', estado({ acertados: ['a'] }))).toBe('acierto')
    expect(senalDe('a', estado({ fallados: ['a'] }))).toBe('fallo')
    expect(senalDe('a', estado({ pistaDeArea: ['a'] }))).toBe('ayuda')
    expect(senalDe('a', estado({ diana: ['a'] }))).toBe('diana')
    expect(senalDe('a', estado({ tentativa: 'a' }))).toBe('tentativa')
    expect(senalDe('a', estado({ tocado: 'a' }))).toBe('tocado')
  })

  it('lo que pasa ahora gana al historial', () => {
    const acertadoYPreguntado = estado({ acertados: ['a'], diana: ['a'] })
    expect(senalDe('a', acertadoYPreguntado)).toBe('diana')

    const falladoYEnTurno = estado({ fallados: ['a'], tentativa: 'a' })
    expect(senalDe('a', falladoYEnTurno)).toBe('tentativa')

    const enTurnoYTocadoMal = estado({ tentativa: 'a', tocado: 'a' })
    expect(senalDe('a', enTurnoYTocadoMal)).toBe('tocado')
  })

  it('un fallo pesa más que un acierto anterior del mismo elemento', () => {
    expect(senalDe('a', estado({ acertados: ['a'], fallados: ['a'] }))).toBe('fallo')
  })

  it('la ayuda tapa el historial pero no lo que se pregunta', () => {
    expect(senalDe('a', estado({ acertados: ['a'], pistaDeArea: ['a'] }))).toBe('ayuda')
    expect(senalDe('a', estado({ pistaDeArea: ['a'], diana: ['a'] }))).toBe('diana')
  })
})

describe('abierta', () => {
  it('solo sigue en juego lo que todavía se puede responder', () => {
    expect(abierta('frontera')).toBe(true)
    expect(abierta('parcial')).toBe(true)
    expect(abierta('acierto')).toBe(false)
    expect(abierta('diana')).toBe(false)
    expect(abierta(null)).toBe(false)
  })
})
