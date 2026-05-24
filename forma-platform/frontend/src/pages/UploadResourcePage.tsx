import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Upload, X, Plus, FileText, Image } from 'lucide-react'
import { resourcesApi } from '@/api/resources'
import apiClient from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(3, 'Минимум 3 символа').max(200),
  description: z.string().min(20, 'Минимум 20 символов').max(5000),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  typeId: z.string().min(1, 'Выберите тип'),
  licenseId: z.string().min(1, 'Выберите лицензию'),
  tags: z.string().optional(),
  fontFamily: z.string().optional(),
  fontStyle: z.string().optional(),
  fontFormat: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TypeItem { id: number; name: string; slug: string }
interface LicenseItem { id: number; name: string; type: string }

export default function UploadResourcePage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: typesData } = useQuery({ queryKey: ['types'], queryFn: () => apiClient.get<TypeItem[]>('/types') })
  const { data: licensesData } = useQuery({ queryKey: ['licenses'], queryFn: () => apiClient.get<LicenseItem[]>('/licenses') })

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { price: 0 } })

  const selectedTypeId = watch('typeId')
  const selectedType = typesData?.data?.find((t) => String(t.id) === selectedTypeId)
  const isFont = selectedType?.slug === 'fonts'

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...f])
  }

  const handlePreviewSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl)
    setPreviewFile(f)
    setPreviewObjectUrl(URL.createObjectURL(f))
  }

  const onSubmit = async (data: FormData) => {
    if (files.length === 0) {
      toast.error('Загрузите хотя бы один файл ресурса')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('price', String(data.price))
      formData.append('typeId', data.typeId)
      formData.append('licenseId', data.licenseId)
      if (data.tags) formData.append('tags', data.tags)

      if (isFont) {
        if (data.fontFamily) formData.append('fontFamily', data.fontFamily)
        if (data.fontStyle) formData.append('fontStyle', data.fontStyle)
        if (data.fontFormat) formData.append('fontFormat', data.fontFormat)
      }

      files.forEach((f) => formData.append('files', f))
      if (previewFile) formData.append('preview', previewFile)

      await resourcesApi.create(formData)
      toast.success('Ресурс отправлен на проверку!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка загрузки'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Загрузить ресурс</h1>
        <p className="text-text-secondary">Заполните информацию о вашем ресурсе</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-text-primary text-lg">Основная информация</h2>

          <div>
            <label className="label">Название *</label>
            <input {...register('name')} className="input" placeholder="Название вашего ресурса" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Описание *</label>
            <textarea
              {...register('description')}
              rows={5}
              className="input resize-none"
              placeholder="Подробно опишите ваш ресурс, его особенности и применение..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Тип ресурса *</label>
            <select {...register('typeId')} className="input">
              <option value="">Выберите тип</option>
              {typesData?.data?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.typeId && <p className="text-red-500 text-xs mt-1">{errors.typeId.message}</p>}
          </div>

          <div>
            <label className="label">Лицензия *</label>
            <select {...register('licenseId')} className="input">
              <option value="">Выберите лицензию</option>
              {licensesData?.data?.map((l) => (
                <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
              ))}
            </select>
            {errors.licenseId && <p className="text-red-500 text-xs mt-1">{errors.licenseId.message}</p>}
          </div>

          <div>
            <label className="label">Теги <span className="text-text-muted">(через запятую)</span></label>
            <input {...register('tags')} className="input" placeholder="минимализм, sans-serif, кириллица" />
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-text-primary text-lg">Цена</h2>
          <div>
            <label className="label">Цена (₽)</label>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              className="input"
              min={0}
              placeholder="0 — бесплатно"
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>
        </div>

        {/* Font specifics */}
        {isFont && (
          <div className="card p-6 space-y-5">
            <h2 className="font-semibold text-text-primary text-lg">Характеристики шрифта</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Семейство шрифта</label>
                <input {...register('fontFamily')} className="input" placeholder="Inter" />
              </div>
              <div>
                <label className="label">Стиль</label>
                <select {...register('fontStyle')} className="input">
                  <option value="">Выберите</option>
                  {['Regular', 'Bold', 'Italic', 'Bold Italic', 'Light', 'Medium', 'SemiBold', 'ExtraBold', 'Black'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Формат</label>
                <select {...register('fontFormat')} className="input">
                  <option value="">Выберите</option>
                  {['TTF', 'OTF', 'WOFF', 'WOFF2', 'TTF+OTF', 'WOFF+WOFF2', 'Все форматы'].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Preview image */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary text-lg mb-4">Превью-изображение</h2>
          <p className="text-sm text-text-muted mb-4">Одно изображение для отображения в каталоге (JPG, PNG)</p>

          {previewObjectUrl ? (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-200 w-48">
              <img src={previewObjectUrl} alt="" className="w-full h-full object-cover" />
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
            </div>
          ) : (
            <label className="w-48 aspect-[4/3] rounded-xl border-2 border-dashed border-surface-300 hover:border-primary-400 cursor-pointer flex flex-col items-center justify-center gap-2 text-text-muted hover:text-primary-500 transition-colors">
              <Image className="w-6 h-6" />
              <span className="text-xs">Выбрать файл</span>
              <input type="file" accept="image/*" onChange={handlePreviewSelect} className="sr-only" />
            </label>
          )}
        </div>

        {/* Resource files */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary text-lg mb-4">Файлы ресурса *</h2>
          <p className="text-sm text-text-muted mb-4">Загрузите файлы вашего ресурса (ZIP, TTF, OTF, SVG, PDF...)</p>

          <div className="space-y-2 mb-4">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-surface-100 rounded-xl">
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                <span className="text-sm text-text-secondary flex-1 truncate">{f.name}</span>
                <span className="text-xs text-text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-text-muted hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-surface-300 hover:border-primary-400 rounded-xl cursor-pointer text-text-muted hover:text-primary-500 transition-colors">
            <Plus className="w-5 h-5" />
            <span className="text-sm">Добавить файлы</span>
            <input type="file" multiple onChange={handleFileAdd} className="sr-only" />
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-4 text-base">
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Отправить на проверку
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-outline px-6"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
