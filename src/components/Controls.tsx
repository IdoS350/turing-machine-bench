import { formatCount } from '../lib/format'
import { SPEEDS, type MachineSession, type SessionSnapshot } from '../session/MachineSession'
import { Button } from './Button'
import styles from './Controls.module.css'
import { Field } from './Field'

const MAX_STEP_N = 1_000_000

interface ControlsProps {
  session: MachineSession
  snapshot: SessionSnapshot
  stepN: number
  speed: number
  onStepNChange: (n: number) => void
  onSpeedChange: (speed: number) => void
}

export function Controls({
  session,
  snapshot: { machine, playing },
  stepN,
  speed,
  onStepNChange,
  onSpeedChange,
}: ControlsProps) {
  const canBack = !!machine && machine.step > 0
  const canForward = !!machine && !machine.halt
  const n = formatCount(stepN)

  return (
    <div className={styles.controls}>
      <Button onClick={session.reset} disabled={!machine} title="Reset (R)">
        Reset
      </Button>
      <div className={styles.group} role="group" aria-label="Step controls">
        <Button
          onClick={() => session.back(stepN)}
          disabled={!canBack}
          title="Back N steps (Shift+←)"
        >
          −{n}
        </Button>
        <Button onClick={session.prev} disabled={!canBack} title="Previous step (←)">
          ◀ Prev
        </Button>
        <Button
          variant="primary"
          onClick={session.togglePlay}
          disabled={!canForward && !playing}
          title="Play / pause (Space)"
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button onClick={session.next} disabled={!canForward} title="Next step (→)">
          Next ▶
        </Button>
        <Button
          onClick={() => session.forward(stepN)}
          disabled={!canForward}
          title="Forward N steps (Shift+→)"
        >
          +{n}
        </Button>
      </div>
      <Field label="N" className={styles.stepN}>
        <input
          type="number"
          min={1}
          max={MAX_STEP_N}
          defaultValue={stepN}
          onChange={(e) => {
            const value = Number.parseInt(e.target.value, 10)
            if (value > 0) onStepNChange(Math.min(value, MAX_STEP_N))
          }}
        />
      </Field>
      <Field
        label={
          <>
            Speed <output className={styles.speed}>{formatCount(SPEEDS[speed])}/s</output>
          </>
        }
      >
        <input
          type="range"
          min={0}
          max={SPEEDS.length - 1}
          step={1}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
      </Field>
      <Button
        onClick={session.runToHalt}
        disabled={!canForward}
        title="Run until the machine halts"
      >
        Run to halt
      </Button>
    </div>
  )
}
