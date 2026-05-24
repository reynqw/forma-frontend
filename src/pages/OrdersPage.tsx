import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Key, Download, Clock, CheckCircle, XCircle, RefreshCw, Loader2, Shield } from 'lucide-react'
import { ordersApi } from '@/api/orders'
import { downloadsApi } from '@/api/downloads'
import Pagination from '@/components/ui/Pagination'
import PageHead from '@/components/ui/PageHead'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { EmptyStatePreset } from '@/components/ui/EmptyState'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import ErrorState from '@/components/ui/ErrorState'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING: { label: 'Ожидает оплаты', icon: Clock, color: 'text-yellow-500' },
  PAID: { label: 'Оплачен', icon: CheckCircle, color: 'text-green-500' },
  CANCELLED: { label: 'Отменён', icon: XCircle, color: 'text-red-500' },
  REFUNDED: { label: 'Возврат', icon: RefreshCw, color: 'text-text-muted' },
}

export default function OrdersPage() {
  const [page, setPage] = useState(0)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const qc = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.cancel(orderId),
    onSuccess: () => {
      toast.success('Заказ отменён')
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => toast.error('Не удалось отменить заказ'),
  })

  const demoPayMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.demoPay(orderId),
    onSuccess: () => {
      toast.success('Демо-оплата выполнена!')
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => toast.error('Ошибка демо-оплаты'),
  })

  const handleDownload = async (resourceId: number, resourceName: string) => {
    setDownloadingId(resourceId)
    try {
      const res = await downloadsApi.download(resourceId)
      const disposition = res.headers['content-disposition'] || ''
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)
      const filename = match ? decodeURIComponent(match[1]) : `${resourceName}.zip`
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Ошибка при скачивании')
    } finally {
      setDownloadingId(null)
    }
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.getMyOrders(page, 10),
  })

  const orders = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHead title="Мои заказы" />
      <Breadcrumbs items={[{ label: 'Мои заказы' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Мои заказы</h1>
        <p className="text-text-secondary">{totalElements} заказов</p>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton count={5} />
      ) : orders.length === 0 ? (
        <EmptyStatePreset preset="orders" />
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
                            <button
                              onClick={() => handleDownload(item.resource.id, item.resource.name)}
                              disabled={downloadingId === item.resource.id}
                              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-1 disabled:opacity-50"
                            >
                              {downloadingId === item.resource.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                              Скачать
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="mt-4 pt-4 border-t border-surface-200 flex flex-wrap items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          if (window.confirm('Отменить заказ?')) cancelMutation.mutate(order.id)
                        }}
                        disabled={cancelMutation.isPending}
                        className="btn-ghost py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        Отменить
                      </button>
                      <button
                        onClick={() => demoPayMutation.mutate(order.id)}
                        disabled={demoPayMutation.isPending}
                        className="py-2 px-4 text-sm rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Демо-оплата
                      </button>
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
