import type { Member } from '../lib/types'
import Flag from './Flag'
import Crest from './Crest'

/** Estadísticas de la carta: clave en la tabla members + abreviatura. */
export const CARD_STATS: { key: keyof Member; abbr: string; label: string }[] = [
  { key: 'stat_suc', abbr: 'SUC', label: 'Sucio' },
  { key: 'stat_rui', abbr: 'RUI', label: 'Ruido' },
  { key: 'stat_bor', abbr: 'BOR', label: 'Borde' },
  { key: 'stat_cue', abbr: 'CUE', label: 'Cueva' },
  { key: 'stat_cry', abbr: 'CRY', label: 'Lloros' },
  { key: 'stat_deg', abbr: 'DEG', label: 'Degenerado' },
]

/** Carta estilo 2K/FIFA TOTY del compi al que le toca la semana. */
export default function PlayerCard({ member }: { member: Member }) {
  const surname = member.name.trim().split(/\s+/).pop() ?? member.name
  const left = CARD_STATS.slice(0, 3)
  const right = CARD_STATS.slice(3)

  return (
    <div className="pcard" title={member.name}>
      {member.photo_url && <div className="pcard-photo" style={{ backgroundImage: `url(${member.photo_url})` }} />}

      <div className="pcard-side">
        <div className="pcard-ovr">{member.overall}</div>
        <div className="pcard-pos">{member.position}</div>
        <Flag country={member.country} height={16} />
        <Crest club={member.club} />
      </div>

      <div className="pcard-name">{surname}</div>

      <div className="pcard-stats">
        {[left, right].map((col, i) => (
          <div key={i} className="pcard-col">
            {col.map((s) => (
              <div key={s.abbr} title={s.label}>
                <b>{member[s.key] as number}</b> {s.abbr}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
