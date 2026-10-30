import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Menu } from '@base-ui/react/menu'
import { useState } from 'react'
import { cx } from '../lib/cx'
import { EXAMPLES, isExampleSource, type Example } from '../machine/examples'
import type { Source } from '../machine/model'
import { Button } from './Button'
import styles from './ExampleMenu.module.css'
import popup from './Popup.module.css'

interface ExampleMenuProps {
  source: Source
  onSelect: (example: Example) => void
}

export function ExampleMenu({ source, onSelect }: ExampleMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Kept after closing so the dialog text doesn't change during its exit animation.
  const [pending, setPending] = useState<Example | null>(null)

  const choose = (example: Example) => {
    if (isExampleSource(source)) {
      onSelect(example)
      return
    }
    setPending(example)
    setConfirmOpen(true)
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger render={<Button />}>Load example ▾</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="end">
            <Menu.Popup className={cx(popup.popup, styles.menu)}>
              {EXAMPLES.map((example) => (
                <Menu.Item
                  key={example.name}
                  className={styles.item}
                  onClick={() => choose(example)}
                >
                  {example.name}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={styles.backdrop} />
          <AlertDialog.Popup className={cx(popup.popup, styles.dialog)}>
            <AlertDialog.Title className={styles.title}>Replace your program?</AlertDialog.Title>
            <AlertDialog.Description className={styles.description}>
              Loading “{pending?.name}” discards your current program and resets the run.
            </AlertDialog.Description>
            <div className={styles.actions}>
              <AlertDialog.Close render={<Button />}>Cancel</AlertDialog.Close>
              <AlertDialog.Close
                render={<Button variant="primary" />}
                onClick={() => {
                  if (pending) onSelect(pending)
                }}
              >
                Replace
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  )
}
