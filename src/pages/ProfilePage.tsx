import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { User, Package, Heart, Download, Clock, Key } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/orders'
import { favoritesApi } from '@/api/favorites'
import { ListSkeleton } from '@/components/ui/Skeleton'
import PageHead from '@/components/ui/PageHead'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import UserAvatar from '@/components/ui/UserAvatar'

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-primary-500" />
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [ordersPage] = useState(0)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', ordersPage],
    queryFn: () => ordersApi.getMyOrders(ordersPage, 5),
  })

  const orders = ordersData?.data?.content ?? []
  const totalOrders = ordersData?.data?.totalElements ?? 0

  const { data: favData } = useQuery({
    queryKey: ['favorites', 'count'],
    queryFn: () => favoritesApi.getFavorites(0, 1),
  })
  const favCount = favData?.data?.totalElements ?? 0

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Ожидает оплаты', color: 'text-yellow-500' },
    PAID: { label: 'Оплачен', color: 'text-green-500' },
    CANCELLED: { label: 'Отменён', color: 'text-red-500' },
    REFUNDED: { label: 'Возврат', color: 'text-text-muted' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHead title="Профиль" />
      <Breadcrumbs items={[{ label: 'Профиль' }]} />
      {/* Profile header */}
      <div className="card p-8 mb-8">
        <div className="flex items-start gap-6">
          <UserAvatar
            src={user?.avatarUrl}
            name={user?.firstName ?? ''}
            size={80}
            className="rounded-2xl shrink-0"
          />

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-text-muted mt-1">{user?.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`badge ${
                user?.role === 'ADMIN'
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : user?.role === 'AUTHOR'
                  ? 'bg-purple-50 text-purple-500 border border-purple-200'
                  : 'bg-primary-50 text-primary-500 border border-primary-200'
              }`}>
                {user?.role === 'ADMIN' ? 'Администратор' : user?.role === 'AUTHOR' ? 'Автор' : 'Покупатель'}
              </span>
              {user?.emailConfirmed && (
                <span className="badge bg-green-50 text-green-600 border border-green-200">
                  Email подтверждён
                </span>
              )}
            </div>
          </div>

          <Link to="/settings" className="btn-outline text-sm">
            Редактировать
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Всего заказов" value={totalOrders} />
        <StatCard icon={Download} label="Скачиваний" value={orders.reduce((s, o) => s + o.items.length, 0)} />
        <StatCard icon={Heart} label="В избранном" value={favCount} />
        <StatCard icon={Key} label="Лицензий" value={orders.filter((o) => o.status === 'PAID').reduce((s, o) => s + o.items.length, 0)} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Мои покупки', icon: Download, href: '/purchases' },
          { label: 'Заказы', icon: Package, href: '/orders' },
          { label: 'Избранное', icon: Heart, href: '/favorites' },
          { label: 'Настройки', icon: User, href: '/settings' },
        ].map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-lg hover:-translate-y-0.5 transition-all group"
          >
            <item.icon className="w-6 h-6 text-text-muted group-hover:text-primary-500 transition-colors" />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Последние заказы</h2>
          <Link to="/orders" className="text-sm text-primary-500 hover:text-primary-600">Все заказы</Link>
        </div>

        {isLoading ? (
          <ListSkeleton count={3} />
        ) : orders.length === 0 ? (
          <div className="card p-10 text-center">
            <Package className="w-12 h-12 text-surface-400 mx-auto mb-3" />
            <p className="text-text-secondary">У вас пока нет заказов</p>
            <Link to="/catalog" className="btn-primary mt-4">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-text-muted' }
              return (
                <div key={order.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Заказ #{order.id}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${status.color}`}>{status.label}</p>
                      <p className="text-sm text-text-primary font-semibold">
                        {order.totalAmount === 0 ? 'Бесплатно' : `${order.totalAmount} ₽`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item) => (
                      <span key={item.id} className="text-xs text-text-muted bg-surface-100 px-2 py-1 rounded-lg">
                        {item.resource.name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-text-muted">+{order.items.length - 3} ещё</span>
                    )}
                  </div>

                  {order.items.some((i) => i.licenseKey) && (
                    <div className="mt-3 pt-3 border-t border-surface-200">
                      {order.items.filter((i) => i.licenseKey).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <Key className="w-3 h-3 text-primary-500" />
                          <span className="text-text-muted">{item.resource.name}:</span>
                          <code className="font-mono text-text-secondary">{item.licenseKey}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
