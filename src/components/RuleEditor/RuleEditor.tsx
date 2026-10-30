import { Fieldset } from '@base-ui/react/fieldset'
import { Form } from '@base-ui/react/form'
import { Popover } from '@base-ui/react/popover'
import { Select } from '@base-ui/react/select'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { useId, useState, type Ref } from 'react'
import { Button } from '@/components/Button/Button'
import { Field } from '@/components/Field/Field'
import { TextInput } from '@/components/TextInput/TextInput'
import { cx } from '@/lib/cx'
import { moveName } from '@/machine/machine'
import { WILD, type MoveName, type Rule } from '@/machine/model'
import { symbolError, type RuleFields } from '@/machine/programEdits'
import popup from '@/styles/popup.module.css'
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
  /** The only valid targets; new states are added from the table, not here. */
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
  const [next, setNext] = useState(rule?.next ?? state)
  const nextOptions = [
    ...states.map((s) => ({ value: s, label: s })),
    { value: WILD, label: '* (same state)' },
  ]

  return (
    <Form
      className={styles.editor}
      onFormSubmit={(values) => onSave({ write: String(values.write).trim(), move, next })}
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

        <Select.Root
          items={nextOptions}
          value={next}
          onValueChange={(value) => {
            if (value !== null) setNext(value)
          }}
        >
          <div className={styles.next}>
            <Select.Label className={styles.selectLabel}>Next state</Select.Label>
            <Select.Trigger className={styles.select}>
              <Select.Value className={styles.selectValue} />
              <Select.Icon className={styles.selectIcon}>▾</Select.Icon>
            </Select.Trigger>
          </div>
          <Select.Portal>
            <Select.Positioner sideOffset={4} alignItemWithTrigger={false}>
              <Select.Popup className={cx(popup.popup, styles.selectPopup)}>
                <Select.List className={styles.selectList}>
                  {nextOptions.map(({ value, label }) => (
                    <Select.Item key={value} value={value} className={styles.option}>
                      <Select.ItemIndicator className={styles.optionCheck}>✓</Select.ItemIndicator>
                      <Select.ItemText className={styles.optionText}>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>

      <datalist id={`${id}-symbols`}>
        {symbols.map((s) => (
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
        Writing <code>*</code> keeps the symbol. Add new states below the table.
      </p>
    </Form>
  )
}
