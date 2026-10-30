import { useMemo, useState, type FormEvent } from 'react'
import { cx } from '../lib/cx'
import { moveName } from '../machine/machine'
import { BLANK, WILD, ruleKey, type Source } from '../machine/model'
import { draftDef } from '../machine/parser'
import { deleteRule, setRule, stateError, symbolError } from '../machine/programEdits'
import type { MachineView } from '../session/MachineSession'
import { Button } from './Button'
import { Field } from './Field'
import { Panel } from './Panel'
import { RuleEditor } from './RuleEditor'
import styles from './TransitionTable.module.css'

const unique = (items: Iterable<string>) => [...new Set(items)]

interface TransitionTableProps {
  source: Source
  /** Running machine to highlight, or null when the table shows unloaded edits. */
  machine: MachineView | null
  onProgramChange: (program: string) => void
}

export function TransitionTable({ source, machine, onProgramChange }: TransitionTableProps) {
  const { start, accept, reject, program } = source
  const def = useMemo(
    () => draftDef({ start, accept, reject, program }),
    [start, accept, reject, program],
  )
  // States and symbols added in the table but not used by any rule yet.
  const [extraStates, setExtraStates] = useState<string[]>([])
  const [extraSymbols, setExtraSymbols] = useState<string[]>([])
  const [selected, setSelected] = useState<{ state: string; read: string } | null>(null)

  const states = unique([...def.states, ...extraStates])
  const allSymbols = [...def.columns, ...extraSymbols]
  const columns = [
    ...unique(allSymbols).filter((s) => s !== BLANK && s !== WILD),
    BLANK,
    ...(allSymbols.includes(WILD) ? [WILD] : []),
  ]
  const next = machine?.next
  const nextKey = next && ruleKey(next.rule.state, next.rule.read)
  const selectedKey = selected && ruleKey(selected.state, selected.read)

  return (
    <Panel title="Transition table" meta="click a cell to edit">
      {states.length === 0 ? (
        <p className={styles.empty}>Set a start state or add a state below to begin.</p>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">state \ read</th>
                {columns.map((sym) => (
                  <th key={sym} scope="col">
                    {sym}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {states.map((state) => (
                <tr key={state} className={cx(state === machine?.state && styles.current)}>
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
                  {columns.map((sym) => {
                    const key = ruleKey(state, sym)
                    const rule = def.index.get(key)
                    const isSelected = key === selectedKey
                    return (
                      <td
                        key={sym}
                        className={cx(
                          key === nextKey && styles.next,
                          isSelected && styles.selected,
                        )}
                      >
                        <button
                          type="button"
                          className={styles.cell}
                          aria-pressed={isSelected}
                          aria-label={
                            rule
                              ? `(${state}, ${sym}): write ${rule.write}, move ${moveName(rule.dir)}, go to ${rule.next}`
                              : `(${state}, ${sym}): no rule`
                          }
                          title={rule ? `line ${rule.line}` : 'Add a rule'}
                          onClick={() => setSelected(isSelected ? null : { state, read: sym })}
                        >
                          {rule ? (
                            <>
                              {rule.write} <span className={styles.move}>{moveName(rule.dir)}</span>{' '}
                              <span className={styles.target}>{rule.next}</span>
                            </>
                          ) : (
                            <span className={styles.none} />
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <RuleEditor
          key={selectedKey}
          state={selected.state}
          read={selected.read}
          rule={def.index.get(ruleKey(selected.state, selected.read))}
          states={states}
          symbols={unique([...columns, WILD])}
          onSave={(fields) => {
            onProgramChange(setRule(program, selected.state, selected.read, fields))
            setSelected(null)
          }}
          onDelete={() => {
            onProgramChange(deleteRule(program, selected.state, selected.read))
            setSelected(null)
          }}
          onCancel={() => setSelected(null)}
        />
      )}

      <div className={styles.adders}>
        <AddForm
          label="Add state"
          placeholder="e.g. q2"
          validate={(name) =>
            stateError(name) ?? (states.includes(name) ? 'State already exists' : null)
          }
          onAdd={(name) => setExtraStates((list) => [...list, name])}
        />
        <AddForm
          label="Add symbol"
          placeholder="e.g. x"
          validate={(sym) =>
            symbolError(sym) ?? (columns.includes(sym) ? 'Symbol already has a column' : null)
          }
          onAdd={(sym) => setExtraSymbols((list) => [...list, sym])}
        />
      </div>
    </Panel>
  )
}

interface AddFormProps {
  label: string
  placeholder: string
  validate: (value: string) => string | null
  onAdd: (value: string) => void
}

function AddForm({ label, placeholder, validate, onAdd }: AddFormProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    const problem = validate(trimmed)
    if (problem) {
      setError(problem)
      return
    }
    onAdd(trimmed)
    setValue('')
    setError(null)
  }

  return (
    <form className={styles.add} onSubmit={submit}>
      <Field label={label}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error !== null}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
        />
      </Field>
      <Button type="submit">Add</Button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </form>
  )
}
