import { useMemo, useState } from 'react'
import styles from './App.module.css'
import { Controls } from './components/Controls'
import { Field } from './components/Field'
import { NextTransition } from './components/NextTransition'
import { ProgramEditor } from './components/ProgramEditor'
import { Readout } from './components/Readout'
import { Tape } from './components/Tape'
import { Trace } from './components/Trace'
import { TransitionTable } from './components/TransitionTable'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { EXAMPLES, type Example } from './machine/examples'
import { compile } from './machine/parser'
import { MachineSession, SPEEDS } from './session/MachineSession'
import { useMachineSession } from './session/useMachineSession'
import { sourceKey, usePersistentSettings, type Settings } from './settings'

export function App() {
  const [settings, setSettings] = usePersistentSettings()
  const { start, accept, reject, program } = settings
  const compiled = useMemo(
    () => compile({ start, accept, reject, program }),
    [start, accept, reject, program],
  )
  const [loadedKey, setLoadedKey] = useState(() => (compiled.ok ? sourceKey(settings) : null))
  const [session, snapshot] = useMachineSession(
    () =>
      new MachineSession(compiled.ok ? compiled.def : null, settings.input, SPEEDS[settings.speed]),
  )
  useKeyboardShortcuts(session, settings.stepN)

  const { machine } = snapshot
  const update = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }))

  const apply = (next: Settings) => {
    const result = compile(next)
    if (!result.ok) return
    session.load(result.def, next.input)
    setLoadedKey(sourceKey(next))
  }

  const loadExample = (example: Example) => {
    const isPristineExample = EXAMPLES.some((ex) => sourceKey(ex) === sourceKey(settings))
    if (!isPristineExample && !confirm('Replace your current program with this example?')) return
    const next: Settings = {
      ...settings,
      start: example.start,
      accept: example.accept,
      reject: example.reject,
      program: example.program,
      input: example.input,
    }
    setSettings(next)
    apply(next)
  }

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
              <input
                type="text"
                value={settings.input}
                placeholder="empty tape"
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => {
                  update({ input: e.target.value })
                  session.setInput(e.target.value)
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
          <p className={styles.hint}>
            <kbd>←</kbd> <kbd>→</kbd> step · <kbd>Shift</kbd>+<kbd>←</kbd> <kbd>→</kbd> step by N ·{' '}
            <kbd>Space</kbd> play/pause · <kbd>R</kbd> reset
          </p>
        </section>

        <ProgramEditor
          className={styles.program}
          source={settings}
          errors={compiled.ok ? [] : compiled.errors}
          dirty={sourceKey(settings) !== loadedKey}
          onChange={update}
          onLoad={() => apply(settings)}
          onExample={loadExample}
        />
        <TransitionTable machine={machine} />
        <Trace machine={machine} onJump={session.jumpTo} />
      </main>
    </>
  )
}
