import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Palette, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { authorApi } from '@/api/author'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'

export default function BecomeAuthorPage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()

  const [username, setUsername] = useState('')
  const [biography, setBiography] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [error, setError] = useState('')

  // Проверяем, есть ли уже заявка
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['author-application-status'],
    queryFn: () => authorApi.getApplicationStatus(),
  })

  const applicationStatus = statusData?.data

  // Если пользователь уже автор — перенаправляем на дашборд
  useEffect(() => {
    if (user?.role === 'AUTHOR' || user?.role === 'ADMIN') {
      if (applicationStatus?.verificationStatus === 'VERIFIED') {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, applicationStatus, navigate])

  const applyMutation = useMutation({
    mutationFn: () =>
      authorApi.applyBecomeAuthor({ username, biography, portfolio }),
    onSuccess: (res) => {
      // Обновляем роль в сторе
      updateUser({ role: 'AUTHOR' })
      setError('')
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.response?.data?.error || 'Произошла ошибка'
      setError(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Введите имя автора')
      return
    }
    if (username.trim().length < 3) {
      setError('Имя автора должно быть не менее 3 символов')
      return
    }

    applyMutation.mutate()
  }

  if (statusLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  // Если заявка уже подана — показываем статус
  if (applicationStatus?.hasApplication) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-8 text-center">
          {applicationStatus.verificationStatus === 'PENDING' && (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Заявка на рассмотрении
              </h1>
              <p className="text-text-secondary mb-6">
                Ваша заявка на статус автора под именем{' '}
                <span className="font-semibold text-text-primary">
                  {applicationStatus.username}
                </span>{' '}
                отправлена на модерацию. Мы уведомим вас о результате.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                <Clock className="w-4 h-4" />
                Статус: Ожидает рассмотрения
              </div>
            </>
          )}

          {applicationStatus.verificationStatus === 'VERIFIED' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Вы автор!
              </h1>
              <p className="text-text-secondary mb-6">
                Ваша заявка одобрена. Теперь вы можете загружать ресурсы и управлять своим каталогом.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary px-6 py-3"
              >
                Перейти в панель автора
              </button>
            </>
          )}

          {applicationStatus.verificationStatus === 'REJECTED' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Заявка отклонена
              </h1>
              <p className="text-text-secondary mb-6">
                К сожалению, ваша заявка на статус автора была отклонена.
                Обратитесь в поддержку для получения дополнительной информации.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                <XCircle className="w-4 h-4" />
                Статус: Отклонена
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Если заявка уже подана успешно в текущей сессии
  if (applyMutation.isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Заявка отправлена!
          </h1>
          <p className="text-text-secondary mb-6">
            Ваша заявка на статус автора успешно отправлена на модерацию.
            Мы уведомим вас о результате в ближайшее время.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
            <Clock className="w-4 h-4" />
            Статус: Ожидает рассмотрения
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Стать автором
        </h1>
        <p className="text-text-secondary max-w-md mx-auto">
          Заполните форму ниже, чтобы подать заявку на статус автора.
          После одобрения вы сможете загружать и продавать свои ресурсы.
        </p>
      </div>

      {/* Преимущества */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">💰</div>
          <h3 className="font-semibold text-text-primary text-sm mb-1">70% дохода</h3>
          <p className="text-xs text-text-secondary">От каждой продажи</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold text-text-primary text-sm mb-1">Аналитика</h3>
          <p className="text-xs text-text-secondary">Панель продаж</p>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🌐</div>
          <h3 className="font-semibold text-text-primary text-sm mb-1">Аудитория</h3>
          <p className="text-xs text-text-secondary">Тысячи покупателей</p>
        </div>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-text-primary mb-6">
          Заявка на статус автора
        </h2>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Имя автора */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-1.5">
              Имя автора <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Например: designer_pro"
              className="input"
              maxLength={100}
              required
            />
            <p className="text-xs text-text-secondary mt-1">
              Уникальное имя, которое будет отображаться на платформе (от 3 символов)
            </p>
          </div>

          {/* Портфолио */}
          <div>
            <label htmlFor="portfolio" className="block text-sm font-medium text-text-primary mb-1.5">
              Ссылка на портфолио
            </label>
            <input
              id="portfolio"
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://behance.net/your-profile"
              className="input"
              maxLength={500}
            />
            <p className="text-xs text-text-secondary mt-1">
              Behance, Dribbble или личный сайт с вашими работами
            </p>
          </div>

          {/* Биография */}
          <div>
            <label htmlFor="biography" className="block text-sm font-medium text-text-primary mb-1.5">
              О себе
            </label>
            <textarea
              id="biography"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              placeholder="Расскажите о себе, вашем опыте и направлении работы..."
              className="input min-h-[120px] resize-y"
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-text-secondary mt-1">
              {biography.length}/2000 символов
            </p>
          </div>
        </div>

        {/* Кнопка отправки */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={applyMutation.isPending}
            className="btn-primary w-full sm:w-auto px-8 py-3 text-base font-semibold disabled:opacity-60"
          >
            {applyMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Отправка...
              </span>
            ) : (
              'Отправить заявку'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost text-text-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
