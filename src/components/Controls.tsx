import { NumberField } from '@base-ui/react/number-field'
import { Slider } from '@base-ui/react/slider'
import { useState } from 'react'
import { formatCount } from '../lib/format'
import { SPEEDS, type MachineSession, type SessionSnapshot } from '../session/MachineSession'
import { Button } from './Button'
import styles from './Controls.module.css'
import { Field } from './Field'
import { Hint } from './Hint'

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
  // The N field owns its value after mount; only seed it once.
  const [initialStepN] = useState(stepN)

  return (
    <div className={styles.controls}>
      <Hint label="Reset" shortcut="R" keys="R">
        <Button onClick={session.reset} disabled={!machine}>
          Reset
        </Button>
      </Hint>
      <div className={styles.group} role="group" aria-label="Step controls">
        <Hint label={`Back ${n} steps`} shortcut="Shift+←" keys="Shift+ArrowLeft">
          <Button onClick={() => session.back(stepN)} disabled={!canBack}>
            −{n}
          </Button>
        </Hint>
        <Hint label="Previous step" shortcut="←" keys="ArrowLeft">
          <Button onClick={session.prev} disabled={!canBack}>
            ◀ Prev
          </Button>
        </Hint>
        <Hint label={playing ? 'Pause' : 'Play'} shortcut="Space" keys="Space">
          <Button variant="primary" onClick={session.togglePlay} disabled={!canForward && !playing}>
            {playing ? 'Pause' : 'Play'}
          </Button>
        </Hint>
        <Hint label="Next step" shortcut="→" keys="ArrowRight">
          <Button onClick={session.next} disabled={!canForward}>
            Next ▶
          </Button>
        </Hint>
        <Hint label={`Forward ${n} steps`} shortcut="Shift+→" keys="Shift+ArrowRight">
          <Button onClick={() => session.forward(stepN)} disabled={!canForward}>
            +{n}
          </Button>
        </Hint>
      </div>
      <Field label="N">
        <NumberField.Root
          defaultValue={initialStepN}
          min={1}
          max={MAX_STEP_N}
          onValueChange={(value) => {
            if (value !== null && value >= 1) onStepNChange(Math.round(value))
          }}
        >
          <NumberField.Group className={styles.numberGroup}>
            <NumberField.Decrement className={styles.stepper} aria-label="Decrease N">
              −
            </NumberField.Decrement>
            <NumberField.Input className={styles.numberInput} />
            <NumberField.Increment className={styles.stepper} aria-label="Increase N">
              +
            </NumberField.Increment>
          </NumberField.Group>
        </NumberField.Root>
      </Field>
      <Slider.Root
        className={styles.speed}
        value={speed}
        min={0}
        max={SPEEDS.length - 1}
        step={1}
        onValueChange={(value) => onSpeedChange(Array.isArray(value) ? value[0] : value)}
      >
        <Slider.Label className={styles.speedLabel}>Speed</Slider.Label>
        <Slider.Value className={styles.speedValue}>
          {(_, [index]) => `${formatCount(SPEEDS[index])}/s`}
        </Slider.Value>
        <Slider.Control className={styles.sliderControl}>
          <Slider.Track className={styles.sliderTrack}>
            <Slider.Indicator className={styles.sliderIndicator} />
            <Slider.Thumb
              className={styles.sliderThumb}
              getAriaValueText={(_, value) => `${formatCount(SPEEDS[value])} steps per second`}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Hint label="Run until the machine halts">
        <Button onClick={session.runToHalt} disabled={!canForward}>
          Run to halt
        </Button>
      </Hint>
    </div>
  )
}
