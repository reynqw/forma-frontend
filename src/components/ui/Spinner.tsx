interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={`${sizes[size]} border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Загрузка"
    />
  )
}
