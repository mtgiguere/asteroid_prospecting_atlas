import { useState, useEffect, useRef } from 'react'

const REVEAL_MS = 600
const FADE_MS   = 300

export function useOrbitAnimation(selectedId: string | null) {
  const [displayId,      setDisplayId]      = useState<string | null>(null)
  const [revealProgress, setRevealProgress] = useState(1)
  const [fadeAlpha,      setFadeAlpha]      = useState(1)

  const rafRef      = useRef(0)
  const displayRef  = useRef<string | null>(null)  // tracks current displayId for the effect closure

  useEffect(() => {
    cancelAnimationFrame(rafRef.current)

    if (selectedId !== null) {
      displayRef.current = selectedId
      setDisplayId(selectedId)
      setFadeAlpha(1)
      setRevealProgress(0)

      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / REVEAL_MS, 1)
        setRevealProgress(t)
        if (t < 1) rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else if (displayRef.current !== null) {
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / FADE_MS, 1)
        setFadeAlpha(1 - t)
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          displayRef.current = null
          setDisplayId(null)
          setRevealProgress(1)
          setFadeAlpha(1)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [selectedId])

  return { displayId, revealProgress, fadeAlpha }
}
