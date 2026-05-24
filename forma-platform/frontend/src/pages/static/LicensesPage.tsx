import { Shield, Check, X } from 'lucide-react'

const LICENSES = [
  {
    name: 'Personal',
    type: 'Персональная',
    description: 'Использование в личных, некоммерческих проектах.',
    allowed: [
      'Использование в личных проектах',
      'Модификация и адаптация',
      'Использование в портфолио',
    ],
    forbidden: [
      'Коммерческое использование',
      'Перепродажа или распространение',
      'Использование в продуктах для продажи',
    ],
    color: 'bg-blue-50 border-blue-200 text-blue-600',
  },
  {
    name: 'Commercial',
    type: 'Коммерческая',
    description: 'Использование в коммерческих проектах для одного клиента или компании.',
    allowed: [
      'Все права персональной лицензии',
      'Использование в коммерческих проектах',
      'Использование для одного клиента',
      'Использование в веб-сайтах и приложениях',
    ],
    forbidden: [
      'Перепродажа или сублицензирование',
      'Распространение исходных файлов',
      'Использование в шаблонах для продажи',
    ],
    color: 'bg-green-50 border-green-200 text-green-600',
  },
  {
    name: 'Extended',
    type: 'Расширенная',
    description: 'Неограниченное коммерческое использование без ограничений по количеству проектов.',
    allowed: [
      'Все права коммерческой лицензии',
      'Неограниченное количество проектов',
      'Использование в продуктах для продажи',
      'Использование в печатных тиражах',
    ],
    forbidden: [
      'Перепродажа самого ресурса',
      'Распространение исходных файлов как своих',
    ],
    color: 'bg-purple-50 border-purple-200 text-purple-600',
  },
]

export default function LicensesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Лицензии</h1>
        <p className="text-text-secondary max-w-xl mx-auto">
          Каждый ресурс на FORMA имеет тип лицензии, определяющий условия использования
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LICENSES.map((lic) => (
          <div key={lic.name} className={`card p-6 border-2 ${lic.color.split(' ').slice(1, 2).join(' ')}`}>
            <div className={`inline-flex px-3 py-1 rounded-lg text-sm font-semibold mb-3 ${lic.color}`}>
              {lic.type}
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">{lic.name}</h2>
            <p className="text-sm text-text-secondary mb-5">{lic.description}</p>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">Разрешено</h3>
                <ul className="space-y-1.5">
                  {lic.allowed.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">Запрещено</h3>
                <ul className="space-y-1.5">
                  {lic.forbidden.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                      <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 card p-6 bg-surface-100">
        <h3 className="font-semibold text-text-primary mb-2">Важно</h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          Лицензия привязывается к покупке и подтверждается уникальным лицензионным ключом.
          Тип лицензии указан на странице каждого ресурса. При возникновении вопросов о допустимости
          использования обращайтесь в поддержку.
        </p>
      </div>
    </div>
  )
}
