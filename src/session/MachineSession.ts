import {
  createMachine,
  findRule,
  haltInfo,
  readCell,
  rewind,
  run,
  step,
  transitionOf,
  undo,
} from '../machine/machine'
import { formatCount } from '../lib/format'
import { BLANK, type Halt, type Machine, type MachineDef, type Transition } from '../machine/model'

/** Playback rates in steps per second, selected by index. */
export const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 250, 1000, 5000] as const
export const RUN_LIMIT = 100_000
const TRACE_LIMIT = 200
const MAX_STEPS_PER_FRAME = 5000
const STEP_ANIMATION_MS = 220
const MAX_ANIMATED_RATE = 15

/** Describes a single-step head move so the tape can animate it. */
export interface Motion {
  from: number
  /** Cell whose content changed. */
  touched: number
  duration: number
}

export interface TraceEntry extends Transition {
  step: number
}

export interface MachineView {
  def: MachineDef
  state: string
  head: number
  step: number
  reading: string
  cells: ReadonlyMap<number, string>
  halt: Halt | null
  next: Transition | null
  /** Most recent first, capped at TRACE_LIMIT entries. */
  trace: readonly TraceEntry[]
  hiddenTraceCount: number
}

export interface SessionSnapshot {
  machine: MachineView | null
  playing: boolean
  notice: string
  motion: Motion | null
}

function viewOf(m: Machine): MachineView {
  const halt = haltInfo(m)
  const reading = readCell(m)
  const rule = halt ? undefined : findRule(m.def, m.state, reading)
  const first = Math.max(0, m.history.length - TRACE_LIMIT)
  const trace = m.history
    .slice(first)
    .map((e, i) => ({ step: first + i + 1, ...transitionOf(e.rule, e.state, e.sym ?? BLANK) }))
    .reverse()

  return {
    def: m.def,
    state: m.state,
    head: m.head,
    step: m.history.length,
    reading,
    cells: new Map(m.tape),
    halt,
    next: rule ? transitionOf(rule, m.state, reading) : null,
    trace,
    hiddenTraceCount: first,
  }
}

/**
 * Owns the mutable machine and its playback loop, and publishes immutable
 * snapshots for `useSyncExternalStore`.
 */
export class MachineSession {
  #machine: Machine | null
  #input: string
  #rate: number
  #playing = false
  #notice = ''
  #raf = 0
  #listeners = new Set<() => void>()
  #snapshot: SessionSnapshot

  constructor(def: MachineDef | null, input: string, rate: number) {
    this.#machine = def && createMachine(def, input)
    this.#input = input
    this.#rate = rate
    this.#snapshot = this.#build(null)
  }

  subscribe = (listener: () => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  getSnapshot = () => this.#snapshot

  load = (def: MachineDef, input: string) => {
    this.#stop()
    this.#notice = ''
    this.#input = input
    this.#machine = createMachine(def, input)
    this.#emit(null)
  }

  setInput = (input: string) => {
    this.#input = input
    this.reset()
  }

  setRate = (rate: number) => {
    this.#rate = rate
  }

  reset = () => {
    if (this.#machine) this.load(this.#machine.def, this.#input)
  }

  next = () =>
    this.#act((m) => {
      const from = m.head
      return step(m) ? { from, touched: from, duration: STEP_ANIMATION_MS } : null
    })

  prev = () =>
    this.#act((m) => {
      const from = m.head
      return undo(m) ? { from, touched: m.head, duration: STEP_ANIMATION_MS } : null
    })

  forward = (n: number) => this.#act((m) => (run(m, n), null))

  back = (n: number) => this.#act((m) => (rewind(m, n), null))

  jumpTo = (stepNumber: number) =>
    this.#act((m) => (rewind(m, m.history.length - stepNumber), null))

  runToHalt = () =>
    this.#act((m) => {
      run(m, RUN_LIMIT)
      if (!haltInfo(m)) {
        this.#notice = `Paused after ${formatCount(RUN_LIMIT)} steps: this machine may never halt.`
      }
      return null
    })

  play = () => {
    const m = this.#machine
    if (!m || this.#playing || haltInfo(m)) return
    this.#playing = true
    this.#notice = ''
    let last = performance.now()
    let budget = 1 // take the first step immediately

    const tick = (now: number) => {
      const rate = this.#rate
      budget += (Math.max(0, now - last) / 1000) * rate
      last = now
      const due = Math.floor(budget)
      budget -= due

      const from = m.head
      const done = run(m, Math.min(due, MAX_STEPS_PER_FRAME))
      const halted = haltInfo(m) !== null
      if (halted) this.#playing = false
      else this.#raf = requestAnimationFrame(tick)

      if (done || halted) {
        const animate = done === 1 && rate <= MAX_ANIMATED_RATE
        this.#emit(
          animate
            ? { from, touched: from, duration: Math.min(STEP_ANIMATION_MS, 700 / rate) }
            : null,
        )
      }
    }

    this.#raf = requestAnimationFrame(tick)
    this.#emit(null)
  }

  pause = () => {
    if (!this.#playing) return
    this.#stop()
    this.#emit(null)
  }

  togglePlay = () => (this.#playing ? this.pause() : this.play())

  dispose = () => this.#stop()

  #act(fn: (m: Machine) => Motion | null) {
    const m = this.#machine
    if (!m) return
    this.#stop()
    this.#notice = ''
    this.#emit(fn(m))
  }

  #stop() {
    this.#playing = false
    cancelAnimationFrame(this.#raf)
  }

  #build(motion: Motion | null): SessionSnapshot {
    return {
      machine: this.#machine && viewOf(this.#machine),
      playing: this.#playing,
      notice: this.#notice,
      motion,
    }
  }

  #emit(motion: Motion | null) {
    this.#snapshot = this.#build(motion)
    this.#listeners.forEach((listener) => listener())
  }
}
