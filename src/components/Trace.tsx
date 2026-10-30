import { memo } from 'react'
import { cx } from '../lib/cx'
import { formatCount } from '../lib/format'
import type { Transition } from '../machine/model'
import type { MachineView } from '../session/MachineSession'
import { Panel } from './Panel'
import styles from './Trace.module.css'

interface TraceProps {
  machine: MachineView | null
  onJump: (step: number) => void
}

export function Trace({ machine, onJump }: TraceProps) {
  return (
    <Panel title="Trace" meta="click a step to rewind to it">
      {machine && (
        <ol className={styles.trace}>
          {machine.trace.map((transition, i) => (
            <TraceRow
              key={machine.step - i}
              step={machine.step - i}
              transition={transition}
              current={i === 0}
              onJump={onJump}
            />
          ))}
          {machine.hiddenTraceCount > 0 && (
            <li className={styles.more}>… {formatCount(machine.hiddenTraceCount)} earlier steps</li>
          )}
          <TraceRow
            step={0}
            startState={machine.def.start}
            current={machine.step === 0}
            onJump={onJump}
          />
        </ol>
      )}
    </Panel>
  )
}

interface TraceRowProps {
  step: number
  /** The step's transition; omitted for the initial configuration. */
  transition?: Transition
  startState?: string
  current: boolean
  onJump: (step: number) => void
}

const TraceRow = memo(function TraceRow({
  step,
  transition: t,
  startState,
  current,
  onJump,
}: TraceRowProps) {
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={cx(styles.row, current && styles.current)}
        onClick={() => onJump(step)}
      >
        <span className={styles.step}>{formatCount(step)}</span>
        <span>
          {t
            ? `(${t.state}, ${t.read}) → (${t.write}, ${t.move}, ${t.next})`
            : `start in ${startState} at cell 0`}
        </span>
        <span className={styles.line}>{t && `line ${t.rule.line}`}</span>
      </button>
    </li>
  )
})
