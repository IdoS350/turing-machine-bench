import { Button } from '@/components/Button/Button'
import { Hint } from '@/components/Hint/Hint'
import { formatCount } from '@/lib/format'
import type { SessionSnapshot } from '@/session/MachineSession'
import styles from './StepControls.module.css'

export interface ControlsActions {
  reset: () => void
  back: (n: number) => void
  prev: () => void
  togglePlay: () => void
  next: () => void
  forward: (n: number) => void
  runToHalt: () => void
}

interface StepControlsProps {
  actions: ControlsActions
  machine: SessionSnapshot['machine']
  playing: boolean
  stepN: number
}

export function StepControls({ actions, machine, playing, stepN }: StepControlsProps) {
  const canBack = !!machine && machine.step > 0
  const canForward = !!machine && !machine.halt
  const n = formatCount(stepN)

  return (
    <>
      <Hint label="Reset" shortcut="R" keys="R">
        <Button onClick={actions.reset} disabled={!machine}>
          Reset
        </Button>
      </Hint>
      <div className={styles.group} role="group" aria-label="Step controls">
        <Hint label={`Back ${n} steps`} shortcut="Shift+←" keys="Shift+ArrowLeft">
          <Button onClick={() => actions.back(stepN)} disabled={!canBack}>
            −{n}
          </Button>
        </Hint>
        <Hint label="Previous step" shortcut="←" keys="ArrowLeft">
          <Button onClick={actions.prev} disabled={!canBack}>
            ◀ Prev
          </Button>
        </Hint>
        <Hint label={playing ? 'Pause' : 'Play'} shortcut="Space" keys="Space">
          <Button variant="primary" onClick={actions.togglePlay} disabled={!canForward && !playing}>
            {playing ? 'Pause' : 'Play'}
          </Button>
        </Hint>
        <Hint label="Next step" shortcut="→" keys="ArrowRight">
          <Button onClick={actions.next} disabled={!canForward}>
            Next ▶
          </Button>
        </Hint>
        <Hint label={`Forward ${n} steps`} shortcut="Shift+→" keys="Shift+ArrowRight">
          <Button onClick={() => actions.forward(stepN)} disabled={!canForward}>
            +{n}
          </Button>
        </Hint>
      </div>
      <Hint label="Run until the machine halts">
        <Button onClick={actions.runToHalt} disabled={!canForward}>
          Run to halt
        </Button>
      </Hint>
    </>
  )
}
