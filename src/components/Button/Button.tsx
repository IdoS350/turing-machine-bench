import { Button as BaseButton } from '@base-ui/react/button'
import { cx } from '@/lib/cx'
import styles from './Button.module.css'

interface ButtonProps extends Omit<BaseButton.Props, 'className'> {
  variant?: 'default' | 'primary'
  className?: string
}

// Disabled buttons stay focusable so their tooltips and keyboard focus survive state changes.
// Defaults live in the body: React Compiler can't yet compile defaults in destructured props.
export function Button({ variant, className, type, focusableWhenDisabled, ...props }: ButtonProps) {
  return (
    <BaseButton
      type={type ?? 'button'}
      focusableWhenDisabled={focusableWhenDisabled ?? true}
      className={cx(styles.button, variant === 'primary' && styles.primary, className)}
      {...props}
    />
  )
}
