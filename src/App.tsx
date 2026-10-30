import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useCallback, useMemo, useState } from 'react'
import styles from './App.module.css'
import { Button } from '@/components/Button/Button'
import { Controls } from '@/components/Controls/Controls'
import { Field } from '@/components/Field/Field'
import { NextTransition } from '@/components/NextTransition/NextTransition'
import { ProgramEditor } from '@/components/ProgramEditor/ProgramEditor'
import { Readout } from '@/components/Readout/Readout'
import { Tape } from '@/components/Tape/Tape'
import { TuringMachineDiagram } from '@/components/TuringMachineDiagram/TuringMachineDiagram'
import { TextInput } from '@/components/TextInput/TextInput'
import { Trace } from '@/components/Trace/Trace'
import { TransitionTable } from '@/components/TransitionTable/TransitionTable'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cx } from '@/lib/cx'
import type { Example } from '@/machine/examples'
import { ruleKey, sourceKey, type ProgramError, type Source } from '@/machine/model'
import { compile } from '@/machine/parser'
import { SPEEDS } from '@/session/MachineSession'
import { useMachineSession } from '@/session/useMachineSession'
import popup from '@/styles/popup.module.css'
import { EMPTY_SETTINGS, usePersistentSettings, type Settings } from '@/settings'

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
  const [resetRevision, setResetRevision] = useState(0)
  const [session, snapshot] = useMachineSession(
    compiled.ok ? compiled.def : null,
    settings.input,
    SPEEDS[settings.speed],
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

  const resetAll = useCallback(() => {
    setSettings({ ...EMPTY_SETTINGS })
    setLoadedKey(null)
    session.clear()
    session.setRate(SPEEDS[EMPTY_SETTINGS.speed])
    setResetRevision((revision) => revision + 1)
  }, [session, setSettings])

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
            key={resetRevision}
            actions={{
              reset: session.reset,
              back: session.back,
              prev: session.prev,
              togglePlay: session.togglePlay,
              next: session.next,
              forward: session.forward,
              runToHalt: session.runToHalt,
            }}
            snapshot={snapshot}
            stepN={settings.stepN}
            speed={settings.speed}
            onStepNChange={(stepN) => update({ stepN })}
            onSpeedChange={(speed) => {
              update({ speed })
              session.setRate(SPEEDS[speed])
            }}
          />
          <div className={styles.benchFooter}>
            {SHORTCUT_HINT}
            <div className={styles.benchReset}>
              <AlertDialog.Root>
                <AlertDialog.Trigger render={<Button />}>Reset all</AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop className={styles.resetBackdrop} />
                  <AlertDialog.Popup className={cx(popup.popup, styles.resetDialog)}>
                    <AlertDialog.Title className={styles.resetTitle}>
                      Reset the whole machine?
                    </AlertDialog.Title>
                    <AlertDialog.Description className={styles.resetDescription}>
                      This clears the program, input, transition table additions, and current run.
                      Speed and step size return to their defaults.
                    </AlertDialog.Description>
                    <div className={styles.resetActions}>
                      <AlertDialog.Close render={<Button />}>Cancel</AlertDialog.Close>
                      <AlertDialog.Close render={<Button variant="primary" />} onClick={resetAll}>
                        Reset all
                      </AlertDialog.Close>
                    </div>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </div>
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
        <div className={styles.analysis}>
          <TransitionTable
            key={resetRevision}
            source={source}
            currentState={highlight?.state ?? null}
            nextKey={nextRule ? ruleKey(nextRule.state, nextRule.read) : null}
            onProgramChange={changeProgram}
          />
          <Trace machine={machine} onJump={session.jumpTo} />
        </div>
      </main>
      <section className={styles.diagramSection} aria-labelledby="machine-anatomy-title">
        <h2 className={styles.diagramTitle} id="machine-anatomy-title">
          Machine anatomy
        </h2>
        <p className={styles.diagramIntro}>
          A Turing machine stores symbols on an unbounded tape. At each step, its current state and
          scanned symbol select a rule: (q0, 1) → (q1, 0, R) means write 0, move right, and switch
          to q1. It stops when it reaches an accept/reject state or has no matching rule.
        </p>
        <TuringMachineDiagram />
      </section>
    </>
  )
}
