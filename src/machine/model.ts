export const BLANK = '_'
export const WILD = '*'

export type Direction = -1 | 0 | 1
export type MoveName = 'L' | 'S' | 'R'

export interface Rule {
  state: string
  read: string
  write: string
  dir: Direction
  next: string
  line: number
}

/** `line` is 0 for errors not tied to a program line. */
export interface ProgramError {
  line: number
  message: string
}

export interface Source {
  start: string
  accept: string
  reject: string
  program: string
}

export interface MachineDef {
  rules: readonly Rule[]
  index: ReadonlyMap<string, Rule>
  start: string
  accept: ReadonlySet<string>
  reject: ReadonlySet<string>
  /** Table rows, in order of first appearance. */
  states: readonly string[]
  /** Table columns: symbols in order of appearance, then blank, then wildcard if used. */
  columns: readonly string[]
}

export type CompileResult = { ok: true; def: MachineDef } | { ok: false; errors: ProgramError[] }

export interface HistoryEntry {
  head: number
  state: string
  /** Cell content before the step; `undefined` means blank. */
  sym: string | undefined
  rule: Rule
}

export interface Machine {
  readonly def: MachineDef
  tape: Map<number, string>
  head: number
  state: string
  history: HistoryEntry[]
}

export type Verdict = 'accept' | 'reject' | 'halt'

export interface Halt {
  verdict: Verdict
  reason: string
}

/** A rule as applied to a concrete state and symbol, with wildcards resolved. */
export interface Transition {
  state: string
  read: string
  write: string
  move: MoveName
  next: string
  rule: Rule
}

export const ruleKey = (state: string, sym: string) => `${state} ${sym}`
