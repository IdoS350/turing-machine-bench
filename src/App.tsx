import { useCallback, useMemo, useState } from 'react'
import styles from './App.module.css'
import { Controls } from './components/Controls'
import { Field } from './components/Field'
import { NextTransition } from './components/NextTransition'
import { ProgramEditor } from './components/ProgramEditor'
import { Readout } from './components/Readout'
import { Tape } from './components/Tape'
import { TextInput } from './components/TextInput'
import { Trace } from './components/Trace'
import { TransitionTable } from './components/TransitionTable'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import type { Example } from './machine/examples'
import { ruleKey, sourceKey, type ProgramError, type Source } from './machine/model'
import { compile } from './machine/parser'
import { MachineSession, SPEEDS } from './session/MachineSession'
import { useMachineSession } from './session/useMachineSession'
import { usePersistentSettings, type Settings } from './settings'

const NO_ERRORS: readonly ProgramError[] = []

const SHORTCUT_HINT = (
  <p className={styles.hint}>
    <kbd>←</kbd> <kbd>→</kbd> step · <kbd>Shift</kbd>+<kbd>←</kbd> <kbd>→</kbd> step by N ·{' '}
    <kbd>Space</kbd> play/pause · <kbd>R</kbd> reset
  </p>
)

export function App() {
  const [settings, setSettings] = usePersistentSettings()
  const { start, accept, reject, program } = settings
  const source = useMemo(
    () => ({ start, accept, reject, program }),
    [start, accept, reject, program],
  )
  const compiled = useMemo(() => compile(source), [source])
  const currentKey = useMemo(() => sourceKey(source), [source])
  const [loadedKey, setLoadedKey] = useState(() => (compiled.ok ? currentKey : null))
  const [session, snapshot] = useMachineSession(
    () =>
      new MachineSession(compiled.ok ? compiled.def : null, settings.input, SPEEDS[settings.speed]),
  )
  useKeyboardShortcuts(session, settings.stepN)

  const { machine } = snapshot
  const dirty = currentKey !== loadedKey
  const highlight = dirty ? null : machine
  const nextRule = highlight?.next?.rule

  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    [setSettings],
  )

  const loadSource = useCallback(
    (next: Source, input?: string) => {
      const result = compile(next)
      if (!result.ok) return
      session.load(result.def, input)
      setLoadedKey(sourceKey(next))
    },
    [session],
  )

  const loadExample = useCallback(
    (example: Example) => {
      const { start, accept, reject, program, input } = example
      update({ start, accept, reject, program, input })
      loadSource(example, input)
    },
    [update, loadSource],
  )

  const changeProgram = useCallback((program: string) => update({ program }), [update])

  return (
    <>
      <header className={styles.masthead}>
        <h1 className={styles.title}>
          Turing <em>Machine</em> Bench
        </h1>
        <p className={styles.tagline}>
          Define a transition function. Step through it. Watch the tape.
        </p>
      </header>

      <main className={styles.main}>
        <section className={styles.bench} aria-label="Machine">
          <div className={styles.benchTop}>
            <Field label="Input" className={styles.input}>
              <TextInput
                value={settings.input}
                placeholder="empty tape"
                onValueChange={(input) => {
                  update({ input })
                  session.setInput(input)
                }}
              />
            </Field>
            <Readout machine={machine} />
          </div>

          <Tape machine={machine} motion={snapshot.motion} />
          <NextTransition machine={machine} notice={snapshot.notice} />
          <Controls
            session={session}
            snapshot={snapshot}
            stepN={settings.stepN}
            speed={settings.speed}
            onStepNChange={(stepN) => update({ stepN })}
            onSpeedChange={(speed) => {
              update({ speed })
              session.setRate(SPEEDS[speed])
            }}
          />
          {SHORTCUT_HINT}
        </section>

        <ProgramEditor
          className={styles.program}
          source={source}
          errors={compiled.ok ? NO_ERRORS : compiled.errors}
          dirty={dirty}
          onChange={update}
          onLoad={loadSource}
          onExample={loadExample}
        />
        <TransitionTable
          source={source}
          currentState={highlight?.state ?? null}
          nextKey={nextRule ? ruleKey(nextRule.state, nextRule.read) : null}
          onProgramChange={changeProgram}
        />
        <Trace machine={machine} onJump={session.jumpTo} />
      </main>
    </>
  )
}
