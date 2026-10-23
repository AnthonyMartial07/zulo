import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Column = {
  key: string
  label: string
  type: 'text' | 'email' | 'color' | 'number' | 'checkbox' | 'select'
  options?: { value: string; label: string }[]
}

type Values = Record<string, unknown>
type Row = { id: string } & Values

type Props = {
  table: string
  columns: Column[]
  rows: Row[]
  /** Valores por defecto de la fila "nueva"; null = sin fila para añadir. */
  blank: Values | null
  onSaved: () => void
  /** Texto del confirm() al borrar. */
  deleteWarning?: string
  canDelete?: (row: Row) => boolean
}

/** Tabla genérica: cada fila se edita en el sitio y se guarda contra `table` en Supabase. */
export default function EditableTable({ table, columns, rows, blank, onSaved, deleteWarning, canDelete }: Props) {
  const [error, setError] = useState<string | null>(null)

  async function run(op: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await op
    setError(error?.message ?? null)
    if (!error) onSaved()
    return !error
  }

  const save = (row: Row, draft: Values) => run(supabase.from(table).update(draft).eq('id', row.id))
  const insert = (draft: Values) => run(supabase.from(table).insert(draft))
  const remove = (row: Row) => {
    if (!confirm(deleteWarning ?? '¿Borrar?')) return
    run(supabase.from(table).delete().eq('id', row.id))
  }

  return (
    <>
      <table className="editable">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RowEditor
              key={row.id}
              columns={columns}
              initial={row}
              onSave={(draft) => save(row, draft)}
              onDelete={canDelete && !canDelete(row) ? undefined : () => remove(row)}
            />
          ))}
          {blank && <RowEditor key="new" columns={columns} initial={blank} onSave={insert} isNew />}
        </tbody>
      </table>
      {error && <p className="error">{error}</p>}
    </>
  )
}

function RowEditor({
  columns,
  initial,
  onSave,
  onDelete,
  isNew,
}: {
  columns: Column[]
  initial: Values
  onSave: (draft: Values) => Promise<boolean>
  onDelete?: () => void
  isNew?: boolean
}) {
  const pick = () => Object.fromEntries(columns.map((c) => [c.key, initial[c.key]]))
  const [draft, setDraft] = useState<Values>(pick)

  // Si los datos cambian desde fuera (recarga), descarta el borrador.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setDraft(pick()), [JSON.stringify(initial)])

  const dirty = columns.some((c) => draft[c.key] !== initial[c.key])
  const set = (key: string, value: unknown) => setDraft({ ...draft, [key]: value })

  async function submit() {
    if (await onSave(draft) && isNew) setDraft(pick())
  }

  return (
    <tr className={isNew ? 'new-row' : ''}>
      {columns.map((c) => (
        <td key={c.key}>
          <Field column={c} value={draft[c.key]} onChange={(v) => set(c.key, v)} />
        </td>
      ))}
      <td className="actions">
        <button type="button" disabled={!dirty} onClick={submit}>
          {isNew ? 'Añadir' : 'Guardar'}
        </button>
        {onDelete && (
          <button type="button" className="danger" onClick={onDelete} title="Borrar">
            🗑️
          </button>
        )}
      </td>
    </tr>
  )
}

function Field({ column, value, onChange }: { column: Column; value: unknown; onChange: (v: unknown) => void }) {
  switch (column.type) {
    case 'checkbox':
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
    case 'number':
      return (
        <input
          type="number"
          step="any"
          className="narrow"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      )
    case 'select':
      return (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {column.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    default:
      return (
        <input
          type={column.type}
          className={column.type === 'color' ? 'swatch' : ''}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}
