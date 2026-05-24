import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import PageTransition from '@/components/ui/PageTransition'
import ScrollToTop from '@/components/ui/ScrollToTop'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Перейти к содержимому
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}
