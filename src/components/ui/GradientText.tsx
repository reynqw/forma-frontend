interface GradientTextProps {
  children: React.ReactNode
  className?: string
  animate?: boolean
}

export default function GradientText({
  children,
  className = '',
  animate = true,
}: GradientTextProps) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #6B4CE6, #9B7EF2, #b49eff, #9B7EF2, #6B4CE6)',
        backgroundSize: animate ? '200% auto' : '100% auto',
        animation: animate ? 'gradientShift 4s linear infinite' : 'none',
      }}
    >
      {children}
    </span>
  )
}
