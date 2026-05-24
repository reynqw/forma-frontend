import { Link } from 'react-router-dom'
import { Github, Twitter, Mail } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dark-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <ScrollReveal direction="up" delay={0} className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-logo text-2xl text-white">FORMA</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Платформа для продажи и покупки высококачественных шрифтов и дизайн-ресурсов.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary-400 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-primary-400 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@forma.design"
                className="text-gray-500 hover:text-primary-400 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </ScrollReveal>

          {/* Catalog */}
          <ScrollReveal direction="up" delay={100}>
            <h4 className="text-sm font-semibold text-white mb-4">Каталог</h4>
            <ul className="space-y-2">
              {[
                { label: 'Все ресурсы', href: '/catalog' },
                { label: 'Шрифты', href: '/catalog?typeId=1' },
                { label: 'Иконки', href: '/catalog?typeId=2' },
                { label: 'Иллюстрации', href: '/catalog?typeId=3' },
                { label: 'Шаблоны', href: '/catalog?typeId=4' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-250"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* Для авторов */}
          <ScrollReveal direction="up" delay={200}>
            <h4 className="text-sm font-semibold text-white mb-4">Для авторов</h4>
            <ul className="space-y-2">
              {[
                { label: 'Стать автором', href: '/become-author' },
                { label: 'Загрузить ресурс', href: '/resources/upload' },
                { label: 'Дашборд', href: '/dashboard' },
                { label: 'Условия монетизации', href: '/terms/monetization' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-250"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          {/* Поддержка */}
          <ScrollReveal direction="up" delay={300}>
            <h4 className="text-sm font-semibold text-white mb-4">Поддержка</h4>
            <ul className="space-y-2">
              {[
                { label: 'Помощь', href: '/help' },
                { label: 'Лицензии', href: '/licenses' },
                { label: 'Политика конфиденциальности', href: '/privacy' },
                { label: 'Условия использования', href: '/terms' },
                { label: 'DMCA', href: '/dmca' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-250"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {year} FORMA. Все права защищены.
          </p>
          <p className="text-xs text-gray-600">
            Платформа для профессиональных дизайн-ресурсов
          </p>
        </div>
      </div>
    </footer>
  )
}
