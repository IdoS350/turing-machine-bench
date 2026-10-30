import { Form } from '@base-ui/react/form'
import { Popover } from '@base-ui/react/popover'
import { memo, useMemo, useRef, useState } from 'react'
import { cx } from '../lib/cx'
import { moveName } from '../machine/machine'
import { BLANK, WILD, ruleKey, type Source } from '../machine/model'
import { draftDef } from '../machine/parser'
import { deleteRule, setRule, stateError, symbolError } from '../machine/programEdits'
import { Button } from './Button'
import { Field } from './Field'
import { Panel } from './Panel'
import popup from './Popup.module.css'
import { RuleEditor } from './RuleEditor'
import { TextInput } from './TextInput'
import styles from './TransitionTable.module.css'

const unique = (items: Iterable<string>) => [...new Set(items)]

interface Cell {
  state: string
  read: string
}

interface TransitionTableProps {
  source: Source
  /** Highlights for the running machine; null when the table shows unloaded edits. */
  currentState: string | null
  nextKey: string | null
  onProgramChange: (program: string) => void
}

export const TransitionTable = memo(function TransitionTable({
  source,
  currentState,
  nextKey,
  onProgramChange,
}: TransitionTableProps) {
  const { start, accept, reject, program } = source
  const def = useMemo(
    () => draftDef({ start, accept, reject, program }),
    [start, accept, reject, program],
  )
  // States and symbols added in the table but not used by any rule yet.
  const [extraStates, setExtraStates] = useState<string[]>([])
  const [extraSymbols, setExtraSymbols] = useState<string[]>([])
  // One popover shared by every cell; each trigger passes its cell as the payload.
  const [editor] = useState(() => Popover.createHandle<Cell>())
  const editorActions = useRef<Popover.Root.Actions>(null)
  const writeInput = useRef<HTMLInputElement>(null)

  const states = unique([...def.states, ...extraStates])
  const allSymbols = [...def.columns, ...extraSymbols]
  const columns = [
    ...unique(allSymbols).filter((s) => s !== BLANK && s !== WILD),
    BLANK,
    ...(allSymbols.includes(WILD) ? [WILD] : []),
  ]

  const commit = (nextProgram: string) => {
    onProgramChange(nextProgram)
    editorActions.current?.close()
  }

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
                  {columns.map((sym) => {
                    const key = ruleKey(state, sym)
                    const rule = def.index.get(key)
                    return (
                      <td key={sym} className={cx(key === nextKey && styles.next)}>
                        <Popover.Trigger
                          handle={editor}
                          payload={{ state, read: sym }}
                          className={styles.cell}
                          aria-label={
                            rule
                              ? `(${state}, ${sym}): write ${rule.write}, move ${moveName(rule.dir)}, go to ${rule.next}`
                              : `(${state}, ${sym}): no rule`
                          }
                        >
                          {rule ? (
                            <>
                              {rule.write} <span className={styles.move}>{moveName(rule.dir)}</span>{' '}
                              <span className={styles.target}>{rule.next}</span>
                            </>
                          ) : (
                            <span className={styles.none} />
                          )}
                        </Popover.Trigger>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Popover.Root handle={editor} actionsRef={editorActions}>
        {({ payload }) => (
          <Popover.Portal>
            {/* Extra room on the shadowed sides, where the arrow sits past the shadow. */}
            <Popover.Positioner
              sideOffset={({ side }) => (side === 'top' || side === 'left' ? 18 : 12)}
            >
              <Popover.Popup className={cx(popup.popup, styles.popover)} initialFocus={writeInput}>
                <Popover.Arrow className={popup.arrow} />
                {payload && (
                  <RuleEditor
                    key={ruleKey(payload.state, payload.read)}
                    state={payload.state}
                    read={payload.read}
                    rule={def.index.get(ruleKey(payload.state, payload.read))}
                    states={states}
                    symbols={unique([...columns, WILD])}
                    writeRef={writeInput}
                    onSave={(fields) =>
                      commit(setRule(program, payload.state, payload.read, fields))
                    }
                    onDelete={() => commit(deleteRule(program, payload.state, payload.read))}
                  />
                )}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>

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
})

interface AddFormProps {
  label: string
  placeholder: string
  validate: (value: string) => string | null
  onAdd: (value: string) => void
}

function AddForm({ label, placeholder, validate, onAdd }: AddFormProps) {
  // Bumped after each add to remount the form with a fresh, untouched field.
  const [round, setRound] = useState(0)

  return (
    <Form
      key={round}
      className={styles.add}
      onFormSubmit={(values) => {
        onAdd(String(values.value).trim())
        setRound((r) => r + 1)
      }}
    >
      <Field name="value" label={label} validate={(value) => validate(String(value ?? '').trim())}>
        <TextInput placeholder={placeholder} autoFocus={round > 0} />
      </Field>
      <Button type="submit" className={styles.addButton}>
        Add
      </Button>
    </Form>
  )
}
