import {
  BLANK,
  WILD,
  ruleKey,
  type CompileResult,
  type Direction,
  type MachineDef,
  type ProgramError,
  type Rule,
  type Source,
} from '@/machine/model'

const MOVES = new Map<string, Direction>([
  ['L', -1],
  ['R', 1],
  ['S', 0],
  ['N', 0],
  ['<', -1],
  ['>', 1],
  ['-', 0],
])

const unique = <T>(items: Iterable<T>): T[] => [...new Set(items)]

export const splitStates = (list: string) => list.split(/[\s,]+/).filter(Boolean)

export function parseProgram(text: string) {
  const rules: Rule[] = []
  const errors: ProgramError[] = []
  const index = new Map<string, Rule>()

  text.split('\n').forEach((raw, i) => {
    const line = i + 1
    const content = raw
      .replace(/;.*$/, '')
      .replace(/->|→|,/g, ' ')
      .trim()
    if (!content) return

    const parts = content.split(/\s+/)
    if (parts.length !== 5) {
      errors.push({
        line,
        message: `expected 5 fields (state read write move next), got ${parts.length}`,
      })
      return
    }

    const [state, read, write, moveRaw, next] = parts
    const dir = MOVES.get(moveRaw.toUpperCase())
    const key = ruleKey(state, read)
    const duplicate = index.get(key)
    const problems = [
      state === WILD && '"*" cannot be a state name',
      [...read].length !== 1 && `read symbol "${read}" must be a single character`,
      [...write].length !== 1 && `write symbol "${write}" must be a single character`,
      dir === undefined && `move "${moveRaw}" must be L, R or S`,
      duplicate &&
        `duplicate rule for (${state}, ${read}), first defined on line ${duplicate.line}`,
    ].filter((p): p is string => typeof p === 'string')

    if (problems.length || dir === undefined) {
      errors.push(...problems.map((message) => ({ line, message })))
      return
    }

    const rule: Rule = { state, read, write, dir, next, line }
    rules.push(rule)
    index.set(key, rule)
  })

  return { rules, index, errors }
}

export function compile(source: Source): CompileResult {
  const { rules, index, errors } = parseProgram(source.program)
  const start = source.start.trim()
  if (!start) errors.unshift({ line: 0, message: 'start state is required' })
  else if (/\s/.test(start))
    errors.unshift({ line: 0, message: 'start state cannot contain spaces' })
  if (errors.length) return { ok: false, errors }

  return { ok: true, def: toDef(rules, index, source) }
}

/** Best-effort definition of a draft: keeps every rule that parsed, even if other lines have errors. */
export function draftDef(source: Source): MachineDef {
  const { rules, index } = parseProgram(source.program)
  return toDef(rules, index, source)
}

function toDef(rules: Rule[], index: Map<string, Rule>, source: Source): MachineDef {
  const start = source.start.trim()
  const accept = new Set(splitStates(source.accept))
  const reject = new Set(splitStates(source.reject))
  const states = unique([
    start,
    ...rules.map((r) => r.state),
    ...rules.map((r) => r.next).filter((s) => s !== WILD),
    ...accept,
    ...reject,
  ]).filter(Boolean)
  const symbols = unique([...rules.map((r) => r.read), ...rules.map((r) => r.write)]).filter(
    (s) => s !== WILD && s !== BLANK,
  )
  const columns = [...symbols, BLANK, ...(rules.some((r) => r.read === WILD) ? [WILD] : [])]

  return { rules, index, start, accept, reject, states, columns }
}
