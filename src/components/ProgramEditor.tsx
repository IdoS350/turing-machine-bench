import { Collapsible } from '@base-ui/react/collapsible'
import { memo, type KeyboardEvent } from 'react'
import type { Example } from '../machine/examples'
import type { ProgramError, Source } from '../machine/model'
import { Button } from './Button'
import { CodeEditor } from './CodeEditor'
import { ExampleMenu } from './ExampleMenu'
import { Field } from './Field'
import { Hint } from './Hint'
import { Panel } from './Panel'
import styles from './ProgramEditor.module.css'
import { TextInput } from './TextInput'

interface ProgramEditorProps {
  source: Source
  errors: readonly ProgramError[]
  dirty: boolean
  className?: string
  onChange: (patch: Partial<Source>) => void
  onLoad: (source: Source) => void
  onExample: (example: Example) => void
}

const STATE_FIELDS = [
  { key: 'start', label: 'Start state', placeholder: undefined },
  { key: 'accept', label: 'Accept states', placeholder: 'e.g. done, yes' },
  { key: 'reject', label: 'Reject states', placeholder: 'optional' },
] as const

export const ProgramEditor = memo(function ProgramEditor({
  source,
  errors,
  dirty,
  className,
  onChange,
  onLoad,
  onExample,
}: ProgramEditorProps) {
  const status = errors.length ? 'error' : dirty ? 'dirty' : 'ok'
  const load = () => onLoad(source)
  const loadOnEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      load()
    }
  }

  return (
    <Panel
      title="Program"
      className={className}
      actions={<ExampleMenu source={source} onSelect={onExample} />}
    >
      <div className={styles.config}>
        {STATE_FIELDS.map(({ key, label, placeholder }) => (
          <Field key={key} label={label}>
            <TextInput
              value={source[key]}
              placeholder={placeholder}
              onValueChange={(value) => onChange({ [key]: value })}
              onKeyDown={loadOnEnter}
            />
          </Field>
        ))}
      </div>

      <CodeEditor
        value={source.program}
        label="Transition rules"
        errorLines={new Set(errors.map((e) => e.line))}
        onChange={(program) => onChange({ program })}
        onSubmit={load}
      />

      {errors.length > 0 && (
        <ul className={styles.errors}>
          {errors.map((e) => (
            <li key={`${e.line}:${e.message}`}>
              {e.line > 0 && <b>line {e.line}: </b>}
              {e.message}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.footer}>
        <span className={styles.status} data-status={status}>
          {status === 'error'
            ? `${errors.length} error${errors.length === 1 ? '' : 's'}`
            : status === 'dirty'
              ? 'Edited: load to apply (resets the run)'
              : 'Loaded'}
        </span>
        <Hint label="Load machine" shortcut="⌘/Ctrl+Enter" keys="Meta+Enter Control+Enter">
          <Button variant="primary" onClick={load} disabled={errors.length > 0}>
            Load machine
          </Button>
        </Hint>
      </div>

      {SYNTAX_HELP}
    </Panel>
  )
})

const SYNTAX_HELP = (
  <Collapsible.Root className={styles.syntax}>
    <Collapsible.Trigger className={styles.syntaxTrigger}>
      <span className={styles.chevron} aria-hidden="true">
        ▸
      </span>
      Syntax
    </Collapsible.Trigger>
    <Collapsible.Panel className={styles.syntaxPanel}>
      <p>
        One rule per line: <code>state read write move next</code>
      </p>
      <ul>
        <li>
          <code>_</code> is the blank symbol. Symbols are single characters; spaces in the input
          become blanks.
        </li>
        <li>
          <code>move</code> is <code>L</code>, <code>R</code>, or <code>S</code> (stay).
        </li>
        <li>
          <code>*</code> as <em>read</em> matches any symbol without a more specific rule; as{' '}
          <em>write</em> leaves the cell unchanged; as <em>next</em> keeps the current state.
        </li>
        <li>
          Comments start with <code>;</code>. Arrows and commas are ignored, so{' '}
          <code>q0, 1 -&gt; 0, R, q1</code> works too.
        </li>
        <li>
          The machine halts on entering an accept/reject state, or when no rule applies (an implicit
          reject when accept states are defined).
        </li>
      </ul>
    </Collapsible.Panel>
  </Collapsible.Root>
)
