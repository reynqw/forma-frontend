import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ArrowRight, CheckCircle, Check, Sparkles } from 'lucide-react'
import { authApi } from '@/api/auth'
import PageHead from '@/components/ui/PageHead'
import toast from 'react-hot-toast'

const schema = z
  .object({
    firstName: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
    lastName: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
    email: z.string().email('Введите корректный email'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[A-Z]/, 'Нужна хотя бы одна заглавная буква')
      .regex(/[0-9]/, 'Нужна хотя бы одна цифра'),
    confirmPassword: z.string(),
    agree: z.literal(true, { errorMap: () => ({ message: 'Необходимо принять условия' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strengthLevel = strength.filter(Boolean).length

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      })
      setSuccess(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Ошибка при регистрации'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
        <PageHead title="Аккаунт создан" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />

        <div className="w-full max-w-md relative z-10 animate-scale-in">
          <div className="bg-white rounded-2xl shadow-card-xl p-10 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Аккаунт создан!</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              На ваш email отправлено письмо для подтверждения. Проверьте почту и перейдите
              по ссылке для активации аккаунта.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full py-3.5 group">
              <span className="flex items-center justify-center gap-2">
                Перейти ко входу
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#1e1250]">
      <PageHead title="Регистрация" />
      {/* Left — decorative panel with mesh gradient */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
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

          {/* Center branding */}
          <div className="animate-fade-in-up">
            <span className="font-logo text-7xl text-white/10 block mb-6 select-none">FORMA</span>
            <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
              Присоединяйтесь
              <br />
              <span className="text-white/70">к сообществу</span>
            </h2>
            <p className="text-white/60 text-lg max-w-sm leading-relaxed">
              Создайте аккаунт и получите доступ к тысячам премиальных дизайн-ресурсов.
            </p>
          </div>

          {/* Benefits card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-white/80" />
              <span className="text-white/90 font-semibold text-sm">Преимущества регистрации</span>
            </div>
            <div className="space-y-3">
              {[
                'Доступ к тысячам премиальных ресурсов',
                'Сохранение избранного и истории покупок',
                'Эксклюзивные скидки и промокоды',
                'Ранний доступ к новым коллекциям',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
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

        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 py-8">
          <div className="w-full max-w-[440px] animate-fade-in-up">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-text-primary mb-2">Регистрация</h1>
              <p className="text-text-secondary">
                Создайте аккаунт и получите доступ к тысячам премиальных ресурсов
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Имя</label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className="input"
                    placeholder="Иван"
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Фамилия</label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className="input"
                    placeholder="Иванов"
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

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
                <label className="label">
                  Телефон <span className="text-text-muted">(необязательно)</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input"
                  placeholder="+7 (999) 000-00-00"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="label">Пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="input pr-12"
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < strengthLevel
                              ? strengthLevel <= 1
                                ? 'bg-red-500'
                                : strengthLevel <= 2
                                ? 'bg-yellow-500'
                                : strengthLevel <= 3
                                ? 'bg-blue-500'
                                : 'bg-green-500'
                              : 'bg-surface-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-muted">
                      {strengthLevel <= 1 && 'Слабый пароль'}
                      {strengthLevel === 2 && 'Умеренный пароль'}
                      {strengthLevel === 3 && 'Хороший пароль'}
                      {strengthLevel === 4 && 'Надёжный пароль'}
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="label">Подтвердить пароль</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className="input"
                  placeholder="Повторите пароль"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Agreement checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  {...register('agree')}
                  id="agree"
                  className="mt-1 w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="agree" className="text-xs text-text-secondary leading-relaxed cursor-pointer">
                  Я подтверждаю, что мне 18 лет или больше, и соглашаюсь с нашей{' '}
                  <Link to="/privacy" className="text-primary-500 hover:text-primary-600 font-medium">
                    политикой конфиденциальности
                  </Link>{' '}
                  и{' '}
                  <Link to="/terms" className="text-primary-500 hover:text-primary-600 font-medium">
                    условиями использования
                  </Link>
                </label>
              </div>
              {errors.agree && (
                <p className="text-red-500 text-xs -mt-2">{errors.agree.message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-base group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Регистрация...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Зарегистрироваться
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
                Войти
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="px-6 sm:px-12 lg:px-16 py-4 text-center">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} FORMA. Все права защищены.
          </p>
        </div>
      </div>
    </div>
  )
}
