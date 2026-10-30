import { cx } from '../lib/cx'
import { moveName } from '../machine/machine'
import { ruleKey } from '../machine/model'
import type { MachineView } from '../session/MachineSession'
import { Panel } from './Panel'
import styles from './TransitionTable.module.css'

export function TransitionTable({ machine }: { machine: MachineView | null }) {
  if (!machine) {
    return (
      <Panel title="Transition table">
        <p className={styles.empty}>Load a valid program to see its table.</p>
      </Panel>
    )
  }

  const { def, state: currentState, next } = machine
  const nextKey = next && ruleKey(next.rule.state, next.rule.read)

  return (
    <Panel
      title="Transition table"
      meta={`${def.states.length} states · ${def.rules.length} rules`}
    >
      {def.rules.length === 0 ? (
        <p className={styles.empty}>No rules yet.</p>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">state \ read</th>
                {def.columns.map((sym) => (
                  <th key={sym} scope="col">
                    {sym}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {def.states.map((state) => (
                <tr key={state} className={cx(state === currentState && styles.current)}>
                  <th scope="row">
                    {state}
                    {state === def.start && (
                      <span className={cx(styles.tag, styles.start)}>start</span>
                    )}
                    {def.accept.has(state) && (
                      <span className={cx(styles.tag, styles.accept)}>accept</span>
                    )}
                    {def.reject.has(state) && (
                      <span className={cx(styles.tag, styles.reject)}>reject</span>
                    )}
                  </th>
                  {def.columns.map((sym) => {
                    const key = ruleKey(state, sym)
                    const rule = def.index.get(key)
                    if (!rule) {
                      return (
                        <td key={sym} className={styles.none}>
                          ·
                        </td>
                      )
                    }
                    return (
                      <td
                        key={sym}
                        title={`line ${rule.line}`}
                        className={cx(key === nextKey && styles.next)}
                      >
                        {rule.write} <span className={styles.move}>{moveName(rule.dir)}</span>{' '}
                        <span className={styles.target}>{rule.next}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
