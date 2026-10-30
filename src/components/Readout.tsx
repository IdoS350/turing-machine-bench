import { formatCount } from '../lib/format'
import { BLANK } from '../machine/model'
import type { MachineView } from '../session/MachineSession'
import styles from './Readout.module.css'

export function Readout({ machine }: { machine: MachineView | null }) {
  return (
    <dl className={styles.readout}>
      <div>
        <dt>State</dt>
        <dd className={styles.state}>{machine?.state ?? '—'}</dd>
      </div>
      <div>
        <dt>Step</dt>
        <dd>{formatCount(machine?.step ?? 0)}</dd>
      </div>
      <div>
        <dt>Head</dt>
        <dd>{machine?.head ?? 0}</dd>
      </div>
      <div>
        <dt>Reading</dt>
        <dd>{machine?.reading ?? BLANK}</dd>
      </div>
    </dl>
  )
}
