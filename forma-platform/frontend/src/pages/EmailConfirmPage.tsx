import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { authApi } from '@/api/auth'

export default function EmailConfirmPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    authApi
      .confirmEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
      <div className="card p-10 text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-primary-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-text-primary">Подтверждение email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-3">Email подтверждён!</h2>
            <p className="text-text-secondary mb-6">Ваш аккаунт успешно активирован. Теперь вы можете войти.</p>
            <Link to="/login" className="btn-primary w-full">Войти в аккаунт</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-3">Ошибка подтверждения</h2>
            <p className="text-text-secondary mb-6">
              Ссылка недействительна или уже использована. Попробуйте зарегистрироваться снова.
            </p>
            <Link to="/register" className="btn-primary w-full">Зарегистрироваться</Link>
          </>
        )}
      </div>
    </div>
  )
}
