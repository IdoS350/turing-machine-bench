import { Button as BaseButton } from '@base-ui/react/button'
import { cx } from '@/lib/cx'
import styles from './Button.module.css'

interface ButtonProps extends Omit<BaseButton.Props, 'className'> {
  variant?: 'default' | 'primary'
  className?: string
}

// Disabled buttons stay focusable so their tooltips and keyboard focus survive state changes.
export function Button({
  variant = 'default',
  className,
  type = 'button',
  focusableWhenDisabled = true,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      focusableWhenDisabled={focusableWhenDisabled}
      className={cx(styles.button, variant === 'primary' && styles.primary, className)}
      {...props}
    />
  )
}
