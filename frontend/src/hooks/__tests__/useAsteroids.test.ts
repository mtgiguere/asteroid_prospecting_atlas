import { describe, it, expect, vi, afterEach } from 'vitest'
import { getApiBase } from '../useAsteroids'

describe('getApiBase', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('returns VITE_API_BASE when set', () => {
    vi.stubEnv('VITE_API_BASE', 'http://remote-api:9000')
    expect(getApiBase()).toBe('http://remote-api:9000')
  })

  it('falls back to localhost:8000 when VITE_API_BASE is empty', () => {
    vi.stubEnv('VITE_API_BASE', '')
    expect(getApiBase()).toBe('http://localhost:8000')
  })

  it('falls back to localhost:8000 when VITE_API_BASE is not set', () => {
    expect(getApiBase()).toBe('http://localhost:8000')
  })
})
