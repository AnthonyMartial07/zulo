// Banderas dibujadas en SVG: los emoji de bandera no se ven en Windows
// y Catalunya / País Vasco ni siquiera tienen emoji normal.

export const COUNTRIES: { value: string; label: string }[] = [
  { value: 'es', label: 'España' },
  { value: 'es-1945', label: 'España (1945-1977)' },
  { value: 'lgtb', label: 'LGTB' },
  { value: 'es-it', label: 'España / Italia' },
  { value: 'cat', label: 'Catalunya' },
  { value: 'eus', label: 'País Vasco' },
  { value: 'dz', label: 'Argelia' },
]

/** Puntos de una estrella de 5 puntas centrada en (cx, cy), con una punta hacia `angle` grados. */
function starPoints(cx: number, cy: number, R: number, angle: number): string {
  const r = R * 0.382
  return Array.from({ length: 10 }, (_, i) => {
    const a = ((angle + i * 36) * Math.PI) / 180
    const radius = i % 2 === 0 ? R : r
    return `${(cx + radius * Math.cos(a)).toFixed(2)},${(cy + radius * Math.sin(a)).toFixed(2)}`
  }).join(' ')
}

function Shapes({ country }: { country: string }) {
  switch (country) {
    case 'es':
      return (
        <>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
        </>
      )
    case 'es-1945': // Bandera de 1945-1977, con el águila de San Juan (simplificada)
      return (
        <>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
          <g transform="translate(12 10)">
            <circle cx="0" cy="-5.2" r="1.5" fill="none" stroke="#111" strokeWidth="0.4" />
            <path d="M-1,-4.2 C-4,-6 -5.5,-4.5 -6,-1.5 C-5,-2.5 -3.5,-2.6 -2.2,-2 Z" fill="#111" />
            <path d="M1,-4.2 C4,-6 5.5,-4.5 6,-1.5 C5,-2.5 3.5,-2.6 2.2,-2 Z" fill="#111" />
            <circle cx="0" cy="-5.2" r="0.9" fill="#111" />
            <path d="M-2.4,-3.6 H2.4 V1.5 C2.4,3.4 -2.4,3.4 -2.4,1.5 Z" fill="#111" />
            <path d="M-1.8,-3 H1.8 V1.3 C1.8,2.7 -1.8,2.7 -1.8,1.3 Z" fill="#C8102E" />
            <rect x="-1.8" y="-0.9" width="3.6" height="0.8" fill="#F1BF00" />
            <path d="M-1.5,3.4 L-2.2,4.6 M1.5,3.4 L2.2,4.6" stroke="#111" strokeWidth="0.6" />
          </g>
        </>
      )
    case 'es-it': // Doble nacionalidad: Italia abajo a la izquierda, España arriba a la derecha
      return (
        <>
          <clipPath id="es-it-es">
            <polygon points="0,0 30,0 30,20" />
          </clipPath>
          <clipPath id="es-it-it">
            <polygon points="0,0 0,20 30,20" />
          </clipPath>
          <g clipPath="url(#es-it-es)">
            <rect width="30" height="20" fill="#AA151B" />
            <rect y="5" width="30" height="10" fill="#F1BF00" />
          </g>
          <g clipPath="url(#es-it-it)">
            <rect width="10" height="20" fill="#009246" />
            <rect x="10" width="10" height="20" fill="#FFFFFF" />
            <rect x="20" width="10" height="20" fill="#CE2B37" />
          </g>
          <line x1="0" y1="0" x2="30" y2="20" stroke="#fff" strokeWidth="0.6" />
        </>
      )
    case 'lgtb':
      return (
        <>
          {['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'].map((c, i) => (
            <rect key={c} y={(i * 20) / 6} width="30" height={20 / 6 + 0.05} fill={c} />
          ))}
        </>
      )
    case 'cat': // Estelada blava
      return (
        <>
          <rect width="30" height="20" fill="#FCDD09" />
          {[1, 3, 5, 7].map((i) => (
            <rect key={i} y={(i * 20) / 9} width="30" height={20 / 9} fill="#DA121A" />
          ))}
          <polygon points="0,0 11,10 0,20" fill="#0F47AF" />
          <polygon points={starPoints(3.9, 10, 2.6, -90)} fill="#FFFFFF" />
        </>
      )
    case 'eus':
      return (
        <>
          <rect width="30" height="20" fill="#D52B1E" />
          <path d="M0,0 L30,20 M30,0 L0,20" stroke="#009B48" strokeWidth="3" />
          <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="3" />
        </>
      )
    case 'dz':
      return (
        <>
          <rect width="15" height="20" fill="#006233" />
          <rect x="15" width="15" height="20" fill="#FFFFFF" />
          <mask id="dz-crescent">
            <rect width="30" height="20" fill="white" />
            <circle cx="16.4" cy="10" r="4.1" fill="black" />
          </mask>
          <circle cx="15" cy="10" r="5" fill="#D21034" mask="url(#dz-crescent)" />
          <polygon points={starPoints(17.4, 10, 2.4, 180)} fill="#D21034" />
        </>
      )
    default:
      return <rect width="30" height="20" fill="#999" />
  }
}

export default function Flag({ country, height = 14 }: { country: string; height?: number }) {
  const label = COUNTRIES.find((c) => c.value === country)?.label ?? country
  return (
    <svg
      className="flag"
      viewBox="0 0 30 20"
      height={height}
      width={(height * 3) / 2}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <Shapes country={country} />
    </svg>
  )
}
