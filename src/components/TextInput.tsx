import { Input } from '@base-ui/react/input'
import type { Ref } from 'react'
import { cx } from '../lib/cx'
import styles from './TextInput.module.css'

interface TextInputProps extends Omit<Input.Props, 'className'> {
  className?: string
  ref?: Ref<HTMLInputElement>
}

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <Input
      className={cx(styles.input, className)}
      spellCheck={false}
      autoComplete="off"
      {...props}
    />
  )
}
