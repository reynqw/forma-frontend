import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Zap, Shield, Star, TrendingUp } from 'lucide-react'
import { resourcesApi } from '@/api/resources'
import { useAuthStore } from '@/store/authStore'
import ResourceCard from '@/components/ui/ResourceCard'
import Spinner from '@/components/ui/Spinner'
import ScrollReveal from '@/components/ui/ScrollReveal'

const CATEGORIES = [
  { name: 'Шрифты', emoji: '🔤', typeId: 1, desc: 'Кириллица и латиница' },
  { name: 'Иконки', emoji: '⚡', typeId: 2, desc: 'SVG и PNG наборы' },
  { name: 'Иллюстрации', emoji: '🎨', typeId: 3, desc: 'Векторная графика' },
  { name: 'Шаблоны', emoji: '📐', typeId: 4, desc: 'Готовые макеты' },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Мгновенная доставка',
    desc: 'Скачивайте ресурсы сразу после покупки — никаких ожиданий.',
  },
  {
    icon: Shield,
    title: 'Безопасные лицензии',
    desc: 'Каждая покупка защищена уникальным лицензионным ключом.',
  },
  {
    icon: Star,
    title: 'Проверенные авторы',
    desc: 'Все материалы проходят модерацию перед публикацией.',
  },
  {
    icon: TrendingUp,
    title: 'Доход авторам',
    desc: 'Авторы получают 70% от каждой продажи своих работ.',
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const { data: featuredData, isLoading } = useQuery({
    queryKey: ['resources', 'featured'],
    queryFn: () =>
      resourcesApi.getCatalog({ page: 0, size: 8, sortBy: 'downloadCount', sortDir: 'desc' }),
  })

  const { data: freeData } = useQuery({
    queryKey: ['resources', 'free'],
    queryFn: () =>
      resourcesApi.getCatalog({ page: 0, size: 4, maxPrice: 0 }),
  })

  const resources = featuredData?.data?.content ?? []
  const freeResources = freeData?.data?.content ?? []

  return (
    <div>
      {/* Hero — gradient background per Figma */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800">
        {/* Animated background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50 pointer-events-none" />

        {/* Decorative gradient orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm animate-hero-badge">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Платформа дизайн-ресурсов
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-hero-text">
            Дизайн-ресурсы{' '}
            <span className="text-white/90">для вашего</span>
            <br />
            следующего проекта
          </h1>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            Тысячи высококачественных шрифтов, иконок, иллюстраций и шаблонов от
            профессиональных дизайнеров. Бесплатные и платные ресурсы с лицензией.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            <Link to="/catalog" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg text-lg hover:bg-white/90 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">
              Открыть каталог
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link to={isAuthenticated ? "/become-author" : "/register"} className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-lg text-lg hover:bg-white/10 hover:border-white/60 transition-all duration-300">
              Стать автором
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-white/60 animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
            <span>✓ Более 1000 ресурсов</span>
            <span>✓ 50+ авторов</span>
            <span>✓ Безопасные платежи</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="section-title mb-2">Категории</h2>
            <p className="text-text-secondary">Найдите нужный тип ресурсов</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <ScrollReveal key={cat.typeId} delay={i * 100}>
              <Link
                to={`/catalog?typeId=${cat.typeId}`}
                className="card p-6 text-center hover:shadow-card-xl hover:-translate-y-1 transition-all duration-400 group"
              >
                <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">{cat.emoji}</div>
                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary-500 transition-colors duration-300">
                  {cat.name}
                </h3>
                <p className="text-sm text-text-secondary">{cat.desc}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Featured resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title mb-1">Популярное</h2>
              <p className="text-text-secondary text-sm">Самые скачиваемые ресурсы</p>
            </div>
            <Link
              to="/catalog?sortBy=downloadCount&sortDir=desc"
              className="btn-ghost text-primary-500 hover:text-primary-600 font-medium group"
            >
              Смотреть все
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resources.map((r, i) => (
              <ScrollReveal key={r.id} delay={i * 80} distance={20}>
                <ResourceCard resource={r} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      {/* Free resources */}
      {freeResources.length > 0 && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="section-title mb-1">Бесплатно</h2>
                  <p className="text-text-secondary text-sm">Ресурсы без оплаты</p>
                </div>
                <Link
                  to="/catalog?maxPrice=0"
                  className="btn-ghost text-primary-500 hover:text-primary-600 font-medium group"
                >
                  Смотреть все
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {freeResources.map((r, i) => (
                <ScrollReveal key={r.id} delay={i * 80} distance={20}>
                  <ResourceCard resource={r} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Почему FORMA?</h2>
            <p className="text-text-secondary">Надёжная платформа для дизайнеров и авторов</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 120}>
              <div className="card p-6 hover:shadow-card-xl hover:-translate-y-1 transition-all duration-400 group h-full">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-primary-100 group-hover:scale-105">
                  <feature.icon className="w-6 h-6 text-primary-500 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary-600 transition-colors duration-300">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal distance={40}>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 p-12 text-center group">
            {/* Decorative orbs */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-150" />

            <h2 className="text-3xl font-bold text-white mb-4 relative">
              Готовы поделиться своими работами?
            </h2>
            <p className="text-white/80 mb-8 relative">
              Зарегистрируйтесь как автор и начните зарабатывать на своих дизайн-ресурсах.
              <br />
              Вы получаете 70% от каждой продажи.
            </p>
            <Link to={isAuthenticated ? "/become-author" : "/register"} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg text-lg hover:bg-white/90 hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 relative">
              Начать продавать
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
