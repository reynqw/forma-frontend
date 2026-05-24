import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, CheckCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'

const schema = z
  .object({
    password: z.string().min(8, 'Минимум 8 символов'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { toast.error('Недействительная ссылка'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(token, data.password)
      setDone(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-3">Пароль изменён!</h2>
          <p className="text-text-secondary mb-6">Теперь вы можете войти с новым паролем.</p>
          <Link to="/login" className="btn-primary w-full">Войти</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary-50 rounded-2xl items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Новый пароль</h1>
          <p className="text-text-secondary mt-2">Придумайте надёжный пароль для вашего аккаунта</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Новый пароль</label>
              <input type="password" {...register('password')} className="input" autoComplete="new-password" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Подтвердите пароль</label>
              <input type="password" {...register('confirmPassword')} className="input" autoComplete="new-password" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
