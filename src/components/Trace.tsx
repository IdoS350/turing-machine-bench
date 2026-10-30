import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { formatCount } from '../lib/format'
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
          {machine.trace.map((t) => (
            <TraceRow
              key={t.step}
              step={t.step}
              current={t.step === machine.step}
              line={t.rule.line}
              onJump={onJump}
            >
              ({t.state}, {t.read}) → ({t.write}, {t.move}, {t.next})
            </TraceRow>
          ))}
          {machine.hiddenTraceCount > 0 && (
            <li className={styles.more}>… {formatCount(machine.hiddenTraceCount)} earlier steps</li>
          )}
          <TraceRow step={0} current={machine.step === 0} onJump={onJump}>
            start in {machine.def.start} at cell 0
          </TraceRow>
        </ol>
      )}
    </Panel>
  )
}

interface TraceRowProps {
  step: number
  current: boolean
  line?: number
  onJump: (step: number) => void
  children: ReactNode
}

function TraceRow({ step, current, line, onJump, children }: TraceRowProps) {
  return (
    <li>
      <button
        type="button"
        className={cx(styles.row, current && styles.current)}
        onClick={() => onJump(step)}
      >
        <span className={styles.step}>{formatCount(step)}</span>
        <span>{children}</span>
        <span className={styles.line}>{line !== undefined && `line ${line}`}</span>
      </button>
    </li>
  )
}
