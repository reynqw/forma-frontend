import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Key, Download, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: 'Ожидает оплаты', icon: Clock, color: 'text-yellow-500' },
  PAID: { label: 'Оплачен', icon: CheckCircle, color: 'text-green-500' },
  CANCELLED: { label: 'Отменён', icon: XCircle, color: 'text-red-500' },
  REFUNDED: { label: 'Возврат', icon: RefreshCw, color: 'text-text-muted' },
}

export default function OrdersPage() {
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.getMyOrders(page, 10),
  })

  const orders = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Мои заказы</h1>
        <p className="text-text-secondary">{totalElements} заказов</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-surface-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Заказов пока нет</h2>
          <Link to="/catalog" className="btn-primary mt-4">Перейти в каталог</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
              const StatusIcon = status.icon
              return (
                <div key={order.id} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-text-primary">Заказ #{order.id}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1.5 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                      <p className="text-text-primary font-bold mt-1">
                        {order.totalAmount === 0 ? 'Бесплатно' : `${order.totalAmount} ₽`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 py-3 border-t border-surface-200">
                        <Link
                          to={`/resources/${item.resource.slug}`}
                          className="w-14 h-12 rounded-lg bg-surface-200 overflow-hidden shrink-0"
                        >
                          {item.resource.previewUrls?.[0] && (
                            <img
                              src={item.resource.previewUrls[0]}
                              alt={item.resource.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/resources/${item.resource.slug}`}
                            className="text-sm font-medium text-text-primary hover:text-primary-500 transition-colors line-clamp-1"
                          >
                            {item.resource.name}
                          </Link>
                          <p className="text-xs text-text-muted mt-0.5">{item.resource.author?.username}</p>

                          {item.licenseKey && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Key className="w-3 h-3 text-primary-500" />
                              <code className="text-xs font-mono text-text-secondary bg-surface-100 px-2 py-0.5 rounded">
                                {item.licenseKey}
                              </code>
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-text-primary">
                            {item.price === 0 ? 'Бесплатно' : `${item.price} ₽`}
                          </p>
                          {order.status === 'PAID' && (
                            <button className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-1">
                              <Download className="w-3 h-3" />
                              Скачать
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="mt-4 pt-4 border-t border-surface-200 flex justify-end">
                      <button
                        onClick={async () => {
                          const res = await ordersApi.getPaymentUrl(order.id)
                          window.location.href = res.data.paymentUrl
                        }}
                        className="btn-primary py-2 text-sm"
                      >
                        Оплатить заказ
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          </div>
        </>
      )}
    </div>
  )
}
