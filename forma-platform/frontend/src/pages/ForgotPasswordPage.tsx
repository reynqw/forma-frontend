import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, CheckCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      toast.error('Ошибка. Проверьте email и попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-3">Письмо отправлено!</h2>
          <p className="text-text-secondary mb-6">
            Проверьте вашу почту. Следуйте инструкции в письме для сброса пароля.
          </p>
          <Link to="/login" className="btn-primary w-full">Вернуться ко входу</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-primary-50 rounded-2xl items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Восстановление пароля</h1>
          <p className="text-text-secondary mt-2">Введите email — пришлём ссылку для сброса</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Отправка...' : 'Отправить письмо'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            <Link to="/login" className="text-primary-500 hover:text-primary-600">
              ← Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
