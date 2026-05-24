import { useState } from 'react'

interface UserAvatarProps {
  src?: string | null
  name: string
  size?: number
  /** Extra classes — pass 'rounded-2xl' to override the default 'rounded-full' shape */
  className?: string
}

/** Picks a consistent gradient based on the first character of the name */
function nameToGradient(name: string): string {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-400 to-rose-500',
    'from-pink-500 to-fuchsia-600',
    'from-cyan-500 to-blue-600',
  ]
  const code = (name || 'A').charCodeAt(0)
  return gradients[code % gradients.length]
}

export default function UserAvatar({
  src,
  name,
  size = 32,
  className = '',
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false)

  const initials = (name || '?')[0].toUpperCase()
  const gradient = nameToGradient(name)
  const fontSize = Math.max(size * 0.4, 10)

  const showImage = src && !imgError

  // Determine border-radius class — use custom if provided, otherwise rounded-full
  const hasCustomRadius = className.includes('rounded-')
  const radiusClass = hasCustomRadius ? '' : 'rounded-full'
  const ringClass = size >= 48 ? 'ring-[3px]' : 'ring-2'

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden ${radiusClass} ${ringClass} ring-primary-200 ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <span
            className="text-white font-bold leading-none select-none"
            style={{ fontSize }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}
