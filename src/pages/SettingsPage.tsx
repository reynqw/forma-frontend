import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Bell, Save, Camera, Trash2, Mail, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'
import apiClient from '@/api/client'
import Spinner from '@/components/ui/Spinner'
import PageHead from '@/components/ui/PageHead'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import UserAvatar from '@/components/ui/UserAvatar'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Минимум 2 символа'),
  lastName: z.string().min(2, 'Минимум 2 символа'),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Допускаются только изображения')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Максимальный размер — 5 МБ')
      return
    }

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await apiClient.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateUser({ avatarUrl: res.data.avatarUrl })
      toast.success('Аватарка обновлена!')
    } catch {
      toast.error('Ошибка загрузки аватарки')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleAvatarDelete = async () => {
    setUploadingAvatar(true)
    try {
      await apiClient.delete('/users/me/avatar')
      updateUser({ avatarUrl: undefined })
      toast.success('Аватарка удалена')
    } catch {
      toast.error('Ошибка удаления')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!user?.email) return
    setResendingEmail(true)
    try {
      await authApi.resendConfirmation(user.email)
      toast.success('Письмо отправлено! Проверьте почту.')
    } catch {
      toast.error('Не удалось отправить письмо')
    } finally {
      setResendingEmail(false)
    }
  }

  const onProfileSave = async (data: ProfileForm) => {
    setSaving(true)
    try {
      const res = await apiClient.put('/users/me', data)
      updateUser(res.data)
      toast.success('Профиль обновлён')
    } catch {
      toast.error('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const onPasswordSave = async (data: PasswordForm) => {
    setSaving(true)
    try {
      await apiClient.put('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Пароль изменён')
      passwordForm.reset()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { key: 'profile', label: 'Профиль', icon: User },
    { key: 'security', label: 'Безопасность', icon: Lock },
    { key: 'notifications', label: 'Уведомления', icon: Bell },
  ] as const

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHead title="Настройки" />
      <Breadcrumbs items={[
        { label: 'Профиль', to: '/profile' },
        { label: 'Настройки' },
      ]} />
      <h1 className="text-3xl font-bold text-text-primary mb-8">Настройки</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-200 rounded-xl p-1 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-primary-500 shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="card p-8">
          <h2 className="font-semibold text-text-primary text-lg mb-6">Личные данные</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative group">
              <UserAvatar
                src={user?.avatarUrl}
                name={user?.firstName ?? ''}
                size={96}
                className="rounded-2xl"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="btn-outline text-sm py-2 px-4 cursor-pointer inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {user?.avatarUrl ? 'Сменить фото' : 'Загрузить фото'}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="sr-only"
                />
              </label>
              {user?.avatarUrl && (
                <button
                  onClick={handleAvatarDelete}
                  disabled={uploadingAvatar}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Удалить фото
                </button>
              )}
              <p className="text-[10px] text-text-muted">JPG, PNG, WebP. Макс. 5 МБ</p>
            </div>
          </div>

          <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Имя</label>
                <input {...profileForm.register('firstName')} className="input" />
                {profileForm.formState.errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="label">Фамилия</label>
                <input {...profileForm.register('lastName')} className="input" />
                {profileForm.formState.errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input value={user?.email} disabled className="input opacity-50 cursor-not-allowed" />
              {user && !user.emailConfirmed && (
                <div className="mt-2 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-700 font-medium">Email не подтверждён</p>
                    <p className="text-xs text-amber-600 mt-0.5">Подтвердите email для полного доступа к платформе.</p>
                  </div>
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resendingEmail}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {resendingEmail ? 'Отправка...' : 'Отправить повторно'}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="label">Телефон <span className="text-text-muted">(необязательно)</span></label>
              <input {...profileForm.register('phone')} className="input" placeholder="+7 (999) 000-00-00" />
            </div>

            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="card p-8">
          <h2 className="font-semibold text-text-primary text-lg mb-6">Смена пароля</h2>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSave)} className="space-y-5">
            <div>
              <label className="label">Текущий пароль</label>
              <input
                type="password"
                {...passwordForm.register('currentPassword')}
                className="input"
                autoComplete="current-password"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">Новый пароль</label>
              <input
                type="password"
                {...passwordForm.register('newPassword')}
                className="input"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="label">Повторите новый пароль</label>
              <input
                type="password"
                {...passwordForm.register('confirmPassword')}
                className="input"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              <Lock className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="card p-8">
          <h2 className="font-semibold text-text-primary text-lg mb-6">Настройки уведомлений</h2>
          <div className="space-y-4">
            {[
              { label: 'Уведомления о покупках', desc: 'При успешной оплате заказа' },
              { label: 'Новые отзывы', desc: 'Когда оставляют отзыв на ваши ресурсы' },
              { label: 'Модерация', desc: 'Статус проверки загруженных ресурсов' },
              { label: 'Системные уведомления', desc: 'Обновления платформы и важные сообщения' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-surface-200 last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-6 bg-surface-300 rounded-full peer peer-checked:bg-primary-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 after:shadow-sm" />
                </label>
              </div>
            ))}
          </div>
          <button
            className="btn-primary mt-6"
            onClick={() => toast.success('Настройки уведомлений сохранены')}
          >
            <Save className="w-4 h-4" />
            Сохранить
          </button>
        </div>
      )}
    </div>
  )
}
