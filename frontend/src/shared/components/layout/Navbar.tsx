import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, User, Search, LogOut, Package,
  LayoutDashboard, ShieldCheck, Heart, Wallet,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore'
import { useWalletStore } from '@/features/wallet/store/useWalletStore'
import { ROUTES } from '@/app/router'
import { productApi, type Suggestion } from '@/features/product/api/productApi'
import { categoryApi, type CategoryDto } from '@/features/category/api/categoryApi'
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications'

const TICKER_ITEMS = [
  'Free shipping on orders above ₹499',
  'Easy 30-day returns on every order',
  'No Cost EMI on 1,800+ products',
  'Verified sellers · Authentic products only',
  'Quick delivery · 24/7 customer support',
]

/* ── Top ticker bar ─────────────────────────────────────────── */
function TopBar() {
  return (
    <div className="h-[34px] bg-ink flex items-center overflow-hidden">
      <div className="max-w-[var(--container)] mx-auto w-full px-4 flex items-center justify-between gap-4">
        {/* Marquee */}
        <div className="flex-1 overflow-hidden marquee-wrap">
          <div className="marquee-track text-[11px] text-white/70 font-medium">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
              <span key={i} className="shrink-0">· {t}</span>
            ))}
          </div>
        </div>
        {/* Right links */}
        <div className="hidden md:flex items-center gap-5 text-[11px] text-white/60 font-medium shrink-0">
          <Link to={ROUTES.HOME} className="hover:text-white transition-colors whitespace-nowrap">Sell on PrakashMart</Link>
          <Link to={ROUTES.ORDERS} className="hover:text-white transition-colors whitespace-nowrap">Track Order</Link>
          <span className="text-white/30">|</span>
          <span className="text-white/60 whitespace-nowrap">EN · ₹ INR</span>
        </div>
      </div>
    </div>
  )
}

/* ── Search box ─────────────────────────────────────────────── */
function SearchBox({
  query, setQuery, suggestions, showSuggestions, setShowSuggestions,
  wrapperRef, onSubmit, onSuggestionClick,
}: {
  query: string
  setQuery: (v: string) => void
  suggestions: Suggestion[]
  showSuggestions: boolean
  setShowSuggestions: (v: boolean) => void
  wrapperRef: React.RefObject<HTMLDivElement>
  onSubmit: (e: React.FormEvent) => void
  onSuggestionClick: (term: string) => void
}) {
  const PLACEHOLDERS = [
    'Search for "linen shirt"…',
    'Search for "noise cancelling buds"…',
    'Search for "laptops under ₹50000"…',
  ]
  const [phIdx, setPhIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={onSubmit}>
        <div className="flex items-center bg-surface-2 border border-border rounded-[10px] h-10 px-3 gap-2 focus-within:border-primary focus-within:bg-white focus-within:shadow-glow transition-all duration-150">
          <Search size={16} className="text-muted shrink-0" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onKeyDown={e => e.key === 'Escape' && setShowSuggestions(false)}
            placeholder={PLACEHOLDERS[phIdx]}
            className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-muted outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted bg-border rounded px-1.5 py-0.5 font-mono shrink-0">
            ⌘ K
          </kbd>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-border rounded-[10px] shadow-3 z-50 overflow-hidden py-1">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSuggestionClick(s.term)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left hover:bg-surface-2 transition-colors"
              >
                <Search size={13} className="text-muted shrink-0" />
                <span className="text-ink flex-1">{s.term}</span>
                {s.type === 'brand' && (
                  <span className="text-[11px] text-muted shrink-0">Brand</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Category strip ─────────────────────────────────────────── */
function CategoryStrip({ categories }: { categories: CategoryDto[] }) {
  const navigate = useNavigate()
  if (categories.length === 0) return null

  return (
    <div className="bg-white border-t border-border">
      <div className="max-w-[var(--container)] mx-auto px-4 flex items-center gap-0 overflow-x-auto scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => navigate(`${ROUTES.PRODUCTS}?category=${encodeURIComponent(cat.name)}`)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-surface-2 whitespace-nowrap transition-colors duration-150 rounded-[10px]"
          >
            <span className="font-mono text-[10px] text-muted-2 font-medium px-[5px] py-[1px] bg-surface-2 rounded-[4px]">
              {String(i + 1).padStart(2, '0')}
            </span>
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main Navbar ─────────────────────────────────────────────── */
export function Navbar() {
  usePushNotifications()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null!)
  const navigate = useNavigate()

  const { isAuthenticated, user, logout } = useAuthStore()
  const handleLogout = () => { logout(); resetWallet(); navigate(ROUTES.HOME) }
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const wishlistCount = useWishlistStore(s => s.items.length)
  const { balance: walletBalance, loaded: walletLoaded, fetchBalance, reset: resetWallet } = useWalletStore()
  const openDrawer = useCartStore(s => s.openDrawer)

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Customer' && !walletLoaded) fetchBalance()
  }, [isAuthenticated, user?.role, walletLoaded, fetchBalance])

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    const timer = setTimeout(async () => {
      try {
        const data = await productApi.getSuggestions(query.trim())
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch { setSuggestions([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (term: string) => {
    navigate(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(term)}`)
    setQuery('')
    setShowSuggestions(false)
  }

  return (
    <header className="sticky top-0 z-50 shadow-2">
      <TopBar />

      {/* Main nav row */}
      <div className="bg-white border-b border-border">
        <div className="max-w-[var(--container)] mx-auto px-4 h-16 flex items-center gap-6">

          {/* Wordmark */}
          <Link
            to={ROUTES.HOME}
            className="shrink-0 flex items-center gap-2.5 select-none"
          >
            <span className="relative w-7 h-7 rounded-[8px] bg-gradient-to-br from-primary to-accent shadow-md flex-shrink-0">
              <span className="absolute inset-[6px] bg-white rounded-[4px]" />
            </span>
            <span className="font-bold text-[22px] tracking-tight text-ink leading-none">
              PrakashMart<span className="text-primary">.</span>
            </span>
            <span className="hidden lg:inline font-mono text-[9px] tracking-[0.1em] text-muted uppercase font-medium px-2 py-1 bg-surface-2 rounded-pill">
              Est. 2024
            </span>
          </Link>

          {/* Search */}
          <SearchBox
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            wrapperRef={wrapperRef}
            onSubmit={handleSearch}
            onSuggestionClick={handleSuggestionClick}
          />

          {/* Right actions */}
          <nav className="flex items-center gap-1 ml-auto shrink-0">
            {isAuthenticated ? (
              <>
                {user?.role === 'Admin' && (
                  <NavBtn to={ROUTES.ADMIN_DASHBOARD} icon={<ShieldCheck size={16} />} label="Admin" />
                )}
                {user?.role === 'Seller' && (
                  <NavBtn to={ROUTES.SELLER_DASHBOARD} icon={<LayoutDashboard size={16} />} label="Seller" />
                )}
                <NavBtn to={ROUTES.ORDERS} icon={<Package size={16} />} label="Orders" />
                {user?.role === 'Customer' && (
                  <NavBtn
                    to={ROUTES.WALLET}
                    icon={<Wallet size={16} />}
                    label={`₹${walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                  />
                )}
                <NavBtn to={ROUTES.PROFILE} icon={<User size={16} />} label={user?.name.split(' ')[0] ?? 'Profile'} />
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-medium text-muted hover:text-error hover:bg-error-tint transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
              >
                <User size={16} />
                <span className="hidden md:inline">Sign in</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link
              to={ROUTES.WISHLIST}
              title="Wishlist"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-medium text-muted hover:text-accent hover:bg-accent-tint transition-colors"
            >
              <Heart size={18} />
              <span className="hidden md:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-error text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={openDrawer}
              title="Cart"
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink transition-colors"
            >
              <ShoppingCart size={18} />
              <span className="hidden md:inline">Cart</span>
              {itemCount > 0 && (
                <span className="bg-primary text-white font-mono text-[10px] font-semibold min-w-[18px] h-[18px] px-[5px] rounded-full flex items-center justify-center leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      <CategoryStrip categories={categories} />
    </header>
  )
}

/* ── Nav button helper ────────────────────────────────────────── */
function NavBtn({
  to, icon, label,
}: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[13px] font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors whitespace-nowrap"
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  )
}
