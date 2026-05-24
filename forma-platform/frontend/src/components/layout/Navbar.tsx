import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Bell, User, LogOut, Settings, LayoutDashboard, Shield, Search, Menu, X, Heart, Palette, Package, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useNotificationStore } from '@/store/notificationStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { count: cartCount } = useCartStore()
  const { unreadCount } = useNotificationStore()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  // Header blur on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    toast.success('Вы вышли из аккаунта')
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  const navLinks = [
    { label: 'Каталог', href: '/catalog' },
    { label: 'Шрифты', href: '/catalog?typeId=1' },
    { label: 'Иконки', href: '/catalog?typeId=2' },
    { label: 'Иллюстрации', href: '/catalog?typeId=3' },
    { label: 'Шаблоны', href: '/catalog?typeId=4' },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-header'
          : 'bg-white shadow-header'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo — Figma style script font */}
          <Link to="/" className="flex items-center shrink-0 group">
            <span className="font-logo text-[28px] text-primary-500 transition-colors duration-300 group-hover:text-primary-600 tracking-wide">
              Forma
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="relative px-3 py-2 text-sm text-text-secondary hover:text-primary-500 rounded-lg hover:bg-primary-50 transition-all duration-250 font-medium group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-500 rounded-full transition-all duration-300 group-hover:w-3/4" />
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`btn-ghost p-2 transition-all duration-250 ${searchOpen ? 'text-primary-500 bg-primary-50' : ''}`}
              aria-label="Поиск"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="btn-ghost p-2 relative group" aria-label="Корзина">
                  <ShoppingCart className="w-5 h-5 transition-transform duration-250 group-hover:scale-110" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full text-xs text-white flex items-center justify-center font-medium animate-scale-in">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="btn-ghost p-2 relative group" aria-label="Уведомления">
                  <Bell className="w-5 h-5 transition-transform duration-250 group-hover:scale-110" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium notification-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-200 transition-all duration-250"
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover transition-transform duration-250 hover:scale-105" />
                    ) : (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center transition-transform duration-250 hover:scale-105">
                        <span className="text-primary-600 text-sm font-semibold">
                          {user?.firstName?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-text-primary font-medium hidden sm:block">{user?.firstName}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-surface-300 rounded-2xl shadow-card-lg py-1 z-50 dropdown-menu">
                      <div className="px-4 py-3 border-b border-surface-200">
                        <p className="text-sm font-semibold text-text-primary">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary-500 hover:bg-primary-50 transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Профиль
                      </Link>

                      <Link
                        to="/favorites"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary-500 hover:bg-primary-50 transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        Избранное
                      </Link>

                      <Link
                        to="/purchases"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary-500 hover:bg-primary-50 transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Package className="w-4 h-4" />
                        Мои покупки
                      </Link>

                      {user?.role === 'BUYER' && (
                        <Link
                          to="/become-author"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 font-medium"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Palette className="w-4 h-4" />
                          Стать автором
                        </Link>
                      )}

                      {(user?.role === 'AUTHOR' || user?.role === 'ADMIN') && (
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary-500 hover:bg-primary-50 transition-all duration-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Дашборд
                        </Link>
                      )}

                      {(user?.role === 'AUTHOR' || user?.role === 'ADMIN') && (
                        <Link
                          to="/ai-studio"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 font-medium"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Sparkles className="w-4 h-4" />
                          AI Studio
                        </Link>
                      )}

                      {user?.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary-500 hover:bg-primary-50 transition-all duration-200"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Администрирование
                        </Link>
                      )}

                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary-500 hover:bg-primary-50 transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Настройки
                      </Link>

                      <div className="border-t border-surface-200 mt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm px-4 py-2 hidden sm:flex font-medium">
                  Войти
                </Link>
                <Link to="/register" className="btn-primary text-sm px-5 py-2.5">
                  Регистрация
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <div className="relative w-5 h-5">
                <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          className={`overflow-hidden transition-all duration-350 ease-apple ${
            searchOpen ? 'max-h-20 opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              autoFocus={searchOpen}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск шрифтов, иконок, иллюстраций..."
              className="input flex-1 py-2.5"
            />
            <button type="submit" className="btn-primary py-2.5 px-5">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-apple ${
            mobileOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-1 border-t border-surface-200 pt-3">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-3 py-2 text-sm text-text-secondary hover:text-primary-500 rounded-lg hover:bg-primary-50 transition-all duration-200"
                style={{ transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms' }}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === 'BUYER' && (
              <Link
                to="/become-author"
                className="block px-3 py-2 text-sm text-primary-500 font-medium hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
              >
                Стать автором
              </Link>
            )}
            {!isAuthenticated && (
              <Link
                to="/login"
                className="block px-3 py-2 text-sm text-text-secondary hover:text-primary-500 rounded-lg hover:bg-primary-50 transition-all duration-200"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
