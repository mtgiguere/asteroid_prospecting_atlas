import type { ResourceProfile } from '../types'
import { spectralTypeGroupToHex } from '../utils/spectralTypeColor'

interface Props {
  profile: ResourceProfile
}

function formatMass(kg: number | null): string {
  if (kg === null) return '—'
  if (kg >= 1e15) return `${(kg / 1e15).toFixed(2)} Pg`
  if (kg >= 1e12) return `${(kg / 1e12).toFixed(2)} Tg`
  if (kg >= 1e9) return `${(kg / 1e9).toFixed(2)} Gg`
  if (kg >= 1e6) return `${(kg / 1e6).toFixed(2)} Mg`
  return `${kg.toExponential(2)} kg`
}

const S = {
  card: {
    background: '#0a0a14',
    borderTop: '1px solid rgba(80,120,200,0.15)',
    padding: '12px 14px',
    fontFamily: 'var(--font-mono, monospace)',
  },
  header: {
    fontSize: 9,
    letterSpacing: '0.14em',
    color: '#3a5a8f',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  typeBadge: (color: string) => ({
    display: 'inline-block',
    background: `${color}22`,
    border: `1px solid ${color}55`,
    color,
    fontSize: 9,
    letterSpacing: '0.1em',
    padding: '2px 7px',
    borderRadius: 3,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  }),
  narrative: {
    fontSize: 10,
    color: '#8899bb',
    lineHeight: 1.55,
    marginBottom: 10,
  },
  resourcesLabel: {
    fontSize: 9,
    letterSpacing: '0.12em',
    color: '#3a5a8f',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  resourceItem: {
    fontSize: 10,
    color: '#7a99cc',
    padding: '1px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#4a6a9f',
    flexShrink: 0,
  },
  massGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 8px',
    marginTop: 8,
  },
  massItem: {
    fontSize: 9,
  },
  massLabel: {
    color: '#3a5a8f',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  massValue: {
    color: '#8aaccc',
    marginTop: 1,
    fontVariantNumeric: 'tabular-nums' as const,
  },
}

export function ResourceCard({ profile }: Props) {
  const typeColor = spectralTypeGroupToHex(profile.type_group)

  return (
    <div style={S.card}>
      <div style={S.header}>Why go here?</div>
      <div style={S.typeBadge(typeColor)}>{profile.type_label}</div>
      <div style={S.narrative}>{profile.why_go_here}</div>

      <div style={S.resourcesLabel}>Resources</div>
      {profile.primary_resources.map((r) => (
        <div key={r} style={S.resourceItem}>
          <div style={S.dot} />
          {r}
        </div>
      ))}

      {profile.estimated_mass_kg !== null && (
        <div style={S.massGrid}>
          <div style={S.massItem}>
            <div style={S.massLabel}>Water</div>
            <div style={S.massValue}>{formatMass(profile.water_mass_kg)}</div>
          </div>
          <div style={S.massItem}>
            <div style={S.massLabel}>Metals</div>
            <div style={S.massValue}>{formatMass(profile.metal_mass_kg)}</div>
          </div>
          <div style={S.massItem}>
            <div style={S.massLabel}>PGMs</div>
            <div style={S.massValue}>{formatMass(profile.pgm_mass_kg)}</div>
          </div>
          <div style={S.massItem}>
            <div style={S.massLabel}>Total mass</div>
            <div style={S.massValue}>{formatMass(profile.estimated_mass_kg)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
