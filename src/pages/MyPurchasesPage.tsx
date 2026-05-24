import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Download, Key, ShoppingBag } from 'lucide-react'
import { downloadsApi } from '@/api/downloads'
import Spinner from '@/components/ui/Spinner'
import PageHead from '@/components/ui/PageHead'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { ListSkeleton } from '@/components/ui/Skeleton'
import { EmptyStatePreset } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function MyPurchasesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-purchases'],
    queryFn: () => downloadsApi.getMyPurchases(),
  })

  const purchases = data?.data ?? []
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const handleDownload = async (resourceId: number, resourceName: string) => {
    setDownloadingId(resourceId)
    try {
      const res = await downloadsApi.download(resourceId)

      // Извлекаем имя файла из Content-Disposition хедера бэкенда
      const disposition = res.headers['content-disposition'] || ''
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/)
      const filename = filenameMatch ? filenameMatch[1] : resourceName

      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Скачивание начато')
    } catch {
      toast.error('Ошибка при скачивании')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHead title="Мои покупки" />
      <Breadcrumbs items={[{ label: 'Мои покупки' }]} />
      <h1 className="text-3xl font-bold text-text-primary mb-8">Мои покупки</h1>

      {isLoading ? (
        <ListSkeleton count={5} />
      ) : purchases.length === 0 ? (
        <EmptyStatePreset preset="orders" />
      ) : (
        <div className="space-y-4">
          {purchases.map((item) => (
            <div key={item.licenseKey} className="card p-5 flex gap-4 items-center">
              <Link to={`/resources/${item.resourceSlug}`}>
                <div className="w-16 h-14 rounded-lg overflow-hidden bg-surface-200 shrink-0">
                  {item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.resourceName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-text-muted" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/resources/${item.resourceSlug}`}
                  className="font-medium text-text-primary hover:text-primary-500 transition-colors line-clamp-1"
                >
                  {item.resourceName}
                </Link>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                  {item.typeName && <span>{item.typeName}</span>}
                  {item.authorName && <span>от {item.authorName}</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Key className="w-3 h-3 text-primary-500" />
                  <code className="text-xs text-text-muted font-mono">{item.licenseKey}</code>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-text-muted">
                  {new Date(item.issuedAt).toLocaleDateString('ru-RU')}
                </span>
                <button
                  onClick={() => handleDownload(item.resourceId, item.resourceName)}
                  disabled={downloadingId === item.resourceId}
                  className="btn-primary text-sm px-4 py-2"
                >
                  {downloadingId === item.resourceId ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Скачать
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
