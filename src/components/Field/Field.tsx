import { Field as BaseField } from '@base-ui/react/field'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Field.module.css'

interface FieldProps extends Pick<BaseField.Root.Props, 'name' | 'validate'> {
  label: ReactNode
  className?: string
  children: ReactNode
}

/** Labels a Base UI control (Input, NumberField, …) and shows its validation error. */
export function Field({ label, className, children, ...rootProps }: FieldProps) {
  return (
    <BaseField.Root className={cx(styles.field, className)} {...rootProps}>
      <BaseField.Label className={styles.label}>{label}</BaseField.Label>
      {children}
      <BaseField.Error className={styles.error} />
    </BaseField.Root>
  )
}
