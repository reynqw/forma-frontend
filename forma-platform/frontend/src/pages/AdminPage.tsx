import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Package, Flag, Wallet, CheckCircle, XCircle, AlertCircle, UserCheck, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

type Tab = 'resources' | 'authors' | 'users' | 'complaints' | 'withdrawals'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('resources')
  const qc = useQueryClient()

  const { data: usersData, isLoading: uLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers(),
    enabled: tab === 'users',
  })

  const { data: pendingData, isLoading: pLoading } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => adminApi.getPendingResources(),
    enabled: tab === 'resources',
  })

  const { data: authorsData, isLoading: aLoading } = useQuery({
    queryKey: ['admin-authors'],
    queryFn: () => adminApi.getPendingAuthors(),
    enabled: tab === 'authors',
  })

  const { data: complaintsData, isLoading: cLoading } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: () => adminApi.getComplaints(),
    enabled: tab === 'complaints',
  })

  const { data: withdrawalsData, isLoading: wLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => adminApi.getWithdrawals(),
    enabled: tab === 'withdrawals',
  })

  const moderateMutation = useMutation({
    mutationFn: ({ id, decision, comment }: { id: number; decision: 'APPROVE' | 'REJECT'; comment?: string }) =>
      adminApi.moderateResource(id, decision, comment),
    onSuccess: () => {
      toast.success('Решение сохранено')
      qc.invalidateQueries({ queryKey: ['admin-pending'] })
    },
    onError: () => toast.error('Ошибка'),
  })

  const authorVerifyMutation = useMutation({
    mutationFn: ({ id, decision, comment }: { id: number; decision: 'APPROVE' | 'REJECT'; comment?: string }) =>
      adminApi.verifyAuthor(id, decision, comment),
    onSuccess: () => {
      toast.success('Решение сохранено')
      qc.invalidateQueries({ queryKey: ['admin-authors'] })
    },
    onError: () => toast.error('Ошибка'),
  })

  const userStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      adminApi.updateUserStatus(userId, status),
    onSuccess: () => {
      toast.success('Статус обновлён')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const deleteResourceMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteResource(id),
    onSuccess: () => {
      toast.success('Ресурс удалён')
      qc.invalidateQueries({ queryKey: ['admin-pending'] })
    },
    onError: () => toast.error('Ошибка при удалении'),
  })

  const withdrawalMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'PROCESSED' | 'REJECTED' }) =>
      adminApi.processWithdrawal(id, status),
    onSuccess: () => {
      toast.success('Обновлено')
      qc.invalidateQueries({ queryKey: ['admin-withdrawals'] })
    },
  })

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'resources', label: 'На проверке', icon: Package },
    { key: 'authors', label: 'Авторы', icon: UserCheck },
    { key: 'users', label: 'Пользователи', icon: Users },
    { key: 'complaints', label: 'Жалобы', icon: Flag },
    { key: 'withdrawals', label: 'Выплаты', icon: Wallet },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extract = (data: any) => data?.data?.content ?? []

  const pending = extract(pendingData)
  const authors = extract(authorsData)
  const users = extract(usersData)
  const complaints = extract(complaintsData)
  const withdrawals = extract(withdrawalsData)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Панель администратора</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-200 rounded-xl p-1 mb-8 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Resources on moderation */}
      {tab === 'resources' && (
        <div>
          <h2 className="section-title mb-5">Ресурсы на проверке</h2>
          {pLoading ? <div className="flex justify-center py-8"><Spinner /></div> :
            pending.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-text-secondary">Нет ресурсов на проверке</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((r: { id: number; name: string; author?: { username: string }; type?: { name: string }; createdAt: string }) => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{r.name}</p>
                      <p className="text-sm text-text-muted mt-0.5">
                        Автор: {r.author?.username} · {r.type?.name} · {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => moderateMutation.mutate({ id: r.id, decision: 'APPROVE' })}
                        disabled={moderateMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Одобрить
                      </button>
                      <button
                        onClick={() => {
                          const comment = window.prompt('Причина отклонения:')
                          if (comment !== null) {
                            moderateMutation.mutate({ id: r.id, decision: 'REJECT', comment })
                          }
                        }}
                        disabled={moderateMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Отклонить
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Удалить ресурс безвозвратно?')) {
                            deleteResourceMutation.mutate(r.id)
                          }
                        }}
                        disabled={deleteResourceMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 bg-surface-100 hover:bg-surface-200 text-text-muted rounded-lg text-sm transition-colors"
                        title="Удалить ресурс"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Author verification */}
      {tab === 'authors' && (
        <div>
          <h2 className="section-title mb-5">Заявки на статус автора</h2>
          {aLoading ? <div className="flex justify-center py-8"><Spinner /></div> :
            authors.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-text-secondary">Нет заявок на рассмотрение</p>
            </div>
          ) : (
            <div className="space-y-4">
              {authors.map((a: { id: number; username: string; biography?: string; portfolio?: string; user?: { firstName?: string; lastName?: string; email?: string }; createdAt: string }) => (
                <div key={a.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{a.username}</p>
                      <p className="text-sm text-text-muted mt-0.5">
                        {a.user?.firstName} {a.user?.lastName} · {a.user?.email}
                      </p>
                      {a.biography && (
                        <p className="text-sm text-text-secondary mt-2 line-clamp-2">{a.biography}</p>
                      )}
                      {a.portfolio && (
                        <a
                          href={a.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-500 hover:underline mt-1 inline-block"
                        >
                          Портфолио
                        </a>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        Заявка от: {new Date(a.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button
                        onClick={() => authorVerifyMutation.mutate({ id: a.id, decision: 'APPROVE' })}
                        disabled={authorVerifyMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Верифицировать
                      </button>
                      <button
                        onClick={() => {
                          const comment = window.prompt('Причина отклонения:')
                          if (comment !== null) {
                            authorVerifyMutation.mutate({ id: a.id, decision: 'REJECT', comment })
                          }
                        }}
                        disabled={authorVerifyMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <h2 className="section-title mb-5">Пользователи</h2>
          {uLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-200">
                      <th className="text-left text-xs font-medium text-text-muted px-5 py-3">Пользователь</th>
                      <th className="text-left text-xs font-medium text-text-muted px-5 py-3">Роль</th>
                      <th className="text-left text-xs font-medium text-text-muted px-5 py-3">Статус</th>
                      <th className="text-left text-xs font-medium text-text-muted px-5 py-3">Дата</th>
                      <th className="text-left text-xs font-medium text-text-muted px-5 py-3">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: { id: number; email: string; firstName: string; lastName: string; role: string; status: string; emailConfirmed: boolean; createdAt?: string; registeredAt?: string }) => {
                      const st = u.status?.toUpperCase()
                      const statusLabel = st === 'ACTIVE' ? 'Активен' : st === 'BLOCKED' ? 'Заблокирован' : st === 'PENDING_EMAIL' ? 'Ожидает подтверждения' : u.status
                      const dateStr = u.createdAt || u.registeredAt
                      return (
                      <tr key={u.id} className="border-b border-surface-200 last:border-0">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-text-primary">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`badge text-xs ${
                            u.role === 'ADMIN' ? 'bg-red-50 text-red-500' :
                            u.role === 'AUTHOR' ? 'bg-purple-50 text-purple-500' :
                            'bg-blue-50 text-blue-500'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-sm ${
                            st === 'ACTIVE' ? 'text-green-500' :
                            st === 'BLOCKED' ? 'text-red-500' : 'text-text-muted'
                          }`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-text-muted">
                          {dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {st === 'ACTIVE' ? (
                            <button
                              onClick={() => userStatusMutation.mutate({ userId: u.id, status: 'BLOCKED' })}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Заблокировать
                            </button>
                          ) : st === 'BLOCKED' ? (
                            <button
                              onClick={() => userStatusMutation.mutate({ userId: u.id, status: 'ACTIVE' })}
                              className="text-xs text-green-500 hover:text-green-600"
                            >
                              Разблокировать
                            </button>
                          ) : null}
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complaints */}
      {tab === 'complaints' && (
        <div>
          <h2 className="section-title mb-5">Жалобы</h2>
          {cLoading ? <div className="flex justify-center py-8"><Spinner /></div> :
            complaints.length === 0 ? (
            <div className="card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Жалоб нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((c: { id: number; reason: string; comment?: string; status: string; user?: { firstName?: string; lastName?: string; email?: string }; resource?: { id: number; name: string }; submittedAt: string }) => (
                <div key={c.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge bg-red-50 text-red-500 text-xs">{c.reason}</span>
                        <span className={`text-xs ${c.status === 'PENDING' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {c.status === 'PENDING' ? 'Ожидает' : 'Рассмотрена'}
                        </span>
                      </div>
                      {c.comment && (
                        <p className="text-sm text-text-secondary mt-1">{c.comment}</p>
                      )}
                      <p className="text-xs text-text-muted mt-2">
                        От: {c.user?.firstName} {c.user?.lastName} ({c.user?.email}) · Ресурс: {c.resource?.name} · {new Date(c.submittedAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    {c.status === 'PENDING' && (
                      <button
                        onClick={() => adminApi.resolveComplaint(c.id, 'Рассмотрено администратором').then(() => {
                          toast.success('Жалоба рассмотрена')
                          qc.invalidateQueries({ queryKey: ['admin-complaints'] })
                        })}
                        className="text-xs text-primary-500 hover:text-primary-600 shrink-0"
                      >
                        Закрыть
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdrawals */}
      {tab === 'withdrawals' && (
        <div>
          <h2 className="section-title mb-5">Заявки на вывод</h2>
          {wLoading ? <div className="flex justify-center py-8"><Spinner /></div> :
            withdrawals.length === 0 ? (
            <div className="card p-12 text-center">
              <Wallet className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">Заявок нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w: { id: number; amount: number; status: string; paymentDetails?: string; paymentMethod?: string; requestedAt: string; processedAt?: string; author?: { username: string } }) => (
                <div key={w.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary text-lg">{w.amount} ₽</p>
                      <p className="text-sm text-text-muted mt-0.5">Автор: {w.author?.username}</p>
                      {w.paymentDetails && (
                        <p className="text-xs text-text-muted mt-1">Реквизиты: {w.paymentDetails}</p>
                      )}
                      <p className="text-xs text-text-muted">
                        {new Date(w.requestedAt).toLocaleDateString('ru-RU')}
                        {w.processedAt && ` — обработано ${new Date(w.processedAt).toLocaleDateString('ru-RU')}`}
                      </p>
                    </div>
                    {w.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => withdrawalMutation.mutate({ id: w.id, status: 'PROCESSED' })}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Выплачено
                        </button>
                        <button
                          onClick={() => withdrawalMutation.mutate({ id: w.id, status: 'REJECTED' })}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Отклонить
                        </button>
                      </div>
                    )}
                    {w.status !== 'PENDING' && (
                      <span className={`text-sm font-medium ${w.status === 'PROCESSED' ? 'text-green-500' : 'text-red-500'}`}>
                        {w.status === 'PROCESSED' ? 'Выплачено' : 'Отклонено'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
