import { useEffect, useState } from 'react'
import { EXAMPLES } from '@/machine/examples'
import type { Source } from '@/machine/model'
import { SPEEDS } from '@/session/MachineSession'

export interface Settings extends Source {
  input: string
  /** Index into SPEEDS. */
  speed: number
  stepN: number
}

const STORAGE_KEY = 'turing-bench:v1'
const TEXT_FIELDS = ['start', 'accept', 'reject', 'program', 'input'] as const

const [firstExample] = EXAMPLES
const DEFAULTS: Settings = {
  start: firstExample.start,
  accept: firstExample.accept,
  reject: firstExample.reject,
  program: firstExample.program,
  input: firstExample.input,
  speed: 3,
  stepN: 10,
}

function loadSettings(): Settings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!stored || typeof stored !== 'object') return DEFAULTS
    const raw = stored as Record<string, unknown>
    const settings = { ...DEFAULTS }
    for (const key of TEXT_FIELDS) {
      const value = raw[key]
      if (typeof value === 'string') settings[key] = value
    }
    const { speed, stepN } = raw
    if (
      typeof speed === 'number' &&
      Number.isInteger(speed) &&
      speed >= 0 &&
      speed < SPEEDS.length
    ) {
      settings.speed = speed
    }
    if (typeof stepN === 'number' && Number.isInteger(stepN) && stepN > 0) settings.stepN = stepN
    return settings
  } catch {
    return DEFAULTS
  }
}

export function usePersistentSettings() {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage may be unavailable (e.g. private mode); settings just won't persist.
    }
  }, [settings])

  return [settings, setSettings] as const
}
