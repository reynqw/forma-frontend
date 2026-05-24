import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'Произошла ошибка при загрузке данных', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1.5">Ошибка</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline px-6 py-2.5 text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Попробовать снова
        </button>
      )}
    </div>
  )
}
