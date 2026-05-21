import type { ColorMode } from '../types'
import { SPECTRAL_TYPE_COLORS } from '../utils/spectralTypeColor'

const LEGEND_ENTRIES = [
  { key: 'C', label: 'Carbonaceous', color: SPECTRAL_TYPE_COLORS.C },
  { key: 'S', label: 'Silicaceous',  color: SPECTRAL_TYPE_COLORS.S },
  { key: 'M', label: 'Metallic',     color: SPECTRAL_TYPE_COLORS.M },
  { key: 'X', label: 'Ambiguous',    color: SPECTRAL_TYPE_COLORS.X },
  { key: '?', label: 'Unknown',      color: SPECTRAL_TYPE_COLORS.unknown },
]

interface Props {
  colorMode: ColorMode
  panelOpen?: boolean
}

export function SpectralTypeLegend({ colorMode, panelOpen = false }: Props) {
  if (colorMode !== 'spectral_type') return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: panelOpen ? 320 : 20,
        background: 'rgba(10, 14, 26, 0.82)',
        border: '1px solid rgba(100, 160, 255, 0.18)',
        borderRadius: 8,
        padding: '10px 14px',
        zIndex: 15,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 11,
        color: '#aabbcc',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      {LEGEND_ENTRIES.map(({ key, label, color }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            data-testid="spectral-swatch"
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
            }}
          />
          <span style={{ color, fontWeight: 700, minWidth: 14 }}>{key}</span>
          <span style={{ color: '#778899' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
