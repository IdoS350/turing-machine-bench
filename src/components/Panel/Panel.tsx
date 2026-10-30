import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Panel.module.css'

interface PanelProps {
  title: string
  meta?: ReactNode
  actions?: ReactNode
  className?: string
  children?: ReactNode
}

export function Panel({ title, meta, actions, className, children }: PanelProps) {
  return (
    <section className={cx(styles.panel, className)} aria-label={title}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {meta && <span className={styles.meta}>{meta}</span>}
        {actions}
      </header>
      {children}
    </section>
  )
}
