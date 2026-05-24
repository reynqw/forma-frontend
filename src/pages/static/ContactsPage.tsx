import { Mail, MessageSquare, Clock, MapPin } from 'lucide-react'
import PageHead from '@/components/ui/PageHead'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import ScrollReveal from '@/components/ui/ScrollReveal'

const CONTACTS = [
  {
    icon: Mail,
    title: 'Email',
    value: 'support@forma.design',
    desc: 'Напишите нам по любым вопросам',
    href: 'mailto:support@forma.design',
  },
  {
    icon: MessageSquare,
    title: 'Чат поддержки',
    value: 'Telegram',
    desc: 'Быстрые ответы в мессенджере',
    href: 'https://t.me/forma_support',
  },
  {
    icon: Clock,
    title: 'Время работы',
    value: 'Пн — Пт, 9:00 — 18:00',
    desc: 'Московское время (UTC+3)',
  },
  {
    icon: MapPin,
    title: 'Адрес',
    value: 'Екатеринбург, Россия',
    desc: 'УГТУ (УГГУ)',
  },
]

export default function ContactsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHead title="Контакты" description="Свяжитесь с командой FORMA — поддержка, сотрудничество, предложения." />
      <Breadcrumbs items={[{ label: 'Контакты' }]} />

      <ScrollReveal>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-text-primary mb-3">Контакты</h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Мы всегда рады помочь. Свяжитесь с нами удобным способом — ответим в кратчайшие сроки.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        {CONTACTS.map((c, i) => (
          <ScrollReveal key={c.title} delay={i * 100}>
            <div className="card p-6 hover:shadow-card-xl hover:-translate-y-1 transition-all duration-400 group h-full">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors duration-300">
                <c.icon className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-semibold text-text-primary mb-1">{c.title}</h3>
              {c.href ? (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
                >
                  {c.value}
                </a>
              ) : (
                <p className="text-text-primary font-medium">{c.value}</p>
              )}
              <p className="text-sm text-text-secondary mt-1">{c.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* FAQ */}
      <ScrollReveal>
        <div className="card p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">Частые вопросы</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Как вернуть деньги за покупку?',
                a: 'Вы можете оформить возврат в течение 14 дней после покупки через раздел «Мои заказы». Деньги вернутся на исходный способ оплаты.',
              },
              {
                q: 'Как стать автором на платформе?',
                a: 'Перейдите в раздел «Стать автором», заполните форму и дождитесь одобрения модератором. После этого вы сможете загружать свои ресурсы.',
              },
              {
                q: 'Какие форматы файлов поддерживаются?',
                a: 'Мы поддерживаем все популярные форматы: OTF, TTF, WOFF/WOFF2 для шрифтов, SVG/PNG для иконок, AI/EPS/SVG для иллюстраций, Figma/Sketch/PSD для шаблонов.',
              },
              {
                q: 'Какой процент получает автор?',
                a: 'Авторы получают 70% от каждой продажи. Вывод средств доступен при накоплении минимальной суммы.',
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold text-text-primary mb-1.5">{faq.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  )
}
