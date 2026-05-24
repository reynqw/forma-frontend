import { Link } from 'react-router-dom'
import { Mail, Send } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'

const CATALOG_LINKS = [
  { label: 'Все ресурсы', href: '/catalog' },
  { label: 'Шрифты', href: '/catalog?typeId=1' },
  { label: 'Иконки', href: '/catalog?typeId=2' },
  { label: 'Иллюстрации', href: '/catalog?typeId=3' },
  { label: 'Шаблоны', href: '/catalog?typeId=4' },
]

const AUTHOR_LINKS = [
  { label: 'Стать автором', href: '/become-author' },
  { label: 'Загрузить ресурс', href: '/resources/upload' },
  { label: 'Дашборд', href: '/dashboard' },
  { label: 'Условия монетизации', href: '/terms/monetization' },
]

const SUPPORT_LINKS = [
  { label: 'Помощь', href: '/help' },
  { label: 'Контакты', href: '/contacts' },
  { label: 'Лицензии', href: '/licenses' },
  { label: 'Политика конфиденциальности', href: '/privacy' },
  { label: 'Условия использования', href: '/terms' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative bg-dark-900 mt-20 overflow-hidden">
      {/* Subtle gradient accent at top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <ScrollReveal direction="up" delay={0} className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <span className="text-white font-bold text-base">F</span>
              </div>
              <span className="font-logo text-2xl text-white">FORMA</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Платформа для продажи и покупки высококачественных шрифтов и дизайн-ресурсов.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/forma_support"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-primary-400 hover:bg-white/10 transition-all duration-300"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@forma.design"
                className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-primary-400 hover:bg-white/10 transition-all duration-300"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </ScrollReveal>

          {/* Catalog */}
          <ScrollReveal direction="up" delay={100}>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Каталог</h4>
            <ul className="space-y-2.5">
              {CATALOG_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-250">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* Authors */}
          <ScrollReveal direction="up" delay={200}>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Для авторов</h4>
            <ul className="space-y-2.5">
              {AUTHOR_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-250">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* Support */}
          <ScrollReveal direction="up" delay={300}>
            <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">Поддержка</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-250">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        <div className="border-t border-white/10 mt-12 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {year} FORMA. Все права защищены.
          </p>
          <p className="text-xs text-gray-600">
            Дизайн-ресурсы от профессионалов
          </p>
        </div>
      </div>
    </footer>
  )
}
