import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
          <div className="text-center max-w-md animate-fade-in-up">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Что-то пошло не так
            </h1>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу
              или вернуться на главную.
            </p>

            {this.state.error && (
              <div className="bg-white border border-surface-300 rounded-xl p-4 mb-8 text-left">
                <p className="text-xs text-text-muted font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="btn-primary px-6 py-3"
              >
                <RefreshCw className="w-4 h-4" />
                Перезагрузить
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn-outline px-6 py-3"
              >
                <Home className="w-4 h-4" />
                На главную
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
