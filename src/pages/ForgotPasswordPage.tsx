import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, CheckCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import PageHead from '@/components/ui/PageHead'
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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
        <PageHead title="Письмо отправлено" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />

        <div className="w-full max-w-md relative z-10 animate-scale-in">
          <div className="bg-white rounded-2xl shadow-card-xl p-10 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Письмо отправлено!</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Проверьте вашу почту. Следуйте инструкции в письме для сброса пароля.
            </p>
            <Link to="/login" className="btn-primary w-full py-3">Вернуться ко входу</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
      <PageHead title="Восстановление пароля" />
      {/* Mesh gradient blobs */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl items-center justify-center mb-4 border border-white/20">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Восстановление пароля</h1>
          <p className="text-white/60 mt-2">Введите email — пришлём ссылку для сброса</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card-xl p-8">
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
