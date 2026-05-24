import { Link } from 'react-router-dom'
import { CheckCircle, Package } from 'lucide-react'
import PageHead from '@/components/ui/PageHead'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
      <PageHead title="Оплата успешна" />
      {/* Mesh gradient blobs */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="bg-white rounded-2xl shadow-card-xl p-12 text-center">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-3">Оплата прошла успешно!</h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
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
    </div>
  )
}
