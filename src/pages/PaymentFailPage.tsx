import { Link } from 'react-router-dom'
import { XCircle, ShoppingCart, RotateCcw } from 'lucide-react'
import PageHead from '@/components/ui/PageHead'

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#1e1250]">
      <PageHead title="Ошибка оплаты" />
      {/* Mesh gradient blobs */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.3),transparent_70%)] top-[-200px] left-[-100px] animate-[meshMove1_12s_ease-in-out_infinite]" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] bottom-[-150px] right-[-100px] animate-[meshMove2_15s_ease-in-out_infinite]" />

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        <div className="bg-white rounded-2xl shadow-card-xl p-12 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-3">Ошибка оплаты</h1>
          <p className="text-text-secondary mb-8 leading-relaxed">
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
    </div>
  )
}
