import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/household'
import type { Fine, FineType } from '../lib/types'
import LeagueTable from '../components/LeagueTable'
import { mondayOf } from '../lib/rotation'

const euros = (n: number) => `${Number(n).toFixed(2).replace('.', ',')} €`

export default function Fines() {
  const { me, members, memberById } = useHousehold()
  const [fines, setFines] = useState<Fine[]>([])
  const [types, setTypes] = useState<FineType[]>([])

  const [memberId, setMemberId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [reason, setReason] = useState('')

  async function load() {
    const [f, t] = await Promise.all([
      supabase.from('fines').select('*').order('created_at', { ascending: false }),
      supabase.from('fine_types').select('*').order('name'),
    ])
    setFines(f.data ?? [])
    setTypes(t.data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const selectedType = types.find((t) => t.id === typeId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedType) return
    // El importe es siempre el del tipo de multa (la base de datos también lo exige).
    await supabase.from('fines').insert({
      member_id: memberId,
      fine_type_id: selectedType.id,
      amount: selectedType.amount,
      reason: reason || null,
      issued_by: me.id,
    })
    setMemberId('')
    setTypeId('')
    setReason('')
    load()
  }

  async function remove(fine: Fine) {
    if (!confirm('¿Borrar esta multa?')) return
    await supabase.from('fines').delete().eq('id', fine.id)
    load()
  }

  // Las multas no se pagan sobre la marcha: se acumulan hasta el final de la convivencia.
  const sum = (list: Fine[]) => list.reduce((s, f) => s + Number(f.amount), 0)
  const thisMonday = mondayOf(new Date()).getTime()
  const hucha = sum(fines)
  const thisWeek = sum(fines.filter((f) => mondayOf(new Date(f.created_at)).getTime() === thisMonday))

  return (
    <section>
      <h2>Multas</h2>

      <LeagueTable members={members} fines={fines} />

      <div className="grid2">
        <form className="card stack" onSubmit={submit}>
          <h3>Poner multa</h3>
          <select required value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">¿A quién?</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select required value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            <option value="">Motivo…</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({euros(t.amount)})
              </option>
            ))}
          </select>
          <p className="amount">
            Importe: <b>{selectedType ? euros(selectedType.amount) : '—'}</b>
          </p>
          <input placeholder="Comentario (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button type="submit">Multar 🔨</button>
        </form>

        <div className="card hucha">
          <h3>Hucha del zulo</h3>
          <div className="hucha-total">{euros(hucha)}</div>
          <p className="muted">
            {euros(thisWeek)} esta semana · se paga todo al final de la convivencia
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Historial</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Multado</th>
              <th>Motivo</th>
              <th>Importe</th>
              <th>Puesta por</th>
              {me.is_admin && <th />}
            </tr>
          </thead>
          <tbody>
            {fines.map((f) => (
              <tr key={f.id}>
                <td>{new Date(f.created_at).toLocaleDateString('es-ES')}</td>
                <td>{memberById(f.member_id)?.name}</td>
                <td>
                  {types.find((t) => t.id === f.fine_type_id)?.name ?? '—'}
                  {f.reason && <span className="muted"> · {f.reason}</span>}
                </td>
                <td>{euros(f.amount)}</td>
                <td>{memberById(f.issued_by)?.name ?? '—'}</td>
                {me.is_admin && (
                  <td>
                    <button className="danger" onClick={() => remove(f)} title="Borrar">
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
