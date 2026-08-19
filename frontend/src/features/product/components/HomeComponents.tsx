import { useNavigate } from 'react-router-dom'
import { Truck, RotateCcw, ShieldCheck, Zap } from 'lucide-react'
import { ROUTES } from '@/app/router'
import type { CategoryDto } from '@/features/category/api/categoryApi'
import type { BrandDto } from '@/features/brand/api/brandApi'

/* ── Per-category SVG icon + tint ─────────────────────────────── */
const CAT_TINTS: Record<string, { bg: string; fg: string }> = {
  Electronics:      { bg: '#E6F1FE', fg: '#006FEE' },
  Fashion:          { bg: '#FCEAF2', fg: '#D6336C' },
  'Home & Kitchen': { bg: '#E6F8EF', fg: '#17C964' },
  Books:            { bg: '#FFF4E0', fg: '#D97706' },
  Beauty:           { bg: '#FCE9F4', fg: '#DB2777' },
  Sports:           { bg: '#F0FDE5', fg: '#4D7C0F' },
  Toys:             { bg: '#FFEEDA', fg: '#F5A524' },
  Grocery:          { bg: '#E8F4FE', fg: '#0EA5E9' },
  Mobiles:          { bg: '#E6F1FE', fg: '#006FEE' },
  Appliances:       { bg: '#FFF4E0', fg: '#D97706' },
}

function CatIcon({ name, fg }: { name: string; fg: string }) {
  const p = {
    width: 28, height: 28, viewBox: '0 0 24 24',
    fill: 'none', stroke: fg, strokeWidth: 1.6,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'Mobiles':
    case 'Electronics':
      return <svg {...p}><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M11 18.5h2" stroke={fg} strokeWidth="1.8"/></svg>
    case 'Fashion':
      return <svg {...p}><path d="M9 3h6l5 3-2 3-3-1v13H6V8L3 9 1 6z"/></svg>
    case 'Home & Kitchen':
      return <svg {...p}><path d="M3 11 12 3l9 8v10H3z"/><path d="M10 21v-7h4v7"/></svg>
    case 'Books':
      return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    case 'Beauty':
      return <svg {...p}><path d="M10 2h4l1 3v3l-1 1H10L9 8V5z"/><path d="M9 9h6v9a3 3 0 0 1-3 3 3 3 0 0 1-3-3z"/></svg>
    case 'Sports':
      return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M4.93 4.93 19.07 19.07M12 3a9 9 0 0 1 9 9"/></svg>
    case 'Toys':
      return <svg {...p}><circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r="1" fill={fg}/><circle cx="15" cy="10" r="1" fill={fg}/><path d="M9 15c1 1.2 2 1.6 3 1.6S14 16.2 15 15"/></svg>
    case 'Grocery':
      return <svg {...p}><path d="M5 6h14l-1 11H6z"/><path d="M9 9V5a3 3 0 0 1 6 0v4"/></svg>
    case 'Appliances':
      return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="3.5"/><circle cx="7.5" cy="7" r="0.7" fill={fg}/></svg>
    default:
      return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
  }
}

/* ── Category Tiles ─────────────────────────────────────────── */
export function CategoryTiles({ categories }: { categories: CategoryDto[] }) {
  const navigate = useNavigate()
  if (categories.length === 0) return null

  return (
    <section className="max-w-[var(--container)] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-bold text-ink">Shop by Category</h2>
        <button
          onClick={() => navigate(ROUTES.PRODUCTS)}
          className="text-[13px] font-medium px-[14px] py-2 rounded-full border border-border bg-white text-ink hover:bg-ink hover:text-white hover:border-ink transition-all duration-150"
        >
          View all →
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3">
        {categories.map(cat => {
          const t = CAT_TINTS[cat.name] ?? { bg: '#F4F4F5', fg: '#71717A' }
          return (
            <button
              key={cat.id}
              onClick={() => navigate(`${ROUTES.PRODUCTS}?category=${encodeURIComponent(cat.name)}`)}
              style={{ borderRadius: '16px' }}
              className="flex flex-col items-center gap-2.5 px-2 pt-[16px] pb-[12px] bg-white border border-[#EBEBEB] hover:border-[#C0C0C0] hover:-translate-y-[2px] hover:shadow-md transition-all duration-200 text-center"
            >
              <span
                className="w-12 h-12 flex items-center justify-center shrink-0"
                style={{ background: t.bg, borderRadius: '12px' }}
              >
                <CatIcon name={cat.name} fg={t.fg} />
              </span>
              <span className="text-[12px] font-semibold text-ink leading-tight">{cat.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* ── Trust Strip ────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: Truck,       title: 'Free Shipping',     sub: 'On orders above ₹499' },
  { icon: RotateCcw,   title: '30-Day Returns',    sub: 'Hassle-free returns' },
  { icon: ShieldCheck, title: 'Authentic Only',     sub: 'Verified sellers & brands' },
  { icon: Zap,         title: 'Quick Delivery',     sub: 'Delivered to your door' },
]

export function TrustStrip() {
  return (
    <section className="max-w-[var(--container)] mx-auto px-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
          <div
            key={title}
            className="flex items-center gap-3 bg-white border border-border rounded-[10px] px-4 py-3 hover:shadow-2 transition-shadow"
          >
            <span className="w-9 h-9 rounded-[8px] bg-primary-50 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">{title}</p>
              <p className="text-[11px] text-muted">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Promo Strip ────────────────────────────────────────────── */
export function PromoStrip() {
  const navigate = useNavigate()
  return (
    <section className="max-w-[var(--container)] mx-auto px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => navigate(`${ROUTES.PRODUCTS}?category=Mobiles`)}
          className="relative overflow-hidden rounded-[12px] p-5 text-left bg-gradient-to-br from-primary to-primary-dark text-white hover:opacity-95 transition-opacity"
        >
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">App-only deal</span>
          <h3 className="text-[17px] font-bold">Extra ₹500 off on prepaid</h3>
          <p className="text-[12px] text-white/75 mt-1">Across mobiles & accessories · Code: FLIK500</p>
          <span className="mt-3 inline-block text-[13px] font-semibold text-white/90">Shop now →</span>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[64px] opacity-10 font-bold select-none">M</div>
        </button>

        <button
          onClick={() => navigate(ROUTES.PRODUCTS)}
          className="relative overflow-hidden rounded-[12px] p-5 text-left bg-gradient-to-br from-accent to-accent-dark text-white hover:opacity-95 transition-opacity"
        >
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-1">Bank offer</span>
          <h3 className="text-[17px] font-bold">10% Instant Discount</h3>
          <p className="text-[12px] text-white/75 mt-1">On HDFC & SBI credit cards · T&Cs apply</p>
          <span className="mt-3 inline-block text-[13px] font-semibold text-white/90">View details →</span>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[64px] opacity-10 font-bold select-none">%</div>
        </button>
      </div>
    </section>
  )
}

/* ── Top Brands Strip ───────────────────────────────────────── */
export function TopBrandsStrip({ brands }: { brands: BrandDto[] }) {
  const navigate = useNavigate()
  if (brands.length === 0) return null

  return (
    <section className="max-w-[var(--container)] mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-bold text-ink">Top Brands</h2>
        <button
          onClick={() => navigate(ROUTES.PRODUCTS)}
          className="text-[13px] font-medium px-[14px] py-2 rounded-full border border-border bg-white text-ink hover:bg-ink hover:text-white hover:border-ink transition-all duration-150"
        >
          View all →
        </button>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
        {brands.slice(0, 8).map(b => (
          <button
            key={b.id}
            onClick={() => navigate(ROUTES.PRODUCTS)}
            className="flex items-center gap-3 px-[14px] py-3 bg-white border border-[#F0F0F1] rounded-[14px] hover:border-primary hover:bg-primary-50 transition-all duration-150 text-left"
          >
            <span className="w-[34px] h-[34px] rounded-[10px] bg-ink text-white font-bold text-[16px] flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
              {b.name[0]}
            </span>
            <span className="text-[13px] font-semibold text-ink truncate min-w-0">{b.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
