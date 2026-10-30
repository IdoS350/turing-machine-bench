import { afterEach, describe, expect, it, vi } from 'vitest'
import { EXAMPLES } from '@/machine/examples'
import { compile } from '@/machine/parser'
import { MachineSession } from '@/session/MachineSession'

afterEach(() => vi.unstubAllGlobals())

describe('MachineSession', () => {
  it('clears the active machine and publishes an empty snapshot', () => {
    vi.stubGlobal('cancelAnimationFrame', () => {})
    const result = compile(EXAMPLES[0])
    if (!result.ok) throw new Error('default example should compile')

    const session = new MachineSession(result.def, '1011', 4)
    session.next()

    session.clear()

    expect(session.getSnapshot()).toEqual({
      machine: null,
      playing: false,
      notice: '',
      motion: null,
    })
  })
})
