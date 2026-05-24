import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  TrendingUp, DollarSign, Download, Star, Package, Plus, Wallet,
  CheckCircle, Clock, XCircle, Edit3
} from 'lucide-react'
import { authorApi } from '@/api/author'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const withdrawSchema = z.object({
  amount: z.number().min(100, 'Минимум 100 ₽'),
  requisites: z.string().min(10, 'Укажите реквизиты'),
})
type WithdrawForm = z.infer<typeof withdrawSchema>

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary-500' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="card p-6">
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-sm text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PUBLISHED: { label: 'Опубликован', icon: CheckCircle, color: 'text-green-500' },
  PENDING: { label: 'На проверке', icon: Clock, color: 'text-yellow-500' },
  DRAFT: { label: 'Черновик', icon: Clock, color: 'text-text-muted' },
  REJECTED: { label: 'Отклонён', icon: XCircle, color: 'text-red-500' },
}

export default function AuthorDashboardPage() {
  const qc = useQueryClient()
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [resourcesPage] = useState(0)

  const { data: statsData, isLoading: sLoading } = useQuery({
    queryKey: ['author-stats'],
    queryFn: () => authorApi.getMyStats(),
  })

  const { data: resourcesData, isLoading: rLoading } = useQuery({
    queryKey: ['my-resources', resourcesPage],
    queryFn: () => authorApi.getMyResources(resourcesPage, 6),
  })

  const { data: withdrawalsData } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => authorApi.getWithdrawals(0, 5),
  })

  const stats = statsData?.data
  const resources = resourcesData?.data?.content ?? []

  const { register, handleSubmit, formState: { errors }, reset } = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
  })

  const withdrawMutation = useMutation({
    mutationFn: (data: WithdrawForm) => authorApi.requestWithdrawal(data),
    onSuccess: () => {
      toast.success('Заявка на вывод отправлена')
      reset()
      setShowWithdrawForm(false)
      qc.invalidateQueries({ queryKey: ['my-withdrawals'] })
      qc.invalidateQueries({ queryKey: ['author-stats'] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      toast.error(msg)
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Дашборд автора</h1>
          <p className="text-text-secondary">Управляйте своими ресурсами и доходом</p>
        </div>
        <Link to="/resources/upload" className="btn-primary">
          <Plus className="w-4 h-4" />
          Загрузить ресурс
        </Link>
      </div>

      {/* Stats */}
      {sLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={DollarSign} label="Общий доход" value={`${stats.totalRevenue} ₽`} sub="Всего продаж" />
          <StatCard icon={Wallet} label="Ваша доля (70%)" value={`${stats.authorRevenue} ₽`} color="text-green-500" />
          <StatCard icon={Download} label="Скачиваний" value={stats.totalDownloads} />
          <StatCard icon={Star} label="Средний рейтинг" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'} />
        </div>
      ) : null}

      {/* Balance & Withdrawal */}
      {stats && (
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-text-primary text-lg mb-1">Баланс</h2>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-text-muted">Доступно для вывода</p>
                  <p className="text-2xl font-bold text-green-500">{stats.availableBalance} ₽</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Ожидает</p>
                  <p className="text-lg font-semibold text-yellow-500">{stats.pendingBalance} ₽</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="btn-primary"
            >
              <Wallet className="w-4 h-4" />
              Вывести средства
            </button>
          </div>

          {showWithdrawForm && (
            <form
              onSubmit={handleSubmit((d) => withdrawMutation.mutate(d))}
              className="mt-6 pt-6 border-t border-surface-200 space-y-4"
            >
              <div>
                <label className="label">Сумма (₽)</label>
                <input
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                  className="input max-w-xs"
                  placeholder="1000"
                  min={100}
                  max={stats.availableBalance}
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="label">Реквизиты</label>
                <textarea
                  {...register('requisites')}
                  className="input resize-none"
                  rows={2}
                  placeholder="Номер карты / счёт / ЮMoney..."
                />
                {errors.requisites && <p className="text-red-500 text-xs mt-1">{errors.requisites.message}</p>}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={withdrawMutation.isPending} className="btn-primary">
                  {withdrawMutation.isPending ? <Spinner size="sm" /> : 'Отправить заявку'}
                </button>
                <button type="button" onClick={() => setShowWithdrawForm(false)} className="btn-outline">
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Withdrawal history */}
      {(withdrawalsData?.data?.content ?? []).length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-text-primary text-lg mb-4">История выводов</h2>
          <div className="space-y-3">
            {(withdrawalsData?.data?.content ?? []).map((w: { id: number; amount: number; status: string; requestedAt: string; processedAt?: string; paymentMethod?: string }) => {
              const statusMap: Record<string, { label: string; color: string }> = {
                PENDING: { label: 'Ожидает', color: 'text-yellow-500' },
                APPROVED: { label: 'Одобрено', color: 'text-blue-500' },
                PROCESSED: { label: 'Выплачено', color: 'text-green-500' },
                REJECTED: { label: 'Отклонено', color: 'text-red-500' },
              }
              const st = statusMap[w.status] ?? { label: w.status, color: 'text-text-muted' }
              return (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-surface-200 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{w.amount} ₽</p>
                    <p className="text-xs text-text-muted">
                      {new Date(w.requestedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${st.color}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* My resources */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">Мои ресурсы</h2>
        <span className="text-sm text-text-muted">{resourcesData?.data?.totalElements ?? 0} всего</span>
      </div>

      {rLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : resources.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 text-surface-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Нет ресурсов</h3>
          <p className="text-text-secondary mb-6">Загрузите первый ресурс и начните зарабатывать</p>
          <Link to="/resources/upload" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" />
            Загрузить ресурс
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((resource) => {
            const status = STATUS_CONFIG[resource.status] ?? STATUS_CONFIG.DRAFT
            const StatusIcon = status.icon
            return (
              <div key={resource.id} className="card overflow-hidden">
                <div className="relative aspect-[4/3] bg-surface-200">
                  {(resource.previewUrls?.[0] || resource.previewUrl) ? (
                    <img src={resource.previewUrls?.[0] || resource.previewUrl} alt={resource.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      <TrendingUp className="w-8 h-8" />
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-text-primary text-sm mb-1 line-clamp-1">{resource.name}</h3>
                  <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{resource.downloadCount}</span>
                      {resource.avgRating > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" />{resource.avgRating.toFixed(1)}</span>
                      )}
                    </div>
                    <span className="font-medium text-text-primary">
                      {resource.price === 0 ? 'Бесплатно' : `${resource.price} ₽`}
                    </span>
                  </div>
                  <Link
                    to={`/resources/${resource.id}/edit`}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-primary-500 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    Редактировать
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
