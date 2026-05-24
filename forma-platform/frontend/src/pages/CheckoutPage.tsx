import { Navigate } from 'react-router-dom'

// Checkout flow is now handled by CartPage (multi-step)
export default function CheckoutPage() {
  return <Navigate to="/cart" replace />
}
