import { useLayoutEffect, useRef, useState } from 'react'
import { cx } from '../lib/cx'
import { BLANK } from '../machine/model'
import type { MachineView, Motion } from '../session/MachineSession'
import styles from './Tape.module.css'

const FALLBACK_CELL_SIZE = 56
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

const cellSize = (el: Element) =>
  Number.parseFloat(getComputedStyle(el).getPropertyValue('--cell')) || FALLBACK_CELL_SIZE

interface TapeProps {
  machine: MachineView | null
  motion: Motion | null
}

export function Tape({ machine, motion }: TapeProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState({ width: 0, cell: FALLBACK_CELL_SIZE })

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => setLayout({ width: el.clientWidth, cell: cellSize(el) })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const head = machine?.head
  useLayoutEffect(() => {
    const strip = stripRef.current
    if (!motion || !strip || head === undefined || head === motion.from) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Start with the previous head cell centered, then slide the tape under the head.
    const dx = (head - motion.from) * cellSize(strip)
    strip.animate(
      [{ transform: `translateX(calc(-50% + ${dx}px))` }, { transform: 'translateX(-50%)' }],
      { duration: motion.duration, easing: EASE_OUT },
    )
  }, [motion, head])

  const cells = []
  if (machine) {
    const radius = Math.ceil(layout.width / layout.cell / 2) + 2
    for (let i = machine.head - radius; i <= machine.head + radius; i++) {
      const sym = machine.cells.get(i)
      const touched = i === motion?.touched
      cells.push(
        <div
          // A fresh key restarts the highlight animation on every write to this cell.
          key={touched ? `${i}@${machine.step}` : i}
          className={cx(
            styles.cell,
            i === machine.head && styles.head,
            sym === undefined && styles.blank,
            touched && styles.touched,
          )}
        >
          <span className={styles.sym}>{sym ?? BLANK}</span>
          <span className={styles.index}>{i}</span>
        </div>,
      )
    }
  }

  return (
    <div ref={viewportRef} className={styles.tape} data-verdict={machine?.halt?.verdict}>
      <div className={styles.marker} aria-hidden="true">
        <span>{machine?.state ?? '—'}</span>
      </div>
      <div ref={stripRef} className={styles.strip}>
        {cells}
      </div>
    </div>
  )
}
