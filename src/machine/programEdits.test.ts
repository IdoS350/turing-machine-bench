import { describe, expect, it } from 'vitest'
import { deleteRule, setRule, stateError, symbolError } from '@/machine/programEdits'

const program = `; increment
right 0 0 R right ; keep going
right 1 1 R right

carry 1 0 L carry`

describe('setRule', () => {
  it('rewrites an existing rule in place, keeping its trailing comment', () => {
    expect(setRule(program, 'right', '0', { write: '1', move: 'L', next: 'carry' }))
      .toBe(`; increment
right 0 1 L carry ; keep going
right 1 1 R right

carry 1 0 L carry`)
  })

  it("inserts a new rule after the state's last rule", () => {
    expect(setRule(program, 'right', '_', { write: '_', move: 'L', next: 'carry' }))
      .toBe(`; increment
right 0 0 R right ; keep going
right 1 1 R right
right _ _ L carry

carry 1 0 L carry`)
  })

  it('appends rules for a state that has none yet', () => {
    expect(setRule('q0 1 1 R q0\n', 'q1', '1', { write: '0', move: 'S', next: '*' })).toBe(
      'q0 1 1 R q0\nq1 1 0 S *',
    )
    expect(setRule('', 'q0', '_', { write: '1', move: 'R', next: 'q0' })).toBe('q0 _ 1 R q0')
  })
})

describe('deleteRule', () => {
  it('removes only the matching line', () => {
    expect(deleteRule(program, 'right', '1')).toBe(`; increment
right 0 0 R right ; keep going

carry 1 0 L carry`)
    expect(deleteRule(program, 'carry', '_')).toBe(program)
  })
})

describe('validation', () => {
  it('rejects names the parser would split or strip', () => {
    expect(symbolError('a')).toBeNull()
    expect(symbolError('ab')).not.toBeNull()
    expect(symbolError(';')).not.toBeNull()
    expect(stateError('q_1')).toBeNull()
    expect(stateError('q 1')).not.toBeNull()
    expect(stateError('a->b')).not.toBeNull()
    expect(stateError('*')).not.toBeNull()
  })
})
