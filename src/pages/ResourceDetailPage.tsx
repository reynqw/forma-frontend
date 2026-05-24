import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star, Download, Eye, ShoppingCart, Tag, Shield,
  ChevronLeft, ChevronRight, User, Type, Globe, CheckCircle, AlertCircle, Flag, X
} from 'lucide-react'
import { resourcesApi } from '@/api/resources'
import { reviewsApi, type CreateReviewData } from '@/api/reviews'
import { favoritesApi } from '@/api/favorites'
import { downloadsApi } from '@/api/downloads'
import { complaintsApi } from '@/api/complaints'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import PageHead from '@/components/ui/PageHead'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Spinner from '@/components/ui/Spinner'
import ErrorState from '@/components/ui/ErrorState'
import ResourceCard from '@/components/ui/ResourceCard'
import FavoriteHeart from '@/components/ui/FavoriteHeart'
import FontTester from '@/components/ui/FontTester'
import toast from 'react-hot-toast'
import { showCartAddedToast } from '@/utils/cartToast'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Минимум 10 символов').max(1000),
})

type ReviewFormData = z.infer<typeof reviewSchema>

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              s <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-surface-400'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ResourceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { isAuthenticated, user } = useAuthStore()
  const { addItem } = useCartStore()

  const [previewIdx, setPreviewIdx] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportComment, setReportComment] = useState('')
  const [reportSending, setReportSending] = useState(false)

  const { data: resourceData, isLoading: rLoading, isError: rError, refetch: rRefetch } = useQuery({
    queryKey: ['resource', slug],
    queryFn: () => resourcesApi.getBySlug(slug!),
    enabled: !!slug,
  })

  const resource = resourceData?.data

  // Загружаем состояние «в избранном» с сервера
  const { data: favCheck } = useQuery({
    queryKey: ['fav-check', resource?.id],
    queryFn: () => favoritesApi.checkFavorite(resource!.id),
    enabled: !!resource?.id && isAuthenticated,
  })
  // Синхронизируем локальный стейт
  useEffect(() => {
    if (favCheck?.data?.isFavorite !== undefined) {
      setIsFav(favCheck.data.isFavorite)
    }
  }, [favCheck])

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', resource?.id],
    queryFn: () => reviewsApi.getByResource(resource!.id),
    enabled: !!resource?.id,
  })

  const reviews = reviewsData?.data?.content ?? []

  // Проверка доступа к скачиванию
  const { data: downloadCheck } = useQuery({
    queryKey: ['download-check', resource?.id],
    queryFn: () => downloadsApi.checkAccess(resource!.id),
    enabled: !!resource?.id && isAuthenticated,
  })
  const canDownload = downloadCheck?.data?.canDownload ?? false
  const [downloading, setDownloading] = useState(false)

  // Похожие ресурсы (по типу)
  const { data: relatedData } = useQuery({
    queryKey: ['related', resource?.type?.id, resource?.id],
    queryFn: () =>
      resourcesApi.getCatalog({ typeId: resource!.type!.id, size: 4, sortBy: 'downloadCount', sortDir: 'desc' }),
    enabled: !!resource?.type?.id,
  })
  const relatedResources = (relatedData?.data?.content ?? []).filter((r) => r.id !== resource?.id).slice(0, 4)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, comment: '' },
  })

  const createReviewMutation = useMutation({
    mutationFn: (data: CreateReviewData) => reviewsApi.create(data),
    onSuccess: () => {
      toast.success('Отзыв добавлен')
      reset()
      setReviewRating(5)
      qc.invalidateQueries({ queryKey: ['reviews', resource?.id] })
      qc.invalidateQueries({ queryKey: ['resource', slug] })
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      toast.error(msg)
    },
  })

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Войдите, чтобы добавить в корзину'); return }
    setAddingToCart(true)
    try {
      await addItem(resource!.id)
      showCartAddedToast()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Ошибка')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleFav = async () => {
    if (!isAuthenticated) { toast.error('Войдите'); return }
    try {
      if (isFav) { await favoritesApi.removeFavorite(resource!.id); setIsFav(false) }
      else { await favoritesApi.addFavorite(resource!.id); setIsFav(true) }
      qc.invalidateQueries({ queryKey: ['favorites'] })
    } catch { toast.error('Ошибка') }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) { toast.error('Укажите причину жалобы'); return }
    setReportSending(true)
    try {
      await complaintsApi.create({ resourceId: resource!.id, reason: reportReason, comment: reportComment || undefined })
      toast.success('Жалоба отправлена')
      setReportOpen(false)
      setReportReason('')
      setReportComment('')
    } catch {
      toast.error('Ошибка при отправке жалобы')
    } finally {
      setReportSending(false)
    }
  }

  const handleDownload = async () => {
    if (!resource) return
    setDownloading(true)
    try {
      const res = await downloadsApi.download(resource.id)

      // Извлекаем имя файла из Content-Disposition хедера бэкенда
      const disposition = res.headers['content-disposition'] || ''
      const filenameMatch = disposition.match(/filename="?(.+?)"?$/)
      const filename = filenameMatch ? filenameMatch[1] : resource.name

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
      setDownloading(false)
    }
  }

  const onReviewSubmit = (data: ReviewFormData) => {
    if (!resource) return
    createReviewMutation.mutate({ resourceId: resource.id, rating: data.rating, comment: data.comment })
  }

  if (rLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  }

  if (rError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <ErrorState message="Не удалось загрузить ресурс" onRetry={() => rRefetch()} />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Ресурс не найден</h2>
        <button onClick={() => navigate('/catalog')} className="btn-primary">Вернуться в каталог</button>
      </div>
    )
  }

  const previews = resource.previewUrls?.length ? resource.previewUrls : (resource.previewUrl ? [resource.previewUrl] : [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHead title={resource.name} description={resource.description?.slice(0, 160)} />
      <Breadcrumbs items={[
        { label: 'Каталог', to: '/catalog' },
        { label: resource.type?.name ?? '', to: `/catalog?typeId=${resource.type?.id}` },
        { label: resource.name },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in-up">
        {/* Preview gallery */}
        <div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-200 mb-3">
            {previews.length > 0 ? (
              <img
                src={previews[previewIdx]}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <Type className="w-16 h-16" />
              </div>
            )}

            {previews.length > 1 && (
              <>
                <button
                  onClick={() => setPreviewIdx((i) => (i - 1 + previews.length) % previews.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewIdx((i) => (i + 1) % previews.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {previews.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {previews.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewIdx(idx)}
                  className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === previewIdx ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Font tester — only for font resources */}
          {resource?.font?.fileUrl && (
            <div className="mt-6">
              <FontTester
                fontFamily={resource.font.family || resource.name}
                fontFileUrl={resource.font.fileUrl}
                fontStyle={resource.font.style}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Type + Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="badge bg-primary-50 text-primary-500 border border-primary-200">
              {resource.type?.name}
            </span>
            {resource.tags?.map((t) => (
              <Link key={t} to={`/catalog?q=${encodeURIComponent(t)}`} className="tag hover:bg-primary-50 hover:text-primary-500 transition-colors cursor-pointer">{t}</Link>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-2">{resource.name}</h1>

          {/* Author */}
          <Link
            to={`/authors/${resource.author?.username}`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-500 transition-colors mb-4"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">{resource.author?.fullName}</span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-text-muted mb-6">
            {resource.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {resource.avgRating.toFixed(1)} ({reviews.length})
              </span>
            )}
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              {resource.downloadCount} скачиваний
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {resource.viewCount} просмотров
            </span>
          </div>

          {/* Description */}
          <p className="text-text-secondary leading-relaxed mb-6">{resource.description}</p>

          {/* Font specifics */}
          {resource.font && (
            <div className="card p-4 mb-6 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Type className="w-4 h-4 text-primary-500" />
                Характеристики шрифта
              </h3>
              {([
                ['Семейство', resource.font.family],
                ['Стиль', resource.font.style],
                ['Формат', resource.font.format],
              ] as [string, string][]).filter(([, v]) => !!v).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">{label}</span>
                  <span className="text-text-secondary">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* License */}
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl mb-6">
            <Shield className="w-5 h-5 text-primary-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-primary">{resource.license?.name}</p>
              <p className="text-xs text-text-muted capitalize">{resource.license?.type} лицензия</p>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex items-end gap-4 mb-4">
            <div>
              {resource.price === 0 ? (
                <p className="text-3xl font-bold text-green-500">Бесплатно</p>
              ) : resource.discount && resource.discount > 0 ? (
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-text-primary">{resource.effectivePrice} ₽</p>
                  <p className="text-lg text-text-muted line-through">{resource.price} ₽</p>
                  <span className="badge bg-red-50 text-red-500 text-sm font-semibold">-{resource.discount}%</span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-text-primary">{resource.price} ₽</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {canDownload ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary flex-1 py-4 text-base bg-green-500 hover:bg-green-600"
              >
                {downloading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Скачать
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="btn-primary flex-1 py-4 text-base"
              >
                {addingToCart ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {resource.price === 0 ? 'Получить бесплатно' : 'В корзину'}
                  </>
                )}
              </button>
            )}
            <div className={`flex items-center justify-center w-[52px] h-[52px] rounded-lg border-2 transition-colors ${isFav ? 'border-primary-500 bg-primary-50' : 'border-surface-300 hover:border-primary-400'}`}>
              <FavoriteHeart
                active={isFav}
                onClick={handleToggleFav}
                size={36}
                variant="surface"
              />
            </div>
          </div>

          {/* Report button */}
          {isAuthenticated && (
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-500 transition-colors mt-3"
            >
              <Flag className="w-3.5 h-3.5" />
              Пожаловаться
            </button>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 modal-backdrop" onClick={() => setReportOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Пожаловаться на ресурс</h3>
              <button onClick={() => setReportOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Причина *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input"
                >
                  <option value="">Выберите причину</option>
                  <option value="Нарушение авторских прав">Нарушение авторских прав</option>
                  <option value="Спам или мошенничество">Спам или мошенничество</option>
                  <option value="Некачественный контент">Некачественный контент</option>
                  <option value="Неприемлемое содержание">Неприемлемое содержание</option>
                  <option value="Повторяющийся ресурс">Повторяющийся ресурс</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>
              <div>
                <label className="label">Комментарий</label>
                <textarea
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="Опишите проблему подробнее..."
                  maxLength={2000}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setReportOpen(false)} className="btn-outline flex-1">
                  Отмена
                </button>
                <button onClick={handleReport} disabled={reportSending} className="btn-primary flex-1 bg-red-500 hover:bg-red-600">
                  {reportSending ? <Spinner size="sm" /> : 'Отправить жалобу'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="section-title mb-6">Отзывы ({reviews.length})</h2>

        {/* Review form — only for users who purchased/downloaded */}
        {isAuthenticated && canDownload && (
          <div className="card p-6 mb-8">
            <h3 className="font-semibold text-text-primary mb-4">Оставить отзыв</h3>
            <form onSubmit={handleSubmit(onReviewSubmit)} className="space-y-4">
              <div>
                <label className="label">Оценка</label>
                <StarRating
                  value={reviewRating}
                  onChange={(v) => { setReviewRating(v); setValue('rating', v) }}
                />
              </div>
              <div>
                <label className="label">Комментарий</label>
                <textarea
                  {...register('comment')}
                  rows={3}
                  className="input resize-none"
                  placeholder="Поделитесь впечатлениями..."
                />
                {errors.comment && (
                  <p className="text-red-500 text-xs mt-1">{errors.comment.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={createReviewMutation.isPending}
                className="btn-primary"
              >
                {createReviewMutation.isPending ? <Spinner size="sm" /> : 'Отправить'}
              </button>
            </form>
          </div>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            Пока нет отзывов. Станьте первым!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 text-sm font-semibold">
                        {(review.user.firstName ?? review.user.email ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {review.user.firstName} {review.user.lastName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{review.comment}</p>

                {user?.id === review.user.id && (
                  <button
                    onClick={async () => {
                      await reviewsApi.delete(review.id)
                      qc.invalidateQueries({ queryKey: ['reviews', resource.id] })
                      toast.success('Отзыв удалён')
                    }}
                    className="mt-3 text-xs text-red-500 hover:text-red-600"
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Похожие ресурсы */}
      {relatedResources.length > 0 && (
        <div className="mt-12">
          <h2 className="section-title mb-6">Похожие ресурсы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
