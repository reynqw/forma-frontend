import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter')

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit')
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('enter')
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  return (
    <div
      className={`page-transition ${transitionStage === 'enter' ? 'page-enter' : 'page-exit'}`}
    >
      {children}
    </div>
  )
}
