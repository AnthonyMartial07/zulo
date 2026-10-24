import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { canUndoLog, useHousehold } from '../lib/household'
import { addWeeks, isoDate, mondayOf, personForWeek, tasksOfKind } from '../lib/rotation'
import type { TaskLog } from '../lib/types'
import PlayerCard from '../components/PlayerCard'

const WEEKS_SHOWN = 4

export default function Calendar() {
  const { me, members, tasks } = useHousehold()
  const [offset, setOffset] = useState(0)
  const [logs, setLogs] = useState<TaskLog[]>([])

  const thisMonday = mondayOf(new Date())
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => addWeeks(thisMonday, offset + i))
  const checklist = tasksOfKind(tasks, 'weekly')

  async function loadLogs() {
    const { data } = await supabase
      .from('task_logs')
      .select('*')
      .gte('week_start', isoDate(weeks[0]))
      .lte('week_start', isoDate(weeks[weeks.length - 1]))
    setLogs(data ?? [])
  }

  useEffect(() => {
    loadLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset])

  async function toggle(taskId: string, memberId: string, weekStart: string, existing?: TaskLog) {
    if (existing) {
      await supabase.from('task_logs').delete().eq('id', existing.id)
    } else {
      await supabase.from('task_logs').insert({ task_id: taskId, member_id: memberId, week_start: weekStart })
    }
    loadLogs()
  }

  return (
    <section>
      <div className="row between">
        <h2>Calendario de tareas</h2>
        <div className="row">
          <button onClick={() => setOffset(offset - 1)}>←</button>
          <button onClick={() => setOffset(0)}>Hoy</button>
          <button onClick={() => setOffset(offset + 1)}>→</button>
        </div>
      </div>

      <div className="weeks">
        {weeks.map((monday) => {
          const week = isoDate(monday)
          const isCurrent = week === isoDate(thisMonday)
          const person = personForWeek(monday, members)
          if (!person) return null
          const weekLogs = logs.filter((l) => l.week_start === week)
          const doneCount = checklist.filter((t) => weekLogs.some((l) => l.task_id === t.id)).length
          const mine = person.id === me.id

          return (
            <div key={week} className={`card week ${isCurrent ? 'current' : ''}`}>
              <h3 className="row">
                Semana del {monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                {isCurrent && <span className="live-dot" title="Esta semana" />}
              </h3>
              <PlayerCard member={person} />
              <p className="week-caption">
                {mine ? 'Te toca a ti' : person.name.split(' ')[0]} ·{' '}
                <span className={doneCount === checklist.length ? 'complete' : 'muted'}>
                  {doneCount}/{checklist.length}
                </span>
              </p>
              <ul>
                {checklist.map((task) => {
                  const log = weekLogs.find((l) => l.task_id === task.id)
                  // Marcar: solo a quien le toca (o el admin). Desmarcar: ver canUndoLog.
                  const editable = log ? canUndoLog(log, me) : mine || me.is_admin
                  return (
                    <li key={task.id} className={log ? 'done' : ''}>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={Boolean(log)}
                          disabled={!editable}
                          onChange={() => toggle(task.id, person.id, week, log)}
                        />
                        <b>{task.name}</b>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
