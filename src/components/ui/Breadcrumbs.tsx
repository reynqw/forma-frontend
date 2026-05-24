import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface Crumb {
  label: string
  to?: string
}

interface Props {
  items: Crumb[]
  /** Show home icon as first crumb (default: true) */
  showHome?: boolean
}

export default function Breadcrumbs({ items, showHome = true }: Props) {
  const allItems: Crumb[] = showHome
    ? [{ label: 'Главная', to: '/' }, ...items]
    : items

  return (
    <nav
      aria-label="Хлебные крошки"
      className="flex items-center gap-1.5 text-sm text-text-muted mb-6 animate-fade-in overflow-x-auto"
    >
      {allItems.map((crumb, idx) => {
        const isLast = idx === allItems.length - 1
        const isHome = showHome && idx === 0

        return (
          <span key={idx} className="flex items-center gap-1.5 shrink-0">
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />}
            {isLast ? (
              <span className="text-text-secondary truncate max-w-[200px]">{crumb.label}</span>
            ) : crumb.to ? (
              <Link
                to={crumb.to}
                className="hover:text-primary-500 transition-colors flex items-center gap-1"
              >
                {isHome && <Home className="w-3.5 h-3.5" />}
                {!isHome && crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
