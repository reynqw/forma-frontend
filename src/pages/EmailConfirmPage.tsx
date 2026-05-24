import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { authApi } from '@/api/auth'
import PageHead from '@/components/ui/PageHead'

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
      <PageHead title="Подтверждение email" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.2),transparent_70%)] top-[40%] left-[60%] animate-[meshMove3_18s_ease-in-out_infinite]" />
      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="bg-white rounded-2xl shadow-card-xl p-10 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Подтверждение email...</h2>
              <p className="text-text-secondary mt-2">Пожалуйста, подождите</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Email подтверждён!</h2>
              <p className="text-text-secondary mb-6">Ваш аккаунт успешно активирован. Теперь вы можете войти.</p>
              <Link to="/login" className="btn-primary w-full">Войти в аккаунт</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Ошибка подтверждения</h2>
              <p className="text-text-secondary mb-6">
                Ссылка недействительна или уже использована. Попробуйте зарегистрироваться снова.
              </p>
              <Link to="/register" className="btn-primary w-full">Зарегистрироваться</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
