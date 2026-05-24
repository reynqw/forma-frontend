import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import PageHead from '@/components/ui/PageHead'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await authApi.login(data)
      const { user, accessToken, refreshToken } = res.data
      login(user, accessToken, refreshToken)
      toast.success(`Добро пожаловать, ${user.firstName}!`)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Неверный email или пароль'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#1e1250]">
      <PageHead title="Вход" />
      {/* Left — decorative panel with mesh gradient */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
        {/* Animated mesh blobs */}
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-50 blur-[100px]" style={{ background: 'radial-gradient(circle, #6B4CE6, transparent 70%)', top: '-15%', left: '-10%', animation: 'meshMove1 12s ease-in-out infinite' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-40 blur-[80px]" style={{ background: 'radial-gradient(circle, #9B7EF2, transparent 70%)', top: '40%', right: '0%', animation: 'meshMove2 15s ease-in-out infinite' }} />
        <div className="absolute w-[350px] h-[350px] rounded-full opacity-35 blur-[80px]" style={{ background: 'radial-gradient(circle, #b49eff, transparent 70%)', bottom: '-5%', left: '20%', animation: 'meshMove3 18s ease-in-out infinite' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-logo text-[28px] text-white tracking-wide">Forma</span>
          </Link>

          {/* Center text */}
          <div className="animate-fade-in-up">
            <h2 className="font-display text-5xl font-bold text-white leading-tight mb-4">
              Дизайн-ресурсы
              <br />
              <span className="text-white/70">нового уровня</span>
            </h2>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              Тысячи шрифтов, иконок и шаблонов от профессиональных дизайнеров — всё в одном месте.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-8">
            {[
              { value: '1000+', label: 'ресурсов' },
              { value: '50+', label: 'авторов' },
              { value: '10K+', label: 'скачиваний' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form (rounded card overlapping left panel) */}
      <div className="flex-1 flex flex-col min-h-screen bg-white lg:rounded-l-[40px] lg:shadow-[-8px_0_30px_rgba(0,0,0,0.12)] relative z-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-logo text-[28px] text-primary-500 tracking-wide">Forma</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16">
          <div className="w-full max-w-[420px] animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2">Вход</h1>
              <p className="text-text-secondary">
                С возвращением! Войдите в свой аккаунт.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Почта</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input"
                  placeholder="example@email.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Пароль</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="input pr-12"
                    placeholder="Минимум 8 символов"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base mt-2 group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Вход...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Войти
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-sm text-text-muted">Преимущества FORMA</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              {[
                'Доступ к тысячам премиальных ресурсов',
                'Сохранение избранного и истории покупок',
                'Эксклюзивные скидки и промокоды',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm text-text-secondary">
                  <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary-500" />
                  </div>
                  {benefit}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-text-secondary">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="px-6 sm:px-12 lg:px-16 py-6 text-center">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} FORMA. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  )
}
