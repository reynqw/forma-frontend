import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useNotificationStore } from '@/store/notificationStore'

import Layout from '@/components/layout/Layout'
import ProtectedRoute from '@/components/ui/ProtectedRoute'

import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import CatalogPage from '@/pages/CatalogPage'
import ResourceDetailPage from '@/pages/ResourceDetailPage'
import CartPage from '@/pages/CartPage'
// CheckoutPage replaced by multi-step CartPage
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import FavoritesPage from '@/pages/FavoritesPage'
import OrdersPage from '@/pages/OrdersPage'
import NotificationsPage from '@/pages/NotificationsPage'
import AuthorPublicPage from '@/pages/AuthorPublicPage'
import AuthorDashboardPage from '@/pages/AuthorDashboardPage'
import UploadResourcePage from '@/pages/UploadResourcePage'
import EditResourcePage from '@/pages/EditResourcePage'
import AdminPage from '@/pages/AdminPage'
import EmailConfirmPage from '@/pages/EmailConfirmPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import PaymentSuccessPage from '@/pages/PaymentSuccessPage'
import PaymentFailPage from '@/pages/PaymentFailPage'
import BecomeAuthorPage from '@/pages/BecomeAuthorPage'
import MyPurchasesPage from '@/pages/MyPurchasesPage'
import AiStudioPage from '@/pages/AiStudioPage'
import NotFoundPage from '@/pages/NotFoundPage'
import HelpPage from '@/pages/static/HelpPage'
import LicensesPage from '@/pages/static/LicensesPage'
import PrivacyPage from '@/pages/static/PrivacyPage'
import TermsPage from '@/pages/static/TermsPage'
import DmcaPage from '@/pages/static/DmcaPage'
import MonetizationTermsPage from '@/pages/static/MonetizationTermsPage'

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

        {/* Auth redirects — moved outside Layout for full-screen design */}

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
  )
}
