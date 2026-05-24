import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, CheckCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import PageHead from '@/components/ui/PageHead'
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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
        <PageHead title="Пароль изменён" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.2),transparent_70%)] top-[40%] left-[60%] animate-[meshMove3_18s_ease-in-out_infinite]" />
        <div className="w-full max-w-md relative z-10 animate-scale-in">
          <div className="bg-white rounded-2xl shadow-card-xl p-10 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Пароль изменён!</h2>
            <p className="text-text-secondary mb-6">Теперь вы можете войти с новым паролем.</p>
            <Link to="/login" className="btn-primary w-full">Войти</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
      <PageHead title="Сброс пароля" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.2),transparent_70%)] top-[40%] left-[60%] animate-[meshMove3_18s_ease-in-out_infinite]" />
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Новый пароль</h1>
          <p className="text-white/60 mt-2">Придумайте надёжный пароль для вашего аккаунта</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card-xl p-8">
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
