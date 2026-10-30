import { useRef } from 'react'
import styles from './CodeEditor.module.css'

interface CodeEditorProps {
  value: string
  label: string
  errorLines: ReadonlySet<number>
  onChange: (value: string) => void
  onSubmit: () => void
}

export function CodeEditor({ value, label, errorLines, onChange, onSubmit }: CodeEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null)
  const lineCount = value.split('\n').length

  return (
    <div className={styles.editor}>
      <div ref={gutterRef} className={styles.gutter} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className={errorLines.has(i + 1) ? styles.error : undefined}>
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        className={styles.textarea}
        value={value}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        wrap="off"
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onSubmit()
          }
        }}
      />
    </div>
  )
}
