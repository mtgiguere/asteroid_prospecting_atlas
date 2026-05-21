import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeControls } from '../TimeControls'

// MJD 51544 = 2000-01-01
const TEST_MJD = 51544.0

describe('TimeControls', () => {
  it('displays the current date as a formatted string', () => {
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={vi.fn()} onSpeedChange={vi.fn()} />)
    expect(screen.getByText(/2000-01-01/)).toBeInTheDocument()
  })

  it('renders a play button when not playing', () => {
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={vi.fn()} onSpeedChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('renders a pause button when playing', () => {
    render(<TimeControls currentMjd={TEST_MJD} playing={true} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={vi.fn()} onSpeedChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  it('renders a Today button', () => {
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={vi.fn()} onSpeedChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
  })

  it('renders speed option buttons', () => {
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={vi.fn()} onSpeedChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /1d/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /30d/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1y/i })).toBeInTheDocument()
  })

  it('calls onPlayToggle when play button is clicked', async () => {
    const onPlayToggle = vi.fn()
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={onPlayToggle} onSpeedChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onPlayToggle).toHaveBeenCalledOnce()
  })

  it('calls onMjdChange when Today is clicked', async () => {
    const onMjdChange = vi.fn()
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={onMjdChange} onPlayToggle={vi.fn()} onSpeedChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /today/i }))
    expect(onMjdChange).toHaveBeenCalledOnce()
    const arg = onMjdChange.mock.calls[0][0]
    expect(typeof arg).toBe('number')
    expect(arg).toBeGreaterThan(51544)
  })

  it('calls onSpeedChange when a speed button is clicked', async () => {
    const onSpeedChange = vi.fn()
    render(<TimeControls currentMjd={TEST_MJD} playing={false} speedDays={1} onMjdChange={vi.fn()} onPlayToggle={vi.fn()} onSpeedChange={onSpeedChange} />)
    await userEvent.click(screen.getByRole('button', { name: /30d/i }))
    expect(onSpeedChange).toHaveBeenCalledWith(30)
  })
})
