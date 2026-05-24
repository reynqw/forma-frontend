import { DollarSign, TrendingUp, CreditCard, BarChart3 } from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: TrendingUp,
    label: '70%',
    desc: 'от каждой продажи получает автор',
  },
  {
    icon: CreditCard,
    label: '100 ₽',
    desc: 'минимальная сумма вывода',
  },
  {
    icon: BarChart3,
    label: '30%',
    desc: 'комиссия платформы',
  },
]

const SECTIONS = [
  {
    title: '1. Вознаграждение автора',
    text: 'Автор получает 70% от стоимости каждой продажи своего ресурса. Комиссия платформы составляет 30% и включает расходы на хостинг, обработку платежей, модерацию и поддержку инфраструктуры.',
  },
  {
    title: '2. Ценообразование',
    text: 'Автор самостоятельно устанавливает цену на свои ресурсы. Минимальная цена платного ресурса — 50 ₽. Авторы также могут публиковать бесплатные ресурсы. Платформа может проводить акции со скидками, о которых автор будет уведомлён заранее.',
  },
  {
    title: '3. Вывод средств',
    text: 'Накопленные средства доступны для вывода через панель автора. Минимальная сумма вывода составляет 100 ₽. Заявки на вывод обрабатываются в течение 5 рабочих дней. Доступные способы вывода: банковский перевод, электронные кошельки.',
  },
  {
    title: '4. Скидки и акции',
    text: 'Автор может устанавливать скидки на свои ресурсы через панель управления. Размер скидки указывается в процентах. Платформа может проводить общие акции (например, сезонные распродажи), в которых авторы участвуют добровольно.',
  },
  {
    title: '5. Статистика и аналитика',
    text: 'В панели автора доступна подробная статистика: количество продаж и загрузок; сумма заработка; средняя оценка ресурсов; динамика просмотров. Данные обновляются в реальном времени.',
  },
  {
    title: '6. Модерация ресурсов',
    text: 'Все загруженные ресурсы проходят модерацию перед публикацией. Модерация занимает до 3 рабочих дней. Ресурс может быть отклонён, если он не соответствует стандартам качества, нарушает авторские права или правила платформы. В случае отклонения автор получает обоснование и возможность исправить замечания.',
  },
  {
    title: '7. Ответственность автора',
    text: 'Автор гарантирует, что обладает правами на все загружаемые ресурсы. В случае обоснованной жалобы на нарушение авторских прав ресурс будет заблокирован. При повторных нарушениях учётная запись автора может быть заблокирована, а накопленные средства заморожены.',
  },
]

export default function MonetizationTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Условия монетизации</h1>
        <p className="text-text-secondary max-w-xl mx-auto">
          Как авторы зарабатывают на платформе FORMA
        </p>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {HIGHLIGHTS.map((h) => (
          <div key={h.label} className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <h.icon className="w-6 h-6 text-primary-500" />
            </div>
            <div className="text-2xl font-bold text-text-primary mb-1">{h.label}</div>
            <div className="text-sm text-text-secondary">{h.desc}</div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="card p-6">
            <h2 className="font-semibold text-text-primary mb-3">{s.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 card p-8 text-center bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-text-primary mb-2">Готовы начать зарабатывать?</h3>
        <p className="text-sm text-text-secondary mb-4">
          Подайте заявку на статус автора и начните продавать свои ресурсы уже сегодня.
        </p>
        <a href="/become-author" className="btn-primary inline-flex">
          Стать автором
        </a>
      </div>
    </div>
  )
}
