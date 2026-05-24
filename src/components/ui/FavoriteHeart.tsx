import { useState, useCallback } from 'react'

interface FavoriteHeartProps {
  active: boolean
  onClick: (e: React.MouseEvent) => void
  size?: number
  /** 'overlay' on images (white inactive), 'surface' on light bg (gray inactive) */
  variant?: 'overlay' | 'surface'
  className?: string
}

export default function FavoriteHeart({
  active,
  onClick,
  size = 32,
  variant = 'overlay',
  className = '',
}: FavoriteHeartProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Prevent Link navigation and event bubbling
      e.preventDefault()
      e.stopPropagation()
      // Block native navigation for <a> ancestors
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation()
      }
      setIsAnimating(true)
      onClick(e)
      setTimeout(() => setIsAnimating(false), 600)
    },
    [onClick],
  )

  const iconSize = size * 0.65

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex items-center justify-center cursor-pointer rounded-full
        ${variant === 'overlay' ? 'bg-black/20 backdrop-blur-sm hover:bg-black/30' : 'hover:bg-surface-200'}
        transition-all duration-200 ${className}`}
      style={{ width: size, height: size }}
      aria-label={active ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      {/* Ring animation on activate */}
      {isAnimating && active && (
        <span
          className="absolute rounded-full border-2 border-primary-400/60 pointer-events-none"
          style={{
            inset: -4,
            animation: 'heartRing 0.45s ease-out forwards',
          }}
        />
      )}

      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        className={isAnimating && active ? 'animate-heartPop' : ''}
        style={{
          transition: 'transform 0.2s ease, filter 0.3s ease',
          filter: active ? 'drop-shadow(0 1px 4px rgba(124,58,237,0.5))' : 'none',
        }}
      >
        {active ? (
          /* ── Active: purple filled heart ── */
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"
            fill="#7C3AED"
          />
        ) : (
          /* ── Inactive: white outlined heart ── */
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"
            fill={variant === 'overlay' ? '#FFFFFF' : '#9CA3AF'}
            fillOpacity={variant === 'overlay' ? 0.95 : 1}
            stroke={variant === 'overlay' ? 'rgba(0,0,0,0.12)' : '#D1D5DB'}
            strokeWidth={0.8}
          />
        )}
      </svg>
    </button>
  )
}
