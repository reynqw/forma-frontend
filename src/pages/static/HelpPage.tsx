import { Link } from 'react-router-dom'
import { HelpCircle, ShoppingCart, Download, Upload, Shield, CreditCard, MessageCircle } from 'lucide-react'
import PageHead from '@/components/ui/PageHead'

const SECTIONS = [
  {
    icon: ShoppingCart,
    title: 'Как купить ресурс?',
    text: 'Найдите нужный ресурс в каталоге, добавьте его в корзину и оформите заказ. После оплаты ресурс станет доступен для скачивания в разделе «Мои покупки». Бесплатные ресурсы можно скачать сразу.',
  },
  {
    icon: Download,
    title: 'Как скачать купленный ресурс?',
    text: 'Перейдите в раздел «Мои покупки» в вашем профиле. Там вы найдёте все приобретённые ресурсы с кнопкой скачивания и уникальным лицензионным ключом.',
  },
  {
    icon: Upload,
    title: 'Как стать автором?',
    text: 'Зарегистрируйтесь на платформе и подайте заявку на статус автора через раздел «Стать автором». После одобрения модератором вы сможете загружать и продавать свои ресурсы.',
  },
  {
    icon: CreditCard,
    title: 'Как получить доход?',
    text: 'Авторы получают 70% от каждой продажи. Накопленные средства можно вывести через панель автора, указав реквизиты для перевода. Минимальная сумма вывода — 100 ₽.',
  },
  {
    icon: Shield,
    title: 'Как защищены мои покупки?',
    text: 'Каждая покупка сопровождается уникальным лицензионным ключом, подтверждающим ваше право на использование ресурса. Все ресурсы проходят модерацию перед публикацией.',
  },
  {
    icon: MessageCircle,
    title: 'Как оставить отзыв?',
    text: 'Откройте страницу приобретённого ресурса и прокрутите вниз до раздела «Отзывы». Там вы сможете поставить оценку и написать комментарий.',
  },
]

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHead title="Помощь" />
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Помощь</h1>
        <p className="text-text-secondary max-w-xl mx-auto">
          Ответы на часто задаваемые вопросы о работе платформы FORMA
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="card p-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary mb-2">{s.title}</h2>
                <p className="text-sm text-text-secondary leading-relaxed">{s.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 card p-8 text-center bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-text-primary mb-2">Не нашли ответ?</h3>
        <p className="text-sm text-text-secondary mb-4">
          Свяжитесь с нами по электронной почте, и мы поможем решить ваш вопрос.
        </p>
        <a href="mailto:support@forma.design" className="btn-primary inline-flex">
          Написать в поддержку
        </a>
      </div>
    </div>
  )
}
