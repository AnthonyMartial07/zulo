// Escudos oficiales (de Wikipedia) guardados en public/crests/.

export const CLUBS: { value: string; label: string; file: string }[] = [
  { value: 'atm', label: 'Atlético de Madrid', file: 'atm.svg' },
  { value: 'vcf', label: 'Valencia CF', file: 'vcf.svg' },
  { value: 'ath', label: 'Athletic Club', file: 'ath.svg' },
  { value: 'sfc', label: 'Sevilla FC', file: 'sfc.png' },
  { value: 'rma', label: 'Real Madrid', file: 'rma.svg' },
  { value: 'fcb', label: 'FC Barcelona', file: 'fcb.svg' },
]

export default function Crest({ club, size }: { club: string; size?: number }) {
  const c = CLUBS.find((x) => x.value === club)
  if (!c) return null
  return <img className="crest" src={`/crests/${c.file}`} alt={c.label} title={c.label} style={size ? { height: size, width: size } : undefined} />
}
