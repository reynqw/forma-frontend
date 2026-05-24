import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      onClick={scrollUp}
      aria-label="Наверх"
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-primary-500 text-white
        shadow-lg hover:bg-primary-600 hover:shadow-glow hover:-translate-y-0.5
        flex items-center justify-center transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}
