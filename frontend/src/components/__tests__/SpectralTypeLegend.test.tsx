import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpectralTypeLegend } from '../SpectralTypeLegend'

describe('SpectralTypeLegend', () => {
  it('renders all spectral type keys', () => {
    render(<SpectralTypeLegend colorMode="spectral_type" />)
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('X')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders descriptive labels for each type', () => {
    render(<SpectralTypeLegend colorMode="spectral_type" />)
    expect(screen.getByText(/Carbonaceous/i)).toBeInTheDocument()
    expect(screen.getByText(/Silicaceous/i)).toBeInTheDocument()
    expect(screen.getByText(/Metallic/i)).toBeInTheDocument()
    expect(screen.getByText(/Ambiguous/i)).toBeInTheDocument()
    expect(screen.getByText(/Unknown/i)).toBeInTheDocument()
  })

  it('renders a color swatch for each entry', () => {
    render(<SpectralTypeLegend colorMode="spectral_type" />)
    expect(screen.getAllByTestId('spectral-swatch')).toHaveLength(5)
  })

  it('does not render when colorMode is prospecting_score', () => {
    const { container } = render(<SpectralTypeLegend colorMode="prospecting_score" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('does not render when colorMode is accessibility_score', () => {
    const { container } = render(<SpectralTypeLegend colorMode="accessibility_score" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shifts right offset when info panel is open', () => {
    const { container } = render(<SpectralTypeLegend colorMode="spectral_type" panelOpen />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.right).toBe('320px')
  })

  it('uses default right offset when info panel is closed', () => {
    const { container } = render(<SpectralTypeLegend colorMode="spectral_type" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.right).toBe('20px')
  })
})
