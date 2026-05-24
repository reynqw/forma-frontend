interface MarqueeProps {
  children: React.ReactNode
  speed?: number
  pauseOnHover?: boolean
  className?: string
  reverse?: boolean
}

export default function Marquee({
  children,
  speed = 30,
  pauseOnHover = true,
  className = '',
  reverse = false,
}: MarqueeProps) {
  const duration = `${speed}s`
  const direction = reverse ? 'reverse' : 'normal'

  return (
    <div
      className={`overflow-hidden relative ${className}`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className={`flex gap-8 w-max ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        style={{
          animation: `marqueeScroll ${duration} linear infinite`,
          animationDirection: direction,
        }}
      >
        {/* Duplicate children for seamless loop */}
        <div className="flex gap-8 shrink-0">{children}</div>
        <div className="flex gap-8 shrink-0" aria-hidden>{children}</div>
      </div>
    </div>
  )
}
