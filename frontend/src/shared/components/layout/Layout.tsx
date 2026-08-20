import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ToastContainer } from '@/shared/components/ui/Toast'
import { CartDrawer } from '@/features/cart/components/CartDrawer'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastContainer />
      <CartDrawer />
    </div>
  )
}
