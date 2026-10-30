import { NumberField } from '@base-ui/react/number-field'
import { Slider } from '@base-ui/react/slider'
import { useState } from 'react'
import { Field } from '@/components/Field/Field'
import { formatCount } from '@/lib/format'
import { SPEEDS } from '@/session/MachineSession'
import styles from './RunSettings.module.css'

const MAX_STEP_N = 1_000_000

interface RunSettingsProps {
  stepN: number
  speed: number
  onStepNChange: (n: number) => void
  onSpeedChange: (speed: number) => void
}

export function RunSettings({ stepN, speed, onStepNChange, onSpeedChange }: RunSettingsProps) {
  // The N field owns its value after mount; only seed it once.
  const [initialStepN] = useState(stepN)

  return (
    <>
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
    </>
  )
}
