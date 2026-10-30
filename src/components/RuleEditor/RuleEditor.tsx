import { Fieldset } from '@base-ui/react/fieldset'
import { Form } from '@base-ui/react/form'
import { Popover } from '@base-ui/react/popover'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { useId, useState, type Ref } from 'react'
import { Button } from '@/components/Button/Button'
import { Field } from '@/components/Field/Field'
import { TextInput } from '@/components/TextInput/TextInput'
import { moveName } from '@/machine/machine'
import { WILD, type MoveName, type Rule } from '@/machine/model'
import { stateError, symbolError, type RuleFields } from '@/machine/programEdits'
import styles from './RuleEditor.module.css'

const MOVE_OPTIONS = [
  { value: 'L', label: 'Left' },
  { value: 'S', label: 'Stay' },
  { value: 'R', label: 'Right' },
] as const satisfies readonly { value: MoveName; label: string }[]

const isMoveName = (value: string | undefined): value is MoveName =>
  MOVE_OPTIONS.some((option) => option.value === value)

interface RuleEditorProps {
  state: string
  read: string
  rule: Rule | undefined
  states: readonly string[]
  symbols: readonly string[]
  /** Receives the first input so the popover can focus it on open. */
  writeRef: Ref<HTMLInputElement>
  onSave: (fields: RuleFields) => void
  onDelete: () => void
}

export function RuleEditor({
  state,
  read,
  rule,
  states,
  symbols,
  writeRef,
  onSave,
  onDelete,
}: RuleEditorProps) {
  const id = useId()
  const [move, setMove] = useState<MoveName>(rule ? moveName(rule.dir) : 'R')

  return (
    <Form
      className={styles.editor}
      onFormSubmit={(values) =>
        onSave({ write: String(values.write).trim(), move, next: String(values.next).trim() })
      }
    >
      <Popover.Title className={styles.heading}>
        δ(<b>{state}</b>, <b>{read}</b>)
        <span className={styles.meta}>{rule ? `line ${rule.line}` : 'new rule'}</span>
      </Popover.Title>

      <div className={styles.fields}>
        <Field
          name="write"
          label="Write"
          className={styles.write}
          validate={(value) => symbolError(String(value).trim())}
        >
          <TextInput ref={writeRef} defaultValue={rule?.write ?? read} list={`${id}-symbols`} />
        </Field>

        <Fieldset.Root
          className={styles.moves}
          render={
            <ToggleGroup
              value={[move]}
              onValueChange={([value]) => {
                if (isMoveName(value)) setMove(value)
              }}
            />
          }
        >
          <Fieldset.Legend className={styles.movesLegend}>Move</Fieldset.Legend>
          {MOVE_OPTIONS.map(({ value, label }) => (
            <Toggle key={value} value={value} aria-label={label} className={styles.move}>
              {value}
            </Toggle>
          ))}
        </Fieldset.Root>

        <Field
          name="next"
          label="Next state"
          className={styles.next}
          validate={(value) => {
            const next = String(value).trim()
            return next === WILD ? null : stateError(next)
          }}
        >
          <TextInput defaultValue={rule?.next ?? state} list={`${id}-states`} />
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

      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          {rule ? 'Update rule' : 'Add rule'}
        </Button>
        {rule && <Button onClick={onDelete}>Delete</Button>}
        <Popover.Close render={<Button />}>Cancel</Popover.Close>
      </div>
      <p className={styles.hint}>
        <code>*</code> keeps the symbol / state
      </p>
    </Form>
  )
}
