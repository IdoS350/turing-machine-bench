import type { ComponentProps } from 'react'
import { cx } from '../lib/cx'
import styles from './Button.module.css'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'default' | 'primary'
}

export function Button({ variant = 'default', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, variant === 'primary' && styles.primary, className)}
      {...props}
    />
  )
}
