import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Trash2, ShoppingBag, ShoppingCart, ArrowRight, ArrowLeft,
  CreditCard, Wallet, Building2, Bitcoin, Shield, CheckCircle,
  Package, Mail
} from 'lucide-react'
import { cartApi } from '@/api/cart'
import { ordersApi } from '@/api/orders'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

// ====== Step Indicator ======
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Корзина' },
    { num: 2, label: 'Оформление' },
    { num: 3, label: 'Оплата' },
    { num: 4, label: 'Готово' },
  ]

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8 mb-10">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step.num < currentStep
                  ? 'bg-green-500 text-white'
                  : step.num === currentStep
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-200 text-text-muted'
              }`}
            >
              {step.num < currentStep ? <CheckCircle className="w-5 h-5" /> : step.num}
            </div>
            <span className={`text-xs mt-1.5 ${
              step.num <= currentStep ? 'text-text-primary font-medium' : 'text-text-muted'
            }`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mb-5 ${
              step.num < currentStep ? 'bg-green-500' : 'bg-surface-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const { removeItem, fetchCart } = useCartStore()
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [orderResult, setOrderResult] = useState<{ orderId: number; isFree: boolean } | null>(null)

  // Contact info for step 2
  const [contactName, setContactName] = useState(user ? `${user.firstName} ${user.lastName}` : '')
  const [contactEmail, setContactEmail] = useState(user?.email ?? '')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
    refetchOnMount: 'always',
  })

  const items = data?.data ?? []
  const total = items.reduce((sum, item) => sum + (item.resourcePrice ?? 0), 0)

  const handleRemove = async (resourceId: number) => {
    await removeItem(resourceId)
    refetch()
  }

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderRes = await ordersApi.createFromCart()
      const order = orderRes.data
      if (total === 0) {
        return { orderId: order.id, isFree: true, paymentUrl: null }
      }
      const payRes = await ordersApi.getPaymentUrl(order.id)
      return { orderId: order.id, isFree: false, paymentUrl: payRes.data.paymentUrl }
    },
    onSuccess: (result) => {
      if (result.isFree) {
        setOrderResult({ orderId: result.orderId, isFree: true })
        setStep(4)
        fetchCart()
        qc.invalidateQueries({ queryKey: ['cart'] })
      } else if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка оформления'
      toast.error(msg)
    },
  })

  // Демо-оплата: создаём заказ и сразу имитируем оплату
  const demoPayMutation = useMutation({
    mutationFn: async () => {
      const orderRes = await ordersApi.createFromCart()
      const order = orderRes.data
      const demoRes = await ordersApi.demoPay(order.id)
      return { orderId: demoRes.data.id }
    },
    onSuccess: (result) => {
      setOrderResult({ orderId: result.orderId, isFree: false })
      setStep(4)
      fetchCart()
      qc.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Демо-оплата выполнена успешно!')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ошибка демо-оплаты'
      toast.error(msg)
    },
  })

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-text-primary mb-2 uppercase">Корзина</h1>

      <StepIndicator currentStep={step} />

      {/* ====== STEP 1: Корзина ====== */}
      {step === 1 && (
        <>
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 text-surface-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">Корзина пуста</h2>
              <p className="text-text-secondary mb-6">Добавьте ресурсы из каталога</p>
              <Link to="/catalog" className="btn-primary">Перейти в каталог</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="card p-5 flex gap-4 items-center group">
                    <Link to={`/resources/${item.resourceSlug}`}>
                      <div className="w-16 h-14 rounded-xl overflow-hidden bg-surface-200 shrink-0 flex items-center justify-center">
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt={item.resourceName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary-500">{item.resourceName?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {item.typeName && (
                          <span className="text-[10px] font-semibold uppercase text-primary-500 bg-primary-50 px-1.5 py-0.5 rounded">
                            {item.typeName}
                          </span>
                        )}
                      </div>
                      <Link to={`/resources/${item.resourceSlug}`}
                        className="font-semibold text-text-primary hover:text-primary-500 transition-colors text-sm line-clamp-1">
                        {item.resourceName}
                      </Link>
                      {item.authorName && <p className="text-xs text-text-muted">от {item.authorName}</p>}
                    </div>

                    <div className="text-right flex items-center gap-4">
                      <span className="font-bold text-primary-500 text-lg">
                        {(item.resourcePrice ?? 0) === 0 ? 'Бесплатно' : `${item.resourcePrice}₽`}
                      </span>
                      <button
                        onClick={() => handleRemove(item.resourceId)}
                        className="text-red-400 hover:text-red-500 transition-colors text-xs"
                      >
                        × Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar: Итого */}
              <div className="lg:col-span-1">
                <div className="card p-6 sticky top-24">
                  <h2 className="font-semibold text-text-primary text-lg mb-5">Итого</h2>

                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-text-muted mb-2">
                      <span className="truncate mr-2">{item.typeName}:</span>
                      <span>{(item.resourcePrice ?? 0) === 0 ? 'Бесплатно' : `${item.resourcePrice}₽`}</span>
                    </div>
                  ))}

                  <div className="border-t border-surface-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-text-secondary font-medium">Сумма к оплате:</span>
                      <span className="text-2xl font-bold text-primary-500">
                        {total === 0 ? 'Бесплатно' : `${total.toLocaleString()}₽`}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary w-full py-4 text-base mb-3"
                  >
                    Оформить заказ
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link to="/catalog" className="btn-outline w-full py-3 text-sm text-center block">
                    Продолжить покупки
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ====== STEP 2: Оформление ====== */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="font-semibold text-text-primary text-lg mb-6">Контактные данные</h2>
              <div className="space-y-5">
                <div>
                  <label className="label">Имя и фамилия</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="input"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="label">Email для получения заказа</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="input"
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    На этот email будет отправлена защищённая ссылка для скачивания
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-semibold text-text-primary text-lg mb-4">Заказ</h2>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm mb-2">
                  <div>
                    <p className="text-text-primary font-medium">{item.resourceName}</p>
                    <p className="text-xs text-text-muted">{item.typeName}</p>
                  </div>
                  <span className="text-text-primary font-medium shrink-0">
                    {(item.resourcePrice ?? 0) === 0 ? 'Бесплатно' : `${item.resourcePrice}₽`}
                  </span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-4 mt-4 flex justify-between font-semibold">
                <span>Сумма к оплате:</span>
                <span className="text-xl text-primary-500">{total === 0 ? 'Бесплатно' : `${total.toLocaleString()}₽`}</span>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3">
                  <ArrowLeft className="w-4 h-4" /> Назад
                </button>
                <button
                  onClick={() => {
                    if (!contactName.trim()) { toast.error('Укажите имя'); return }
                    if (!contactEmail.trim()) { toast.error('Укажите email'); return }
                    if (total === 0) {
                      createOrderMutation.mutate()
                    } else {
                      setStep(3)
                    }
                  }}
                  className="btn-primary flex-1 py-3"
                >
                  {total === 0 ? 'Получить' : 'Далее'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== STEP 3: Оплата ====== */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="font-semibold text-text-primary text-lg mb-6 uppercase">Способ оплаты</h2>
              <div className="space-y-3">
                {[
                  { id: 'card', label: 'Карта', desc: 'Visa, Mastercard, МИР', icon: CreditCard },
                  { id: 'sbp', label: 'СБП', desc: 'Через банк', icon: Building2 },
                  { id: 'wallet', label: 'ЮMoney', desc: 'Кошелёк', icon: Wallet },
                  { id: 'crypto', label: 'Криптовалют', desc: 'USDT TRC-20', icon: Bitcoin },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      paymentMethod === method.id ? 'bg-primary-500 text-white' : 'bg-surface-200 text-text-muted'
                    }`}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{method.label}</p>
                      <p className="text-xs text-text-muted">{method.desc}</p>
                    </div>
                    <div className="ml-auto">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === method.id ? 'border-primary-500' : 'border-surface-300'
                      }`}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-semibold text-text-primary text-lg mb-4 uppercase">Заказ</h2>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm mb-2">
                  <div>
                    <p className="text-text-primary font-medium">{item.resourceName}</p>
                    <p className="text-xs text-text-muted">{item.typeName}</p>
                  </div>
                  <span className="text-text-primary font-medium shrink-0">{item.resourcePrice}₽</span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-4 mt-4 mb-4">
                <div className="flex justify-between font-semibold">
                  <span>Сумма к оплате:</span>
                  <span className="text-xl text-primary-500">{total.toLocaleString()}₽</span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="bg-green-50 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> ГАРАНТИИ:
                </p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-1.5 text-xs text-green-700">
                    <CheckCircle className="w-3 h-3" /> Возврат 14 дней
                  </li>
                  <li className="flex items-center gap-1.5 text-xs text-green-700">
                    <CheckCircle className="w-3 h-3" /> Бессрочный доступ
                  </li>
                </ul>
              </div>

              <button
                onClick={() => createOrderMutation.mutate()}
                disabled={createOrderMutation.isPending}
                className="btn-primary w-full py-4 text-base bg-green-500 hover:bg-green-600 mb-3"
              >
                {createOrderMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Оплатить {total.toLocaleString()}₽
                  </>
                )}
              </button>
              <button onClick={() => setStep(2)} className="btn-outline w-full py-3 text-sm">
                <ArrowLeft className="w-4 h-4" /> Назад
              </button>

              {/* Демо-оплата для защиты диплома */}
              <div className="border-t border-surface-200 mt-4 pt-4">
                <button
                  onClick={() => demoPayMutation.mutate()}
                  disabled={demoPayMutation.isPending}
                  className="w-full py-3 text-sm rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  {demoPayMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Демо-оплата (без Robokassa)
                    </>
                  )}
                </button>
                <p className="text-[10px] text-amber-600 text-center mt-1.5">
                  Имитация успешной оплаты для тестирования
                </p>
              </div>

              <p className="text-[10px] text-text-muted text-center mt-3 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Безопасная оплата через защищённое соединение
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====== STEP 4: Готово ====== */}
      {step === 4 && (
        <div className="max-w-lg mx-auto text-center">
          <div className="card p-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">Заказ оформлен!</h2>
            <p className="text-text-secondary mb-6">
              {orderResult?.isFree
                ? 'Ресурсы доступны для скачивания в личном кабинете.'
                : 'После оплаты ресурсы будут доступны для скачивания.'}
            </p>

            <div className="bg-primary-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Проверьте вашу почту</p>
                  <p className="text-xs text-text-muted mt-1">
                    На <strong>{contactEmail}</strong> отправлена защищённая одноразовая ссылка для скачивания.
                    Ссылка действительна 7 дней.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/purchases" className="btn-primary flex-1 py-3">
                <Package className="w-4 h-4" /> Мои покупки
              </Link>
              <Link to="/catalog" className="btn-outline flex-1 py-3">
                Каталог
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
