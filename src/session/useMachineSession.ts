import { useEffect, useState, useSyncExternalStore } from 'react'
import type { MachineDef } from '@/machine/model'
import { MachineSession } from '@/session/MachineSession'

export function useMachineSession(def: MachineDef | null, input: string, rate: number) {
  const [session] = useState(() => new MachineSession(def, input, rate))
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  useEffect(() => session.dispose, [session])
  return [session, snapshot] as const
}
