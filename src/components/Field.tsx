import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import styles from './Field.module.css'

interface FieldProps {
  label: ReactNode
  className?: string
  children: ReactNode
}

export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={cx(styles.field, className)}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  )
}
