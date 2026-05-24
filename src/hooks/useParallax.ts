import { useState, useEffect } from 'react'

/** Returns a Y offset driven by scroll position, clamped for performance */
export function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setOffset(window.scrollY * speed)
          ticking = false
        })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return offset
}
