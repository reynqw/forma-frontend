import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Heart, Bell, Package, Search, FileQuestion,
  type LucideIcon,
} from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  children?: ReactNode
}

const PRESETS: Record<string, { icon: LucideIcon; title: string; description: string; actionLabel: string; actionHref: string }> = {
  cart: {
    icon: ShoppingBag,
    title: 'Корзина пуста',
    description: 'Добавьте ресурсы из каталога, чтобы начать покупку.',
    actionLabel: 'Открыть каталог',
    actionHref: '/catalog',
  },
  favorites: {
    icon: Heart,
    title: 'Нет избранных',
    description: 'Нажмите на сердечко у понравившегося ресурса.',
    actionLabel: 'К каталогу',
    actionHref: '/catalog',
  },
  notifications: {
    icon: Bell,
    title: 'Нет уведомлений',
    description: 'Здесь будут появляться уведомления о заказах и обновлениях.',
    actionLabel: '',
    actionHref: '',
  },
  orders: {
    icon: Package,
    title: 'Нет заказов',
    description: 'Ваши покупки появятся здесь после оформления заказа.',
    actionLabel: 'В каталог',
    actionHref: '/catalog',
  },
  search: {
    icon: Search,
    title: 'Ничего не найдено',
    description: 'Попробуйте изменить поисковый запрос или фильтры.',
    actionLabel: '',
    actionHref: '',
  },
}

export function EmptyStatePreset({ preset }: { preset: keyof typeof PRESETS }) {
  const p = PRESETS[preset]
  return <EmptyState icon={p.icon} title={p.title} description={p.description} actionLabel={p.actionLabel} actionHref={p.actionHref} />
}

export default function EmptyState({ icon: Icon = FileQuestion, title, description, actionLabel, actionHref, children }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      <div className="w-16 h-16 bg-surface-200 rounded-2xl flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link to={actionHref} className="btn-primary px-6 py-2.5 text-sm">
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  )
}
