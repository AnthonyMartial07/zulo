import { addWeeks, mondayOf } from '../lib/rotation'
import type { Fine, Member } from '../lib/types'
import Crest from './Crest'

const FORM_WEEKS = 5
const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`

/**
 * Clasificación de multas estilo La Liga: cada compi es un equipo.
 * Arriba el más multado. "Forma" = últimas 5 semanas (V = semana limpia, D = multado).
 */
export default function LeagueTable({ members, fines }: { members: Member[]; fines: Fine[] }) {
  const thisMonday = mondayOf(new Date())
  const weeks = Array.from({ length: FORM_WEEKS }, (_, i) => addWeeks(thisMonday, i - FORM_WEEKS + 1))

  const rows = members
    .filter((m) => m.active || fines.some((f) => f.member_id === m.id))
    .map((m) => {
      const mine = fines.filter((f) => f.member_id === m.id)
      const sum = (list: Fine[]) => list.reduce((s, f) => s + Number(f.amount), 0)
      const form = weeks.map((monday) => {
        const end = addWeeks(monday, 1)
        return mine.some((f) => {
          const t = mondayOf(new Date(f.created_at)).getTime()
          return t >= monday.getTime() && t < end.getTime()
        })
      })
      return {
        member: m,
        count: mine.length,
        week: sum(mine.filter((f) => mondayOf(new Date(f.created_at)).getTime() === thisMonday.getTime())),
        total: sum(mine),
        form,
      }
    })
    .sort((a, b) => b.total - a.total || b.count - a.count || a.member.name.localeCompare(b.member.name))

  const zone = (i: number) => (i < 2 ? 'ucl' : i === 2 ? 'uel' : i === rows.length - 1 ? 'down' : '')

  return (
    <div className="liga">
      <div className="liga-head">
        <span className="liga-logo">LALIGA</span>
        <span className="liga-title">ZULO</span>
        <span className="liga-season">Clasificación de multas</span>
      </div>
      <div className="liga-scroll">
        <table>
          <thead>
            <tr>
              <th className="pos">#</th>
              <th className="team">Equipo</th>
              <th title="Multas recibidas">MUL</th>
              <th title="Multado esta semana">SEM</th>
              <th className="hide-sm">Forma</th>
              <th title="Total en euros">PTS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.member.id}>
                <td className={`pos ${zone(i)}`}>{i + 1}</td>
                <td className="team">
                  <Crest club={r.member.club} size={26} />
                  <span>{r.member.name.split(' ')[0]}</span>
                </td>
                <td>{r.count}</td>
                <td className={r.week > 0 ? 'owes' : ''}>{euros(r.week)}</td>
                <td className="hide-sm">
                  <span className="form">
                    {r.form.map((fined, k) => (
                      <span key={k} className={fined ? 'L' : 'W'} title={fined ? 'Multado esa semana' : 'Semana limpia'}>
                        {fined ? 'D' : 'V'}
                      </span>
                    ))}
                  </span>
                </td>
                <td className="pts">{euros(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="liga-legend">
        <span>
          <i className="ucl" /> Champions de la guarrería
        </span>
        <span>
          <i className="uel" /> Europa League
        </span>
        <span>
          <i className="down" /> Descenso (el más limpio)
        </span>
      </div>
    </div>
  )
}
