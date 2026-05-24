import { Link } from 'react-router-dom'
import { XCircle, ShoppingCart, RotateCcw } from 'lucide-react'

export default function PaymentFailPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
      <div className="card p-12 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">Ошибка оплаты</h1>
        <p className="text-text-secondary mb-8">
          Платёж не был завершён. Ваша корзина сохранена. Попробуйте ещё раз или выберите
          другой способ оплаты.
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/cart" className="btn-primary w-full py-3">
            <RotateCcw className="w-4 h-4" />
            Попробовать снова
          </Link>
          <Link to="/catalog" className="btn-outline w-full py-3">
            <ShoppingCart className="w-4 h-4" />
            Вернуться в каталог
          </Link>
        </div>
      </div>
    </div>
  )
}
