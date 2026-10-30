import {
  BLANK,
  WILD,
  ruleKey,
  type Direction,
  type Halt,
  type Machine,
  type MachineDef,
  type MoveName,
  type Rule,
  type Transition,
} from '@/machine/model'

export const moveName = (dir: Direction): MoveName => (dir < 0 ? 'L' : dir > 0 ? 'R' : 'S')

/** Exact-symbol rules take precedence over wildcard rules. */
export const findRule = (def: MachineDef, state: string, sym: string): Rule | undefined =>
  def.index.get(ruleKey(state, sym)) ?? def.index.get(ruleKey(state, WILD))

export const readCell = (m: Machine): string => m.tape.get(m.head) ?? BLANK

export function transitionOf(rule: Rule, state: string, read: string): Transition {
  return {
    state,
    read,
    write: rule.write === WILD ? read : rule.write,
    move: moveName(rule.dir),
    next: rule.next === WILD ? state : rule.next,
    rule,
  }
}

export function createMachine(def: MachineDef, input: string): Machine {
  const tape = new Map<number, string>()
  ;[...input].forEach((ch, i) => {
    if (ch !== BLANK && !/\s/.test(ch)) tape.set(i, ch)
  })
  return { def, tape, head: 0, state: def.start, history: [] }
}

export function haltInfo(m: Machine): Halt | null {
  const { def, state } = m
  if (def.accept.has(state)) return { verdict: 'accept', reason: `reached accept state ${state}` }
  if (def.reject.has(state)) return { verdict: 'reject', reason: `reached reject state ${state}` }
  const sym = readCell(m)
  if (findRule(def, state, sym)) return null
  const reason = `no rule for (${state}, ${sym})`
  return def.accept.size
    ? { verdict: 'reject', reason: `${reason}, implicit reject` }
    : { verdict: 'halt', reason }
}

export function step(m: Machine): boolean {
  if (haltInfo(m)) return false
  const sym = readCell(m)
  const rule = findRule(m.def, m.state, sym)
  if (!rule) return false
  const transition = transitionOf(rule, m.state, sym)
  m.history.push({ head: m.head, sym: m.tape.get(m.head), transition })
  if (transition.write === BLANK) m.tape.delete(m.head)
  else m.tape.set(m.head, transition.write)
  m.head += rule.dir
  m.state = transition.next
  return true
}

export function undo(m: Machine): boolean {
  const entry = m.history.pop()
  if (!entry) return false
  m.head = entry.head
  m.state = entry.transition.state
  if (entry.sym === undefined) m.tape.delete(entry.head)
  else m.tape.set(entry.head, entry.sym)
  return true
}

/** Steps forward up to `max` times; returns how many steps were taken. */
export function run(m: Machine, max: number): number {
  let n = 0
  while (n < max && step(m)) n++
  return n
}

/** Steps back up to `max` times; returns how many steps were undone. */
export function rewind(m: Machine, max: number): number {
  let n = 0
  while (n < max && undo(m)) n++
  return n
}
