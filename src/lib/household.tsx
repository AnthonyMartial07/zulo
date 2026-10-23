import { createContext, useContext } from 'react'
import type { Member, Task, TaskLog } from './types'

/** Ventana en la que un no-admin puede deshacer una tarea suya (igual que la política RLS). */
const UNDO_WINDOW_MS = 24 * 60 * 60 * 1000

export function canUndoLog(log: TaskLog, me: Member): boolean {
  if (me.is_admin) return true
  return log.member_id === me.id && Date.now() - new Date(log.created_at).getTime() < UNDO_WINDOW_MS
}

/** Datos que casi todas las páginas necesitan: quién soy, los compis y las tareas. */
export type Household = {
  me: Member
  members: Member[]
  tasks: Task[]
  memberById: (id: string | null) => Member | undefined
  /** Vuelve a cargar compis y tareas (tras editarlos en Ajustes). */
  reload: () => Promise<void>
}

export const HouseholdContext = createContext<Household | null>(null)

export function useHousehold(): Household {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold fuera de HouseholdContext')
  return ctx
}
