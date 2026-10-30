import { cx } from '@/lib/cx'
import { formatCount } from '@/lib/format'
import type { MachineView } from '@/session/MachineSession'
import styles from './NextTransition.module.css'

const VERDICT_LABELS = { accept: 'ACCEPTED', reject: 'REJECTED', halt: 'HALTED' } as const

interface NextTransitionProps {
  machine: MachineView | null
  notice: string
}

export function NextTransition({ machine, notice }: NextTransitionProps) {
  return (
    <div className={styles.next}>
      {!machine ? (
        <span className={styles.muted}>Fix the program errors, then load the machine.</span>
      ) : machine.halt ? (
        <span role="status" className={styles.halted}>
          <span className={cx(styles.verdict, styles[machine.halt.verdict])}>
            {VERDICT_LABELS[machine.halt.verdict]}
          </span>
          {machine.halt.reason} after {formatCount(machine.step)} step
          {machine.step === 1 ? '' : 's'}
        </span>
      ) : (
        machine.next && (
          <>
            <span className={styles.label}>Next</span>
            <code className={styles.pill}>
              (<b>{machine.next.state}</b>, <b>{machine.next.read}</b>)
            </code>
            <span aria-hidden="true">→</span>
            <code className={styles.pill}>
              write <b>{machine.next.write}</b>
            </code>
            <code className={styles.pill}>
              move <b>{machine.next.move}</b>
            </code>
            <code className={styles.pill}>
              go to <b>{machine.next.next}</b>
            </code>
            <span className={styles.muted}>line {machine.next.rule.line}</span>
          </>
        )
      )}
      {notice && <span className={styles.notice}>{notice}</span>}
    </div>
  )
}
