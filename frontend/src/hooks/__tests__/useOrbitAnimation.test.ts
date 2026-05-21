import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrbitAnimation } from '../useOrbitAnimation'

describe('useOrbitAnimation', () => {
  it('starts with displayId null when nothing is selected', () => {
    const { result } = renderHook(() => useOrbitAnimation(null))
    expect(result.current.displayId).toBeNull()
  })

  it('sets displayId immediately when an asteroid is selected', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useOrbitAnimation(id),
      { initialProps: { id: null as string | null } },
    )
    act(() => rerender({ id: '12345' }))
    expect(result.current.displayId).toBe('12345')
  })

  it('starts revealProgress at 0 when a new asteroid is selected', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useOrbitAnimation(id),
      { initialProps: { id: null as string | null } },
    )
    act(() => rerender({ id: '12345' }))
    expect(result.current.revealProgress).toBe(0)
  })

  it('sets fadeAlpha to 1 when an asteroid is selected', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useOrbitAnimation(id),
      { initialProps: { id: null as string | null } },
    )
    act(() => rerender({ id: '12345' }))
    expect(result.current.fadeAlpha).toBe(1)
  })

  it('keeps displayId during fade when selection is cleared', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useOrbitAnimation(id),
      { initialProps: { id: '12345' as string | null } },
    )
    act(() => rerender({ id: null }))
    // RAF hasn't fired in jsdom — displayId holds the previous id during fade
    expect(result.current.displayId).toBe('12345')
  })

  it('updates displayId immediately when switching between two asteroids', () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useOrbitAnimation(id),
      { initialProps: { id: '11111' as string | null } },
    )
    act(() => rerender({ id: '22222' }))
    expect(result.current.displayId).toBe('22222')
  })
})
