import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Controls } from '../Controls'

const baseProps = {
  limit: 100,
  earthCrossingOnly: false,
  colorMode: 'spectral_type' as const,
  asteroidCount: 42,
  loading: false,
  rendererMode: 'cesium' as const,
  onLimitChange: vi.fn(),
  onEarthCrossingChange: vi.fn(),
  onColorModeChange: vi.fn(),
  onRendererChange: vi.fn(),
}

describe('Controls renderer toggle', () => {
  it('renders Cesium and Spacekit toggle buttons', () => {
    render(<Controls {...baseProps} />)
    expect(screen.getByRole('button', { name: /cesium/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /spacekit/i })).toBeInTheDocument()
  })

  it('marks the active renderer button', () => {
    render(<Controls {...baseProps} rendererMode="cesium" />)
    expect(screen.getByRole('button', { name: /cesium/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /spacekit/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks Spacekit as active when rendererMode is spacekit', () => {
    render(<Controls {...baseProps} rendererMode="spacekit" />)
    expect(screen.getByRole('button', { name: /spacekit/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /cesium/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onRendererChange with spacekit when Spacekit button clicked', async () => {
    const onRendererChange = vi.fn()
    render(<Controls {...baseProps} onRendererChange={onRendererChange} />)
    await userEvent.click(screen.getByRole('button', { name: /spacekit/i }))
    expect(onRendererChange).toHaveBeenCalledWith('spacekit')
  })

  it('calls onRendererChange with cesium when Cesium button clicked', async () => {
    const onRendererChange = vi.fn()
    render(<Controls {...baseProps} rendererMode="spacekit" onRendererChange={onRendererChange} />)
    await userEvent.click(screen.getByRole('button', { name: /cesium/i }))
    expect(onRendererChange).toHaveBeenCalledWith('cesium')
  })
})
