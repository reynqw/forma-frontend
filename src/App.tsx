import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useNotificationStore } from '@/store/notificationStore'

import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'
import Spinner from '@/components/ui/Spinner'
import ScrollProgress from '@/components/ui/ScrollProgress'

// Eagerly loaded — critical first-paint pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import CatalogPage from '@/pages/CatalogPage'

// Lazy loaded — split into separate chunks
const ResourceDetailPage = lazy(() => import('@/pages/ResourceDetailPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'))
const OrdersPage = lazy(() => import('@/pages/OrdersPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const AuthorPublicPage = lazy(() => import('@/pages/AuthorPublicPage'))
const AuthorDashboardPage = lazy(() => import('@/pages/AuthorDashboardPage'))
const UploadResourcePage = lazy(() => import('@/pages/UploadResourcePage'))
const EditResourcePage = lazy(() => import('@/pages/EditResourcePage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const EmailConfirmPage = lazy(() => import('@/pages/EmailConfirmPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'))
const PaymentFailPage = lazy(() => import('@/pages/PaymentFailPage'))
const BecomeAuthorPage = lazy(() => import('@/pages/BecomeAuthorPage'))
const MyPurchasesPage = lazy(() => import('@/pages/MyPurchasesPage'))
const AiStudioPage = lazy(() => import('@/pages/AiStudioPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const HelpPage = lazy(() => import('@/pages/static/HelpPage'))
const LicensesPage = lazy(() => import('@/pages/static/LicensesPage'))
const PrivacyPage = lazy(() => import('@/pages/static/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/static/TermsPage'))
const DmcaPage = lazy(() => import('@/pages/static/DmcaPage'))
const MonetizationTermsPage = lazy(() => import('@/pages/static/MonetizationTermsPage'))
const ContactsPage = lazy(() => import('@/pages/static/ContactsPage'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )
}

export default function App() {
  const { isAuthenticated } = useAuthStore()
  const { fetchCart } = useCartStore()
  const { fetchUnreadCount } = useNotificationStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 60_000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchCart, fetchUnreadCount])

  return (
    <>
    <ScrollProgress />
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Auth pages — full-screen, outside Layout (no navbar/footer) */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/resources/:slug" element={<ResourceDetailPage />} />
          <Route path="/authors/:username" element={<AuthorPublicPage />} />
          <Route path="/confirm-email" element={<EmailConfirmPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/fail" element={<PaymentFailPage />} />

          {/* Static / info pages */}
          <Route path="/help" element={<HelpPage />} />
          <Route path="/licenses" element={<LicensesPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/dmca" element={<DmcaPage />} />
          <Route path="/terms/monetization" element={<MonetizationTermsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />

          {/* Protected: all authenticated */}
          <Route
            path="/cart"
            element={<ProtectedRoute><CartPage /></ProtectedRoute>}
          />
          <Route
            path="/checkout"
            element={<Navigate to="/cart" replace />}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
          />
          <Route
            path="/favorites"
            element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute><OrdersPage /></ProtectedRoute>}
          />
          <Route
            path="/notifications"
            element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>}
          />
          <Route
            path="/become-author"
            element={<ProtectedRoute><BecomeAuthorPage /></ProtectedRoute>}
          />
          <Route
            path="/purchases"
            element={<ProtectedRoute><MyPurchasesPage /></ProtectedRoute>}
          />
          <Route
            path="/ai-studio"
            element={
              <ProtectedRoute roles={['AUTHOR', 'ADMIN']}>
                <AiStudioPage />
              </ProtectedRoute>
            }
          />

          {/* Protected: Author or Admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['AUTHOR', 'ADMIN']}>
                <AuthorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/upload"
            element={
              <ProtectedRoute roles={['AUTHOR', 'ADMIN']}>
                <UploadResourcePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources/:id/edit"
            element={
              <ProtectedRoute roles={['AUTHOR', 'ADMIN']}>
                <EditResourcePage />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin only */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
    </>
  )
}
