import { useEffect, useState, useSyncExternalStore } from 'react'
import type { MachineSession } from './MachineSession'

export function useMachineSession(create: () => MachineSession) {
  const [session] = useState(create)
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  useEffect(() => session.dispose, [session])
  return [session, snapshot] as const
}
