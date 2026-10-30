import { useId, useState, type FormEvent } from 'react'
import { moveName } from '../machine/machine'
import { WILD, type MoveName, type Rule } from '../machine/model'
import { stateError, symbolError, type RuleFields } from '../machine/programEdits'
import { Button } from './Button'
import { Field } from './Field'
import styles from './RuleEditor.module.css'

const MOVE_OPTIONS: readonly MoveName[] = ['L', 'S', 'R']

interface RuleEditorProps {
  state: string
  read: string
  rule: Rule | undefined
  states: readonly string[]
  symbols: readonly string[]
  onSave: (fields: RuleFields) => void
  onDelete: () => void
  onCancel: () => void
}

export function RuleEditor({
  state,
  read,
  rule,
  states,
  symbols,
  onSave,
  onDelete,
  onCancel,
}: RuleEditorProps) {
  const id = useId()
  const [write, setWrite] = useState(rule?.write ?? read)
  const [move, setMove] = useState<MoveName>(rule ? moveName(rule.dir) : 'R')
  const [next, setNext] = useState(rule?.next ?? state)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const fields = { write: write.trim(), move, next: next.trim() }
    const problem =
      symbolError(fields.write) ?? (fields.next === WILD ? null : stateError(fields.next))
    if (problem) setError(problem)
    else onSave(fields)
  }

  return (
    <form
      className={styles.editor}
      aria-label={`Rule for (${state}, ${read})`}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
    >
      <p className={styles.heading}>
        δ(<b>{state}</b>, <b>{read}</b>)
        <span className={styles.meta}>{rule ? `line ${rule.line}` : 'new rule'}</span>
      </p>

      <div className={styles.fields}>
        <Field label="Write" className={styles.write}>
          <input
            type="text"
            value={write}
            list={`${id}-symbols`}
            spellCheck={false}
            autoComplete="off"
            autoFocus
            onChange={(e) => {
              setWrite(e.target.value)
              setError(null)
            }}
          />
        </Field>

        <fieldset className={styles.moves}>
          <legend>Move</legend>
          {MOVE_OPTIONS.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={`${id}-move`}
                value={option}
                checked={move === option}
                onChange={() => setMove(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>

        <Field label="Next state" className={styles.next}>
          <input
            type="text"
            value={next}
            list={`${id}-states`}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => {
              setNext(e.target.value)
              setError(null)
            }}
          />
        </Field>
      </div>

      <datalist id={`${id}-symbols`}>
        {symbols.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id={`${id}-states`}>
        {states.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          {rule ? 'Update rule' : 'Add rule'}
        </Button>
        {rule && <Button onClick={onDelete}>Delete</Button>}
        <Button onClick={onCancel}>Cancel</Button>
        <span className={styles.hint}>
          <code>*</code> keeps the symbol / state
        </span>
      </div>
    </form>
  )
}
