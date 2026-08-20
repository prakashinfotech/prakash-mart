import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Layout } from '@/shared/components/layout/Layout'

const HomePage = lazy(() => import('@/features/product/pages/HomePage'))
const ProductListPage = lazy(() => import('@/features/product/pages/ProductListPage'))
const ProductDetailPage = lazy(() => import('@/features/product/pages/ProductDetailPage'))
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/features/order/pages/CheckoutPage'))
const OrdersPage = lazy(() => import('@/features/order/pages/OrdersPage'))
const OrderDetailPage = lazy(() => import('@/features/order/pages/OrderDetailPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const SellerDashboardPage = lazy(() => import('@/features/seller/pages/SellerDashboardPage'))
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const WishlistPage = lazy(() => import('@/features/wishlist/pages/WishlistPage'))
const UserProfilePage = lazy(() => import('@/features/profile/pages/UserProfilePage'))
const WalletPage = lazy(() => import('@/features/wallet/pages/WalletPage'))

const Loader = () => (
  <div className="flex items-center justify-center h-64 text-primary text-sm">Loading...</div>
)

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
)

export function productDetailUrl(product: { slug: string }): string {
  return `/products/${product.slug}`
}

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: '/orders/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  SELLER_DASHBOARD: '/seller',
  ADMIN_DASHBOARD: '/admin',
  WISHLIST: '/wishlist',
  PROFILE: '/profile',
  WALLET: '/wallet',
} as const

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: ROUTES.HOME, element: wrap(HomePage) },
      { path: ROUTES.PRODUCTS, element: wrap(ProductListPage) },
      { path: ROUTES.PRODUCT_DETAIL, element: wrap(ProductDetailPage) },
      { path: ROUTES.CART, element: wrap(CartPage) },
      { path: ROUTES.CHECKOUT, element: wrap(CheckoutPage) },
      { path: ROUTES.ORDERS, element: wrap(OrdersPage) },
      { path: ROUTES.ORDER_DETAIL, element: wrap(OrderDetailPage) },
      { path: ROUTES.LOGIN, element: wrap(LoginPage) },
      { path: ROUTES.REGISTER, element: wrap(RegisterPage) },
      { path: ROUTES.FORGOT_PASSWORD, element: wrap(ForgotPasswordPage) },
      { path: ROUTES.RESET_PASSWORD, element: wrap(ResetPasswordPage) },
      { path: ROUTES.SELLER_DASHBOARD, element: wrap(SellerDashboardPage) },
      { path: ROUTES.ADMIN_DASHBOARD, element: wrap(AdminDashboardPage) },
      { path: ROUTES.WISHLIST, element: wrap(WishlistPage) },
      { path: ROUTES.PROFILE, element: wrap(UserProfilePage) },
      { path: ROUTES.WALLET, element: wrap(WalletPage) },
    ],
  },
])
