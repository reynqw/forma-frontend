import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Zap, Shield, Star, TrendingUp, Upload, Search, Download, CreditCard } from 'lucide-react'
import { resourcesApi } from '@/api/resources'
import { useAuthStore } from '@/store/authStore'
import ResourceCard from '@/components/ui/ResourceCard'
import { ResourceGridSkeleton } from '@/components/ui/Skeleton'
import ScrollReveal from '@/components/ui/ScrollReveal'
import PageHead from '@/components/ui/PageHead'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import Marquee from '@/components/ui/Marquee'
import GradientText from '@/components/ui/GradientText'
import { useCursorGlow } from '@/hooks/useCursorGlow'

const CATEGORIES = [
  { name: 'Шрифты', icon: '🔤', typeId: 1, desc: 'Кириллица и латиница', color: 'from-violet-500/10 to-purple-500/10' },
  { name: 'Иконки', icon: '⚡', typeId: 2, desc: 'SVG и PNG наборы', color: 'from-amber-500/10 to-orange-500/10' },
  { name: 'Иллюстрации', icon: '🎨', typeId: 3, desc: 'Векторная графика', color: 'from-pink-500/10 to-rose-500/10' },
  { name: 'Шаблоны', icon: '📐', typeId: 4, desc: 'Готовые макеты', color: 'from-cyan-500/10 to-blue-500/10' },
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

const HOW_IT_WORKS = [
  { icon: Search, title: 'Найдите', desc: 'Ищите среди тысяч ресурсов по категории, тегу или ключевому слову' },
  { icon: CreditCard, title: 'Купите', desc: 'Безопасная оплата через Robokassa — мгновенный доступ после покупки' },
  { icon: Download, title: 'Скачайте', desc: 'Загружайте файлы в оригинальном качестве с лицензионным ключом' },
]

const MARQUEE_ITEMS = [
  'Adobe Illustrator', 'Figma', 'Photoshop', 'Sketch', 'Canva',
  'After Effects', 'Procreate', 'Blender', 'InDesign', 'XD',
  'Cinema 4D', 'Affinity Designer', 'CorelDRAW', 'Framer',
]

const STATS = [
  { value: 1000, suffix: '+', label: 'Ресурсов' },
  { value: 50, suffix: '+', label: 'Авторов' },
  { value: 5000, suffix: '+', label: 'Скачиваний' },
  { value: 98, suffix: '%', label: 'Довольных' },
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

  const heroRef = useCursorGlow<HTMLElement>()
  const resources = featuredData?.data?.content ?? []
  const freeResources = freeData?.data?.content ?? []

  return (
    <div>
      <PageHead title="" description="Тысячи высококачественных шрифтов, иконок, иллюстраций и шаблонов от профессиональных дизайнеров." />

      {/* ═══════ HERO — Mesh Gradient ═══════ */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Cursor glow */}
        <div
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-0 hover-parent-opacity transition-opacity duration-500 z-[1]"
          style={{
            background: 'radial-gradient(circle, rgba(155,126,242,0.15) 0%, transparent 70%)',
            left: 'var(--glow-x, -500px)',
            top: 'var(--glow-y, -500px)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-[#1e1250]">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-60 blur-[120px]"
            style={{
              background: 'radial-gradient(circle, #6B4CE6 0%, transparent 70%)',
              top: '-10%', left: '-5%',
              animation: 'meshMove1 12s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-50 blur-[100px]"
            style={{
              background: 'radial-gradient(circle, #9B7EF2 0%, transparent 70%)',
              top: '20%', right: '-5%',
              animation: 'meshMove2 15s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-40 blur-[80px]"
            style={{
              background: 'radial-gradient(circle, #b49eff 0%, transparent 70%)',
              bottom: '-10%', left: '30%',
              animation: 'meshMove3 18s ease-in-out infinite',
            }}
          />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm border border-white/10 animate-hero-badge">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Платформа дизайн-ресурсов
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-hero-text">
            Дизайн-ресурсы для{' '}
            <br className="hidden sm:block" />
            <GradientText className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold">
              вашего следующего проекта
            </GradientText>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed animate-stagger-2">
            Тысячи высококачественных шрифтов, иконок, иллюстраций и шаблонов от
            профессиональных дизайнеров. Бесплатные и платные ресурсы с лицензией.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-stagger-3">
            <Link
              to="/catalog"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl text-lg hover:shadow-[0_0_40px_rgba(107,76,230,0.3)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Открыть каталог
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to={isAuthenticated ? '/become-author' : '/register'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold rounded-xl text-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-sm active:scale-[0.98]"
            >
              <Upload className="w-5 h-5" />
              Стать автором
            </Link>
          </div>

          {/* Animated stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 animate-stagger-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2200} />
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Marquee — совместимость с инструментами ═══════ */}
      <section className="py-8 bg-white border-b border-surface-200">
        <p className="text-center text-xs text-text-muted uppercase tracking-widest mb-4">Совместимо с вашими инструментами</p>
        <Marquee speed={35} className="text-text-secondary">
          {MARQUEE_ITEMS.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-surface-100 text-sm font-medium text-text-secondary whitespace-nowrap hover:bg-primary-50 hover:text-primary-500 transition-colors duration-200"
            >
              {item}
            </span>
          ))}
        </Marquee>
      </section>

      {/* ═══════ Categories ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Категории</h2>
            <p className="text-text-secondary">Найдите нужный тип ресурсов</p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, i) => (
            <ScrollReveal key={cat.typeId} delay={i * 100}>
              <Link
                to={`/catalog?typeId=${cat.typeId}`}
                className={`card p-7 text-center hover:shadow-card-xl hover:-translate-y-2 transition-all duration-500 group bg-gradient-to-br ${cat.color}`}
              >
                <div className="text-4xl mb-3 transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">{cat.icon}</div>
                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary-500 transition-colors duration-300">
                  {cat.name}
                </h3>
                <p className="text-sm text-text-secondary">{cat.desc}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ═══════ Featured resources ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <ScrollReveal>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-1">Популярное</h2>
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
          <ResourceGridSkeleton count={8} />
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

      {/* ═══════ How it works ═══════ */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-text-primary mb-3">Как это работает</h2>
              <p className="text-text-secondary">Три простых шага до вашего идеального ресурса</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 z-0" />

            {HOW_IT_WORKS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 150}>
                <div className="relative flex flex-col items-center text-center group">
                  {/* Step number circle */}
                  <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/20 transition-all duration-500 group-hover:shadow-primary-500/40 group-hover:scale-110 group-hover:-rotate-3">
                    <step.icon className="w-10 h-10 text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold text-primary-600 shadow-md">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-text-primary mb-2">{step.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-[260px]">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Free resources ═══════ */}
      {freeResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-1">Бесплатно</h2>
                <p className="text-text-secondary text-sm">Качественные ресурсы без оплаты</p>
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
        </section>
      )}

      {/* ═══════ Features ═══════ */}
      <section className="bg-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-text-primary mb-3">Почему FORMA?</h2>
              <p className="text-text-secondary">Надёжная платформа для дизайнеров и авторов</p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 120}>
                <div className="card p-7 hover:shadow-card-xl hover:-translate-y-2 transition-all duration-500 group h-full border border-transparent hover:border-primary-100">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:bg-primary-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-primary-500/20">
                    <feature.icon className="w-7 h-7 text-primary-500 transition-colors duration-500 group-hover:text-white" />
                  </div>
                  <h3 className="font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <ScrollReveal distance={40}>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl p-12 sm:p-16 text-center group">
            {/* Mesh gradient CTA background */}
            <div className="absolute inset-0 bg-[#1e1250]">
              <div
                className="absolute w-[400px] h-[400px] rounded-full opacity-60 blur-[100px]"
                style={{
                  background: 'radial-gradient(circle, #6B4CE6, transparent 70%)',
                  top: '-20%', right: '-10%',
                  animation: 'meshMove1 10s ease-in-out infinite',
                }}
              />
              <div
                className="absolute w-[350px] h-[350px] rounded-full opacity-50 blur-[80px]"
                style={{
                  background: 'radial-gradient(circle, #9B7EF2, transparent 70%)',
                  bottom: '-20%', left: '-5%',
                  animation: 'meshMove2 13s ease-in-out infinite',
                }}
              />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Готовы поделиться своими работами?
              </h2>
              <p className="text-white/70 mb-8 text-lg max-w-lg mx-auto">
                Зарегистрируйтесь как автор и начните зарабатывать на своих дизайн-ресурсах.
                Вы получаете <span className="text-white font-semibold">70%</span> от каждой продажи.
              </p>
              <Link
                to={isAuthenticated ? '/become-author' : '/register'}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl text-lg hover:shadow-[0_0_40px_rgba(107,76,230,0.3)] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Начать продавать
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  )
}
