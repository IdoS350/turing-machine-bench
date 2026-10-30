import { useEffect, useEffectEvent } from 'react'
import type { MachineSession } from '../session/MachineSession'

const IGNORED_TARGETS =
  'input, textarea, select, [role="dialog"], [role="alertdialog"], [role="menu"]'

export function useKeyboardShortcuts(session: MachineSession, stepN: number) {
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const target = e.target instanceof Element ? e.target : null
    // Popups use arrow keys for their own navigation (e.g. the Move toggle group).
    if (target?.closest(IGNORED_TARGETS)) return
    // Buttons handle their own Space activation.
    if (e.key === ' ' && target?.closest('button')) return

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        if (e.shiftKey) session.forward(stepN)
        else session.next()
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (e.shiftKey) session.back(stepN)
        else session.prev()
        break
      case ' ':
        e.preventDefault()
        session.togglePlay()
        break
      case 'r':
      case 'R':
        session.reset()
        break
    }
  })

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyDown(e)
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [])
}
