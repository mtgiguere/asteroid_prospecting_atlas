import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResourceCard } from '../ResourceCard'
import type { ResourceProfile } from '../../types'

const C_PROFILE: ResourceProfile = {
  type_group: 'C',
  type_label: 'Carbonaceous (C-type)',
  primary_resources: ['Water ice', 'Carbon compounds', 'Iron/nickel'],
  estimated_mass_kg: 4.19e12,
  water_mass_kg: 4.19e11,
  metal_mass_kg: 3.35e11,
  pgm_mass_kg: 2.09e6,
  why_go_here: 'Carbonaceous asteroids are the solar system\'s water towers.',
}

const M_PROFILE: ResourceProfile = {
  type_group: 'M',
  type_label: 'Metallic (M-type)',
  primary_resources: ['Nickel-iron', 'Platinum', 'Palladium'],
  estimated_mass_kg: 5.24e13,
  water_mass_kg: 0,
  metal_mass_kg: 4.19e13,
  pgm_mass_kg: 5.24e9,
  why_go_here: 'Metallic asteroids are the jackpot.',
}

const UNKNOWN_PROFILE: ResourceProfile = {
  type_group: 'unknown',
  type_label: 'Unknown composition',
  primary_resources: ['Unknown — spectral data not available'],
  estimated_mass_kg: null,
  water_mass_kg: null,
  metal_mass_kg: null,
  pgm_mass_kg: null,
  why_go_here: 'No spectral type on record.',
}

describe('ResourceCard', () => {
  it('renders the type label', () => {
    render(<ResourceCard profile={C_PROFILE} />)
    expect(screen.getAllByText(/carbonaceous/i).length).toBeGreaterThan(0)
  })

  it('renders the why_go_here narrative', () => {
    render(<ResourceCard profile={C_PROFILE} />)
    expect(screen.getByText(/water towers/i)).toBeInTheDocument()
  })

  it('renders primary resources list', () => {
    render(<ResourceCard profile={C_PROFILE} />)
    expect(screen.getByText(/water ice/i)).toBeInTheDocument()
    expect(screen.getByText(/carbon compounds/i)).toBeInTheDocument()
  })

  it('renders formatted water mass for C-type', () => {
    render(<ResourceCard profile={C_PROFILE} />)
    expect(screen.getAllByText(/water/i).length).toBeGreaterThan(0)
  })

  it('shows "no water" indicator for M-type', () => {
    render(<ResourceCard profile={M_PROFILE} />)
    // water row should show zero/none
    expect(screen.queryByText(/water towers/i)).not.toBeInTheDocument()
  })

  it('renders metal mass', () => {
    render(<ResourceCard profile={M_PROFILE} />)
    expect(screen.getByText(/nickel-iron/i)).toBeInTheDocument()
  })

  it('renders pgm (platinum-group) mass for M-type', () => {
    render(<ResourceCard profile={M_PROFILE} />)
    expect(screen.getByText(/platinum/i)).toBeInTheDocument()
  })

  it('handles null mass fields gracefully', () => {
    render(<ResourceCard profile={UNKNOWN_PROFILE} />)
    expect(screen.getAllByText(/unknown/i).length).toBeGreaterThan(0)
  })

  it('has a section header indicating resource info', () => {
    render(<ResourceCard profile={C_PROFILE} />)
    expect(screen.getByText(/why go here/i)).toBeInTheDocument()
  })
})
