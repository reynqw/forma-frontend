import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, CheckCheck, ExternalLink } from 'lucide-react'
import { notificationsApi, type Notification } from '@/api/notifications'
import { useNotificationStore } from '@/store/notificationStore'
import Pagination from '@/components/ui/Pagination'
import PageHead from '@/components/ui/PageHead'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { EmptyStatePreset } from '@/components/ui/EmptyState'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

const TYPE_ICONS: Record<string, string> = {
  PURCHASE: '🛒',
  NEW_REVIEW: '⭐',
  MOD_APPROVED: '✅',
  MOD_REJECTED: '❌',
  WITHDRAWAL_APPROVED: '💰',
  WITHDRAWAL_REJECTED: '💸',
  NEW_COMPLAINT: '🚩',
  EMAIL_CONFIRMED: '📧',
  WELCOME: '👋',
}

export default function NotificationsPage() {
  const [page, setPage] = useState(0)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { fetchUnreadCount } = useNotificationStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.getAll(page, 20),
  })

  const notifications = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      fetchUnreadCount()
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      fetchUnreadCount()
    },
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHead title="Уведомления" />
      <Breadcrumbs items={[{ label: 'Уведомления' }]} />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Уведомления</h1>
          <p className="text-text-secondary">{totalElements} уведомлений</p>
        </div>
        <button
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
          className="btn-ghost text-sm flex items-center gap-2 text-primary-500"
        >
          <CheckCheck className="w-4 h-4" />
          Прочитать все
        </button>
      </div>

      {isLoading ? (
        <ListSkeleton count={6} />
      ) : notifications.length === 0 ? (
        <EmptyStatePreset preset="notifications" />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n: Notification) => (
              <div
                key={n.id}
                className={`card p-4 flex gap-4 transition-all ${
                  !n.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/50' : ''
                } ${n.link ? 'cursor-pointer hover:shadow-card-lg' : ''}`}
                onClick={() => {
                  if (n.link) {
                    if (!n.isRead) markReadMutation.mutate(n.id)
                    navigate(n.link)
                  }
                }}
              >
                <span className="text-2xl shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm">{n.title}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-text-muted">
                      {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    {n.link && (
                      <span className="text-xs text-primary-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Перейти
                      </span>
                    )}
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(n.id) }}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-200 text-text-muted hover:text-primary-500 transition-colors"
                    title="Отметить как прочитанное"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          </div>
        </>
      )}
    </div>
  )
}
