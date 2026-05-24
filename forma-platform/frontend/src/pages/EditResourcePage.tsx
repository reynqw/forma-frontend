import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Save, X, Image, ArrowLeft, Send, EyeOff } from 'lucide-react'
import { resourcesApi } from '@/api/resources'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const STATUS_OPTIONS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-gray-100 text-gray-600' },
  PENDING: { label: 'На модерации', color: 'bg-yellow-100 text-yellow-700' },
  PUBLISHED: { label: 'Опубликован', color: 'bg-green-100 text-green-700' },
  HIDDEN: { label: 'Скрыт', color: 'bg-orange-100 text-orange-700' },
}

export default function EditResourcePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [tags, setTags] = useState('')
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['resource-edit', id],
    queryFn: () => resourcesApi.getForEdit(Number(id)),
    enabled: !!id,
  })

  const resource = data?.data

  useEffect(() => {
    if (resource) {
      setName(resource.name)
      setDescription(resource.description || '')
      setPrice(resource.price)
      setTags(resource.tags?.join(', ') || '')
      setCurrentPreviewUrl(resource.previewUrls?.[0] || resource.previewUrl || null)
      setCurrentStatus(resource.status)
    }
  }, [resource])

  const handlePreviewSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
    setPreviewFile(f)
    setPreviewObjectUrl(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Укажите название'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', String(price))
      if (tags.trim()) formData.append('tags', tags)
      if (previewFile) formData.append('preview', previewFile)

      await resourcesApi.update(Number(id), formData)
      toast.success('Ресурс обновлён!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка обновления'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('status', newStatus)
      await resourcesApi.update(Number(id), formData)
      setCurrentStatus(newStatus)

      if (newStatus === 'PENDING') {
        toast.success('Ресурс отправлен на модерацию!')
      } else if (newStatus === 'HIDDEN') {
        toast.success('Ресурс скрыт из каталога')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка смены статуса'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  }

  if (error || !resource) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">Ресурс не найден</h2>
        <p className="text-text-secondary mb-6">Нет доступа или ресурс не существует</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Вернуться
        </button>
      </div>
    )
  }

  const statusConfig = STATUS_OPTIONS[currentStatus] || STATUS_OPTIONS.DRAFT

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-text-muted hover:text-primary-500 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Назад к дашборду
          </button>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Редактировать ресурс</h1>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="space-y-6">
        {/* Status actions */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary text-lg mb-4">Статус</h2>
          <div className="flex flex-wrap gap-3">
            {(currentStatus === 'DRAFT' || currentStatus === 'HIDDEN') && (
              <button
                onClick={() => handleStatusChange('PENDING')}
                disabled={loading}
                className="btn-primary py-2.5 px-5"
              >
                <Send className="w-4 h-4" />
                Отправить на модерацию
              </button>
            )}
            {currentStatus === 'PUBLISHED' && (
              <button
                onClick={() => handleStatusChange('HIDDEN')}
                disabled={loading}
                className="btn-outline py-2.5 px-5 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <EyeOff className="w-4 h-4" />
                Скрыть из каталога
              </button>
            )}
            {currentStatus === 'PENDING' && (
              <p className="text-sm text-yellow-600 flex items-center gap-2">
                <Spinner size="sm" /> Ресурс находится на проверке модератором...
              </p>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-text-primary text-lg">Основная информация</h2>

          <div>
            <label className="label">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Название ресурса"
            />
          </div>

          <div>
            <label className="label">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="input resize-none"
              placeholder="Описание ресурса..."
            />
          </div>

          <div>
            <label className="label">Теги <span className="text-text-muted">(через запятую)</span></label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
              placeholder="минимализм, sans-serif, кириллица"
            />
          </div>
        </div>

        {/* Price */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary text-lg mb-4">Цена</h2>
          <div>
            <label className="label">Цена (руб.)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="input max-w-xs"
              min={0}
              placeholder="0 - бесплатно"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary text-lg mb-4">Превью-изображение</h2>

          <div className="flex items-start gap-6">
            {/* Current or new preview */}
            {previewObjectUrl ? (
              <div className="relative w-48 aspect-[4/3] rounded-xl overflow-hidden bg-surface-200">
                <img src={previewObjectUrl} alt="new preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewObjectUrl)
                    setPreviewObjectUrl(null)
                    setPreviewFile(null)
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <span className="absolute bottom-2 left-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded">
                  Новое
                </span>
              </div>
            ) : currentPreviewUrl ? (
              <div className="relative w-48 aspect-[4/3] rounded-xl overflow-hidden bg-surface-200">
                <img src={currentPreviewUrl} alt="current preview" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 text-[10px] bg-surface-500 text-white px-2 py-0.5 rounded">
                  Текущее
                </span>
              </div>
            ) : (
              <div className="w-48 aspect-[4/3] rounded-xl bg-surface-200 flex items-center justify-center text-text-muted">
                <Image className="w-8 h-8" />
              </div>
            )}

            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-surface-300 hover:border-primary-400 rounded-xl cursor-pointer text-text-muted hover:text-primary-500 transition-colors">
              <Image className="w-6 h-6" />
              <span className="text-xs">Загрузить новое превью</span>
              <input type="file" accept="image/*" onChange={handlePreviewSelect} className="sr-only" />
            </label>
          </div>
        </div>

        {/* Resource info (read-only) */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary text-lg mb-4">Информация</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-muted">Тип:</span>
              <span className="ml-2 text-text-primary font-medium">{resource.type?.name}</span>
            </div>
            <div>
              <span className="text-text-muted">Лицензия:</span>
              <span className="ml-2 text-text-primary font-medium">{resource.license?.name}</span>
            </div>
            <div>
              <span className="text-text-muted">Скачиваний:</span>
              <span className="ml-2 text-text-primary font-medium">{resource.downloadCount}</span>
            </div>
            <div>
              <span className="text-text-muted">Просмотров:</span>
              <span className="ml-2 text-text-primary font-medium">{resource.viewCount}</span>
            </div>
            {resource.avgRating > 0 && (
              <div>
                <span className="text-text-muted">Рейтинг:</span>
                <span className="ml-2 text-text-primary font-medium">{resource.avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex-1 py-4 text-base"
          >
            {loading ? <Spinner size="sm" /> : (
              <>
                <Save className="w-5 h-5" />
                Сохранить изменения
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-outline px-6"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
