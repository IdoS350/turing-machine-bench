import { RunSettings } from './RunSettings'
import { StepControls, type ControlsActions } from './StepControls'
import type { SessionSnapshot } from '@/session/MachineSession'
import styles from './Controls.module.css'

interface ControlsProps {
  actions: ControlsActions
  snapshot: SessionSnapshot
  stepN: number
  speed: number
  onStepNChange: (n: number) => void
  onSpeedChange: (speed: number) => void
}

export function Controls({
  actions,
  snapshot,
  stepN,
  speed,
  onStepNChange,
  onSpeedChange,
}: ControlsProps) {
  return (
    <div className={styles.controls}>
      <StepControls
        actions={actions}
        machine={snapshot.machine}
        playing={snapshot.playing}
        stepN={stepN}
      />
      <RunSettings
        stepN={stepN}
        speed={speed}
        onStepNChange={onStepNChange}
        onSpeedChange={onSpeedChange}
      />
    </div>
  )
}
