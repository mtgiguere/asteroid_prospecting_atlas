import type { ResourceProfile } from '../types'
import { spectralTypeGroupToHex } from '../utils/spectralTypeColor'
import { formatMass, resourceEquivalency } from '../utils/formatters'

interface Props {
  profile: ResourceProfile
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

function EquivalenciesSection({ profile }: { profile: ResourceProfile }) {
  const entries = [
    { label: 'Water',  eq: resourceEquivalency('water',  profile.water_mass_kg),  testId: 'equivalency-water'  },
    { label: 'Metals', eq: resourceEquivalency('metals', profile.metal_mass_kg),  testId: 'equivalency-metals' },
    { label: 'PGMs',   eq: resourceEquivalency('pgms',   profile.pgm_mass_kg),    testId: 'equivalency-pgms'   },
  ].filter(({ eq }) => eq !== null)

  if (entries.length === 0) return null

  return (
    <div style={{ marginTop: 10 }}>
      <div style={S.resourcesLabel}>In Context</div>
      {entries.map(({ label, eq, testId }) => (
        <div key={label} style={{ fontSize: 9, color: '#556688', padding: '2px 0', lineHeight: 1.5 }}>
          <span style={{ color: '#3a5a8f', marginRight: 5 }}>{label}</span>
          <span data-testid={testId}>{eq}</span>
        </div>
      ))}
    </div>
  )
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
        <>
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
          <EquivalenciesSection profile={profile} />
        </>
      )}
    </div>
  )
}
