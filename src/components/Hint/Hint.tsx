import { Tooltip } from '@base-ui/react/tooltip'
import type { ReactElement } from 'react'
import styles from './Hint.module.css'

interface HintProps {
  label: string
  /** Shortcut as shown to sighted users, e.g. "Shift+→". */
  shortcut?: string
  /** `aria-keyshortcuts` value, e.g. "Shift+ArrowRight". */
  keys?: string
  /** The trigger element; must accept a ref and spread props (e.g. Button). */
  children: ReactElement
}

export function Hint({ label, shortcut, keys, children }: HintProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} aria-keyshortcuts={keys} />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup className={styles.hint}>
            {label}
            {shortcut && <kbd className={styles.kbd}>{shortcut}</kbd>}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
