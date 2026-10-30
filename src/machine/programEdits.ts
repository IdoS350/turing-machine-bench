import { WILD, ruleKey, type MoveName } from './model'
import { parseProgram } from './parser'

export interface RuleFields {
  write: string
  move: MoveName
  next: string
}

// Characters the parser treats as separators or comments.
const RESERVED = /[\s;,→]/

export function symbolError(sym: string): string | null {
  if ([...sym].length !== 1) return 'Symbols must be a single character'
  if (RESERVED.test(sym)) return 'Symbols cannot be whitespace, ";", "," or "→"'
  return null
}

export function stateError(name: string): string | null {
  if (!name) return 'State name is required'
  if (name === WILD) return '"*" is reserved'
  if (RESERVED.test(name) || name.includes('->')) {
    return 'State names cannot contain spaces, ";", "," or arrows'
  }
  return null
}

/** Replaces the rule for (state, read) in place, or inserts it after the state's last rule. */
export function setRule(program: string, state: string, read: string, fields: RuleFields): string {
  const { rules, index } = parseProgram(program)
  const lines = program.split('\n')
  const text = `${state} ${read} ${fields.write} ${fields.move} ${fields.next}`

  const existing = index.get(ruleKey(state, read))
  if (existing) {
    const raw = lines[existing.line - 1]
    const indent = /^\s*/.exec(raw)?.[0] ?? ''
    const comment = /\s*;.*$/.exec(raw)?.[0] ?? ''
    lines[existing.line - 1] = indent + text + comment
    return lines.join('\n')
  }

  const sameState = rules.filter((r) => r.state === state)
  if (sameState.length) {
    lines.splice(Math.max(...sameState.map((r) => r.line)), 0, text)
    return lines.join('\n')
  }

  if (!program.trim()) return text
  return program.endsWith('\n') ? program + text : `${program}\n${text}`
}

export function deleteRule(program: string, state: string, read: string): string {
  const rule = parseProgram(program).index.get(ruleKey(state, read))
  if (!rule) return program
  const lines = program.split('\n')
  lines.splice(rule.line - 1, 1)
  return lines.join('\n')
}
