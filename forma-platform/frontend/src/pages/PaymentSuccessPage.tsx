import { Link } from 'react-router-dom'
import { CheckCircle, Package } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
      <div className="card p-12 text-center max-w-md w-full">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">Оплата прошла успешно!</h1>
        <p className="text-text-secondary mb-8">
          Ваш заказ оформлен. Лицензионные ключи и ссылки на скачивание доступны в разделе
          «Мои заказы».
        </p>

        <div className="flex flex-col gap-3">
          <Link to="/orders" className="btn-primary w-full py-3">
            <Package className="w-4 h-4" />
            Перейти к заказам
          </Link>
          <Link to="/catalog" className="btn-outline w-full py-3">
            Продолжить покупки
          </Link>
        </div>
      </div>
    </div>
  )
}
