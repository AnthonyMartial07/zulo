import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { canUndoLog, useHousehold } from '../lib/household'
import { tasksOfKind } from '../lib/rotation'
import type { Member, Task, TaskLog } from '../lib/types'
import Flag from '../components/Flag'

const STARTERS = 5

/** "Sacar lavavajillas" -> "LAV" (como REB, AST… en un boxscore). */
const abbr = (t: Task) =>
  (t.name.trim().split(/\s+/).pop() ?? t.name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .slice(0, 3)
    .toUpperCase()

/** "Álvaro Morata" -> "Á. Morata" */
const shortName = (m: Member) => {
  const parts = m.name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : m.name
}

/** Medallero del mes, con pinta de boxscore de ESPN. */
export default function Leaderboard() {
  const { me, members, tasks, memberById } = useHousehold()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)) // 'YYYY-MM'
  const [logs, setLogs] = useState<TaskLog[]>([])

  const daily = tasksOfKind(tasks, 'common')
  const isCurrentMonth = month === new Date().toISOString().slice(0, 7)
  const [y, m] = month.split('-').map(Number)
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  async function load() {
    const from = new Date(y, m - 1, 1).toISOString()
    const to = new Date(y, m, 1).toISOString()
    const { data } = await supabase
      .from('task_logs')
      .select('*')
      .is('week_start', null) // solo cotidianas; las semanales van en el calendario
      .gte('created_at', from)
      .lt('created_at', to)
      .order('created_at', { ascending: false })
    setLogs(data ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  async function addOne(taskId: string) {
    await supabase.from('task_logs').insert({ task_id: taskId, member_id: me.id })
    load()
  }

  async function undo(log: TaskLog) {
    if (!confirm('¿Quitar esta tarea del boxscore?')) return
    await supabase.from('task_logs').delete().eq('id', log.id)
    load()
  }

  const count = (memberId: string, taskId?: string) =>
    logs.filter((l) => l.member_id === memberId && (!taskId || l.task_id === taskId)).length

  const rows = members
    .filter((mb) => mb.active || count(mb.id) > 0)
    .map((mb) => ({ member: mb, perTask: daily.map((t) => count(mb.id, t.id)), total: count(mb.id) }))
    .sort((a, b) => b.total - a.total || a.member.name.localeCompare(b.member.name))

  const teamTotal = logs.length
  const teamPerTask = daily.map((t) => logs.filter((l) => l.task_id === t.id).length)
  const columnMax = teamPerTask.map((_, i) => Math.max(0, ...rows.map((r) => r.perTask[i])))
  const pct = (n: number) => (teamTotal ? `${Math.round((n / teamTotal) * 100)}` : '0')

  // "Líderes del partido": quien más ha hecho cada tarea.
  const leaders = daily.map((t, i) => {
    const best = rows.filter((r) => r.perTask[i] > 0 && r.perTask[i] === columnMax[i])
    return { task: t, value: columnMax[i], members: best.map((r) => r.member) }
  })

  const renderRow = ({ member, perTask, total }: (typeof rows)[number]) => (
    <tr key={member.id} className={member.id === me.id ? 'me' : ''}>
      <td className="player">
        <Flag country={member.country} />
        <span className="pname">{shortName(member)}</span>
      </td>
      {perTask.map((n, i) => (
        <td key={daily[i].id} className={n > 0 && n === columnMax[i] ? 'leader' : ''}>
          {n}
        </td>
      ))}
      <td className="tot">{total}</td>
      <td className="muted">{pct(total)}</td>
    </tr>
  )

  const head = (label: string) => (
    <tr className="section">
      <th className="player">{label}</th>
      {daily.map((t) => (
        <th key={t.id} title={t.name}>
          {abbr(t)}
        </th>
      ))}
      <th>TOT</th>
      <th title="Porcentaje del total del piso">%</th>
    </tr>
  )

  return (
    <section className="boxscore-page">
      <div className="row between">
        <h2>Boxscore</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>

      <div className="scoreboard">
        <div className="team">
          <img className="team-logo" src="/logo.svg" alt="" />
          <div>
            <div className="team-name">ZULO GITANO</div>
            <div className="team-sub">{rows.length} jugadores</div>
          </div>
        </div>
        <div className="score">{teamTotal}</div>
        <div className="status">
          {isCurrentMonth ? (
            <span className="live">
              <span className="live-dot" /> EN JUEGO
            </span>
          ) : (
            <span>FINAL</span>
          )}
          <div className="team-sub">{monthLabel}</div>
        </div>
      </div>

      {isCurrentMonth && (
        <div className="card">
          <h3>Acabo de…</h3>
          <div className="chips">
            {daily.map((t) => (
              <button key={t.id} className="big" onClick={() => addOne(t.id)}>
                {t.name} <b>+1</b>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="leaders">
        {leaders.map(({ task, value, members: ms }) => (
          <div key={task.id} className="leader-card">
            <div className="leader-label">{task.name}</div>
            {ms.length > 0 ? (
              <div className="leader-body">
                <div>
                  {ms.map((mb) => (
                    <div key={mb.id} className="player">
                      <Flag country={mb.country} />
                      <span className="pname">{shortName(mb)}</span>
                    </div>
                  ))}
                </div>
                <div className="leader-value">
                  {value} <span>{abbr(task)}</span>
                </div>
              </div>
            ) : (
              <div className="muted">Sin datos</div>
            )}
          </div>
        ))}
      </div>

      <div className="boxscore">
        <table>
          <tbody>
            {head('Titulares')}
            {rows.slice(0, STARTERS).map(renderRow)}
          </tbody>
          {rows.length > STARTERS && (
            <tbody>
              {head('Banquillo')}
              {rows.slice(STARTERS).map(renderRow)}
            </tbody>
          )}
          <tfoot>
            <tr>
              <td className="player">Equipo</td>
              {teamPerTask.map((n, i) => (
                <td key={daily[i].id}>{n}</td>
              ))}
              <td className="tot">{teamTotal}</td>
              <td />
            </tr>
          </tfoot>
        </table>
        <p className="legend">
          {daily.map((t) => `${abbr(t)}: ${t.name}`).join(' · ')} · TOT: total · %: parte del total del piso
        </p>
      </div>

      <div className="card">
        <h3>Jugada a jugada</h3>
        <ul>
          {logs.map((l) => {
            const mb = memberById(l.member_id)
            return (
              <li key={l.id}>
                {mb && <Flag country={mb.country} />}
                <span className="grow">
                  {mb?.name} — {tasks.find((t) => t.id === l.task_id)?.name}
                </span>
                <span className="muted">
                  {new Date(l.created_at).toLocaleString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {canUndoLog(l, me) && (
                  <button className="danger" onClick={() => undo(l)} title="Quitar">
                    ✕
                  </button>
                )}
              </li>
            )
          })}
          {logs.length === 0 && <li className="muted">Nada todavía este mes…</li>}
        </ul>
      </div>
    </section>
  )
}
