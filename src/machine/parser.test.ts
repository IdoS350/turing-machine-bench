import { describe, expect, it } from 'vitest'
import { compile, draftDef, parseProgram } from './parser'

const source = (program: string, start = 'q0') => ({ start, accept: '', reject: '', program })

describe('parseProgram', () => {
  it('ignores comments and blank lines, and accepts arrow/comma notation', () => {
    const { rules, errors } = parseProgram(`; header comment

q0 1 0 R q1 ; trailing comment
q1, 0 -> 1, l, q0
q1 _ → _ S done`)

    expect(errors).toEqual([])
    expect(
      rules.map(({ state, read, write, dir, next, line }) => [state, read, write, dir, next, line]),
    ).toEqual([
      ['q0', '1', '0', 1, 'q1', 3],
      ['q1', '0', '1', -1, 'q0', 4],
      ['q1', '_', '_', 0, 'done', 5],
    ])
  })

  it('reports each problem with its line number', () => {
    const { rules, errors } = parseProgram(`q0 1 0 R q1
q0 1 1 L q2
q0 ab 1 R q0
q0 0 0 X q0
* 0 0 R q0
q0 0`)

    expect(rules).toHaveLength(1)
    expect(errors).toEqual([
      { line: 2, message: 'duplicate rule for (q0, 1), first defined on line 1' },
      { line: 3, message: 'read symbol "ab" must be a single character' },
      { line: 4, message: 'move "X" must be L, R or S' },
      { line: 5, message: '"*" cannot be a state name' },
      { line: 6, message: 'expected 5 fields (state read write move next), got 2' },
    ])
  })
})

describe('compile', () => {
  it('requires a start state', () => {
    expect(compile(source('q0 1 1 R q0', ' '))).toEqual({
      ok: false,
      errors: [{ line: 0, message: 'start state is required' }],
    })
  })

  it('orders table columns as symbols, then blank, then wildcard', () => {
    const result = compile(source('q0 * * R q0\nq0 _ b L q1\nq1 a a R q1'))
    if (!result.ok) throw new Error('expected program to compile')

    expect(result.def.columns).toEqual(['a', 'b', '_', '*'])
    expect(result.def.states).toEqual(['q0', 'q1'])
  })
})

describe('draftDef', () => {
  it('keeps the rules that parse even when other lines have errors', () => {
    const def = draftDef(source('q0 1 1 R q1\nbroken line\nq1 1 0 X q0', ''))

    expect(def.rules.map((r) => r.line)).toEqual([1])
    expect(def.states).toEqual(['q0', 'q1'])
  })
})
