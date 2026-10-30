import { describe, expect, it } from 'vitest'
import { EXAMPLES } from '@/machine/examples'
import { createMachine, haltInfo, rewind, run, step } from '@/machine/machine'
import type { Machine, Source } from '@/machine/model'
import { compile } from '@/machine/parser'

function load(source: Source, input: string): Machine {
  const result = compile(source)
  if (!result.ok) throw new Error(result.errors.map((e) => e.message).join('\n'))
  return createMachine(result.def, input)
}

function tapeString(m: Machine): string {
  const cells = [...m.tape.keys()]
  if (!cells.length) return ''
  let out = ''
  for (let i = Math.min(...cells); i <= Math.max(...cells); i++) out += m.tape.get(i) ?? '_'
  return out
}

const example = (name: string) => {
  const found = EXAMPLES.find((ex) => ex.name === name)
  if (!found) throw new Error(`missing example ${name}`)
  return found
}

describe('examples', () => {
  it.each([
    ['Binary increment', '1011', 'accept', '1100', 8],
    ['Binary increment', '111', 'accept', '1000', 8],
    ['Palindrome (a/b)', 'abba', 'accept', '', 15],
    ['Palindrome (a/b)', 'abab', 'reject', 'bab', 6],
    ['aⁿbⁿ', 'aabb', 'accept', 'XXYY', 13],
    ['aⁿbⁿ', 'aab', 'reject', 'XXY', 7],
    ['Unary addition', '111+11', 'accept', '11111', 8],
    ['3-state busy beaver', '', 'accept', '111111', 14],
  ] as const)('%s on "%s" halts with %s', (name, input, verdict, tape, steps) => {
    const m = load(example(name), input)

    expect(run(m, 10_000)).toBe(steps)
    expect(haltInfo(m)?.verdict).toBe(verdict)
    expect(tapeString(m)).toBe(tape)
  })
})

describe('machine', () => {
  it('prefers exact rules over wildcards, and treats * as "unchanged" for write and next', () => {
    const m = load(
      {
        start: 'q0',
        accept: 'done',
        reject: '',
        program: 'q0 * * R q0\nq0 b x R *\nq0 _ _ S done',
      },
      'aba',
    )

    run(m, 100)

    expect(tapeString(m)).toBe('axa')
    expect(m.state).toBe('done')
  })

  it('halts without a verdict when no accept states are defined', () => {
    const m = load({ start: 'q0', accept: '', reject: '', program: 'q0 1 1 R q0' }, '11')

    run(m, 100)

    expect(haltInfo(m)).toEqual({ verdict: 'halt', reason: 'no rule for (q0, _)' })
    expect(step(m)).toBe(false)
  })

  it('rewinding restores the exact initial configuration', () => {
    const m = load(example('Palindrome (a/b)'), 'ab a')
    const initial = { tape: new Map(m.tape), head: m.head, state: m.state }

    const steps = run(m, 10_000)

    expect(rewind(m, Infinity)).toBe(steps)
    expect({ tape: m.tape, head: m.head, state: m.state }).toEqual(initial)
    expect(initial.tape.has(2)).toBe(false)
  })
})
