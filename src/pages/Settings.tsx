import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHousehold } from '../lib/household'
import type { FineType } from '../lib/types'
import EditableTable, { type Column } from '../components/EditableTable'
import { COUNTRIES } from '../components/Flag'
import { CLUBS } from '../components/Crest'
import PlayerCard, { CARD_STATS } from '../components/PlayerCard'

const memberColumns: Column[] = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'color', label: 'Color', type: 'color' },
  { key: 'country', label: 'Bandera', type: 'select', options: COUNTRIES },
  { key: 'club', label: 'Club', type: 'select', options: CLUBS },
  { key: 'rotation_order', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Activo', type: 'checkbox' },
]

const cardColumns: Column[] = [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'position', label: 'Pos', type: 'text' },
  { key: 'overall', label: 'Media', type: 'number' },
  ...CARD_STATS.map((s): Column => ({ key: s.key, label: s.abbr, type: 'number' })),
  { key: 'photo_url', label: 'URL foto', type: 'text' },
]

const taskColumns: Column[] = [
  { key: 'name', label: 'Tarea', type: 'text' },
  {
    key: 'kind',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'weekly', label: 'Semanal (checklist)' },
      { value: 'common', label: 'Cotidiana (medallero)' },
    ],
  },
  { key: 'rotation_order', label: 'Orden', type: 'number' },
  { key: 'active', label: 'Activa', type: 'checkbox' },
]

const fineTypeColumns: Column[] = [
  { key: 'name', label: 'Motivo', type: 'text' },
  { key: 'amount', label: 'Importe €', type: 'number' },
]

export default function Settings() {
  const { me, members, tasks, reload } = useHousehold()
  const [fineTypes, setFineTypes] = useState<FineType[]>([])

  async function loadFineTypes() {
    const { data } = await supabase.from('fine_types').select('*').order('name')
    setFineTypes(data ?? [])
  }

  useEffect(() => {
    loadFineTypes()
  }, [])

  return (
    <section>
      <h2>Ajustes</h2>

      <div className="card">
        <h3>Compis</h3>
        <p className="muted">
          El email es con el que cada uno entra. "Orden" decide a quién le toca cada semana. Desmarca
          "Activo" si alguien se va del piso: sale de la rotación pero se conserva su historial.
        </p>
        <EditableTable
          table="members"
          columns={memberColumns}
          rows={members}
          blank={{ name: '', email: '', color: '#888888', country: 'es', club: 'rma', rotation_order: members.length, active: true }}
          onSaved={reload}
          canDelete={(row) => row.id !== me.id}
          deleteWarning="Se borrarán también sus multas y tareas registradas. Si solo se ha ido del piso, mejor desmárcalo como activo. ¿Borrar igualmente?"
        />
      </div>

      <div className="card">
        <h3>Cartas de jugador</h3>
        <p className="muted">
          Media, posición y estadísticas de la carta que sale en el calendario. Para la foto, pega la
          URL de una imagen (mejor vertical, con fondo transparente).
        </p>
        <EditableTable
          table="members"
          columns={cardColumns}
          rows={members}
          blank={null}
          onSaved={reload}
          canDelete={() => false}
        />
        <div className="card-preview">
          {members
            .filter((m) => m.active)
            .map((m) => (
              <PlayerCard key={m.id} member={m} />
            ))}
        </div>
      </div>

      <div className="card">
        <h3>Tareas</h3>
        <p className="muted">
          Las semanales forman la checklist que hace una persona cada semana; las cotidianas se
          suman desde el medallero. "Orden" decide en qué orden se muestran.
        </p>
        <EditableTable
          table="tasks"
          columns={taskColumns}
          rows={tasks}
          blank={{ name: '', kind: 'common', rotation_order: tasks.length, active: true }}
          onSaved={reload}
          deleteWarning="Se borrará también su historial (y su recuento en el medallero). Si ya no se hace, mejor desmárcala como activa. ¿Borrar igualmente?"
        />
      </div>

      <div className="card">
        <h3>Tipos de multa</h3>
        <EditableTable
          table="fine_types"
          columns={fineTypeColumns}
          rows={fineTypes}
          blank={{ name: '', amount: 1 }}
          onSaved={loadFineTypes}
          deleteWarning="Las multas ya puestas con este motivo se quedan sin motivo. ¿Borrar?"
        />
      </div>
    </section>
  )
}
