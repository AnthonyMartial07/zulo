import type { Member, Task } from './types'

const DAY = 24 * 60 * 60 * 1000
// Lunes de referencia: esa semana le toca al compi con rotation_order más bajo (Álvaro).
const EPOCH_MONDAY = Date.UTC(2026, 9, 19)

/** Lunes (00:00 UTC) de la semana que contiene `date`. */
export function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dow = (d.getUTCDay() + 6) % 7 // 0 = lunes
  return new Date(d.getTime() - dow * DAY)
}

export function addWeeks(monday: Date, n: number): Date {
  return new Date(monday.getTime() + n * 7 * DAY)
}

/** 'YYYY-MM-DD', formato de la columna week_start. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function weekIndex(monday: Date): number {
  return Math.round((monday.getTime() - EPOCH_MONDAY) / (7 * DAY))
}

/** A quién le toca la checklist semanal esa semana: un compi por semana, por orden. */
export function personForWeek(monday: Date, members: Member[]): Member | undefined {
  const people = members
    .filter((m) => m.active)
    .sort((a, b) => a.rotation_order - b.rotation_order)
  if (people.length === 0) return undefined
  const w = weekIndex(monday)
  return people[((w % people.length) + people.length) % people.length]
}

/** Tareas activas de un tipo, en su orden. */
export function tasksOfKind(tasks: Task[], kind: Task['kind']): Task[] {
  return tasks.filter((t) => t.kind === kind && t.active).sort((a, b) => a.rotation_order - b.rotation_order)
}
