import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-extrabold gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Страница не найдена</h1>
        <p className="text-text-secondary mb-8">
          Запрошенная страница не существует или была перемещена.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => window.history.back()} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" />
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
