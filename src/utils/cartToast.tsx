import toast from 'react-hot-toast'
import { ShoppingCart } from 'lucide-react'

export function showCartAddedToast() {
  toast.custom(
    (t) => (
      <div
        className={`flex items-center gap-3 bg-white shadow-card-lg rounded-xl px-4 py-3 border border-surface-200 ${
          t.visible ? 'animate-fade-in-up' : 'opacity-0'
        }`}
      >
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
          <ShoppingCart className="w-4 h-4 text-green-500" />
        </div>
        <span className="text-sm font-medium text-text-primary">Добавлено в корзину</span>
        <a
          href="/cart"
          onClick={() => toast.dismiss(t.id)}
          className="ml-2 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap"
        >
          Перейти
        </a>
      </div>
    ),
    { duration: 4000, position: 'top-center' }
  )
}
