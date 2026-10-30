import { memo, type KeyboardEvent } from 'react'
import { EXAMPLES, isExampleSource, type Example } from '../machine/examples'
import type { ProgramError, Source } from '../machine/model'
import { Button } from './Button'
import { CodeEditor } from './CodeEditor'
import { Field } from './Field'
import { Panel } from './Panel'
import styles from './ProgramEditor.module.css'

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
      actions={
        <select
          value=""
          aria-label="Load an example"
          onChange={(e) => {
            const example = EXAMPLES[Number(e.target.value)]
            if (!example) return
            if (
              isExampleSource(source) ||
              confirm('Replace your current program with this example?')
            ) {
              onExample(example)
            }
          }}
        >
          <option value="" disabled>
            Load example…
          </option>
          {EXAMPLES.map((ex, i) => (
            <option key={ex.name} value={i}>
              {ex.name}
            </option>
          ))}
        </select>
      }
    >
      <div className={styles.config}>
        {STATE_FIELDS.map(({ key, label, placeholder }) => (
          <Field key={key} label={label}>
            <input
              type="text"
              value={source[key]}
              placeholder={placeholder}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => onChange({ [key]: e.target.value })}
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
        <Button
          variant="primary"
          onClick={load}
          disabled={errors.length > 0}
          title="Load machine (⌘/Ctrl+Enter)"
        >
          Load machine
        </Button>
      </div>

      {SYNTAX_HELP}
    </Panel>
  )
})

const SYNTAX_HELP = (
  <details className={styles.syntax}>
    <summary>Syntax</summary>
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
  </details>
)
