import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'
import PageHead from '@/components/ui/PageHead'

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 relative overflow-hidden">
      <PageHead title="Страница не найдена" />

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[80px]"
          style={{ background: 'radial-gradient(circle, #6B4CE6, transparent 70%)', top: '10%', right: '10%', animation: 'meshMove1 12s ease-in-out infinite' }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[60px]"
          style={{ background: 'radial-gradient(circle, #9B7EF2, transparent 70%)', bottom: '10%', left: '15%', animation: 'meshMove2 15s ease-in-out infinite' }}
        />
      </div>

      <div className="text-center relative z-10 animate-fade-in-up">
        {/* Big 404 */}
        <div className="relative mb-6">
          <span className="text-[160px] sm:text-[200px] font-extrabold leading-none select-none bg-gradient-to-b from-primary-300/20 to-transparent bg-clip-text text-transparent">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[160px] sm:text-[200px] font-extrabold leading-none gradient-text select-none" style={{ animation: 'gradientShift 4s linear infinite', backgroundImage: 'linear-gradient(90deg, #6B4CE6, #9B7EF2, #b49eff, #9B7EF2, #6B4CE6)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            404
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">Страница не найдена</h1>
        <p className="text-text-secondary mb-10 max-w-md mx-auto leading-relaxed">
          Эта страница не существует, была удалена или вы перешли по неверной ссылке.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="btn-ghost border border-surface-300 px-6 py-3 rounded-xl flex items-center gap-2 hover:border-primary-300 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <Link to="/" className="btn-primary px-6 py-3 flex items-center gap-2">
            <Home className="w-4 h-4" />
            На главную
          </Link>
          <Link
            to="/catalog"
            className="btn-ghost border border-surface-300 px-6 py-3 rounded-xl flex items-center gap-2 hover:border-primary-300 transition-all duration-300"
          >
            <Search className="w-4 h-4" />
            В каталог
          </Link>
        </div>
      </div>
    </div>
  )
}
