import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ShoppingCart, Truck, X, CheckCircle } from 'lucide-react'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore'
import { productApi } from '@/features/product/api/productApi'
import { ProductCard } from '@/features/product/components/ProductCard'
import { computeMrp } from '@/shared/utils/price'
import { couponApi, type CouponValidateDto } from '@/features/coupon/api/couponApi'
import { ROUTES, productDetailUrl } from '@/app/router'
import type { Product } from '@/features/product/types/product.types'

/* ── Color helpers ────────────────────────────────────────────── */
const TONES   = ['#E6F1FE', '#E6F8EF', '#FFF4E0', '#FCEAF2', '#F1ECFF']
const FGTONES = ['#006FEE', '#17C964', '#D97706', '#D6336C', '#7828C8']
function getColorIdx(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % TONES.length
}

function getDeliveryDate() {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore()
  const { add: addToWishlist } = useWishlistStore()
  const user = useAuthStore(s => s.user)
  const navigate = useNavigate()
  const isCustomer = !user || user.role === 'Customer'
  const [related, setRelated] = useState<Product[]>([])

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateDto | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  useEffect(() => {
    if (items.length === 0) return
    const cartIds = new Set(items.map(i => i.product.id))
    const category = items[0].product.category
    productApi.getFiltered({ category })
      .then(prods => setRelated(prods.filter(p => !cartIds.has(p.id)).slice(0, 4)))
      .catch(() => {})
  }, [items])

  const handleMoveToWishlist = (product: Product, variantId?: string) => {
    addToWishlist(product)
    removeItem(product.id, variantId)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponError('')
    try {
      const result = await couponApi.validate(couponCode.trim(), subtotal)
      setAppliedCoupon(result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCouponError(msg || 'Invalid or expired coupon.')
      setAppliedCoupon(null)
    } finally { setCouponLoading(false) }
  }

  const subtotal  = getTotal()
  const mrpTotal  = items.reduce((sum, { unitPrice, product, quantity }) =>
    sum + computeMrp(unitPrice, product.discountPercent) * quantity, 0)
  const savings   = mrpTotal - subtotal
  const couponDiscount = appliedCoupon?.discountAmount ?? 0
  const toPay     = subtotal - couponDiscount
  const count     = getItemCount()

  /* ── Empty state ─────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="max-w-[var(--container)] mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-5">
          <ShoppingCart size={36} className="text-primary" />
        </div>
        <h2 className="text-[20px] font-bold text-ink">Your cart is empty</h2>
        <p className="text-muted text-[13px] mt-2 mb-6">Add items to it now and get them delivered fast.</p>
        <Link
          to={ROUTES.PRODUCTS}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold text-[14px] rounded-full hover:bg-primary-dark transition-colors"
        >
          Start Shopping →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-muted mb-6">
        <Link to={ROUTES.HOME} className="hover:text-ink transition-colors">PrakashMart</Link>
        <span>/</span>
        <span className="text-ink font-medium">Your cart · {count} {count === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: items ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Heading + count */}
          <div className="flex items-baseline justify-between mb-5">
            <h1 className="text-[32px] font-bold text-ink tracking-tight leading-none">
              Your cart, <em className="not-italic text-primary">summarised.</em>
            </h1>
            <span className="font-mono text-[11px] font-bold text-muted tracking-[0.1em] uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Item cards */}
          <div className="space-y-0 divide-y divide-border border border-border rounded-[16px] overflow-hidden bg-white">
            {items.map(({ product, quantity, variantId, variantLabel, unitPrice }) => {
              const mrp    = computeMrp(unitPrice, product.discountPercent)
              const saved  = (mrp - unitPrice) * quantity
              const discPct = product.discountPercent ? Math.round(product.discountPercent) : 0
              const idx    = getColorIdx(product.name)

              return (
                <div key={`${product.id}-${variantId ?? ''}`} className="p-5 flex gap-5">

                  {/* Letter thumbnail */}
                  <div
                    className="w-[96px] h-[96px] rounded-[14px] flex-shrink-0 flex items-center justify-center text-[36px] font-bold"
                    style={{ background: TONES[idx], color: FGTONES[idx] }}
                  >
                    {product.name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] mb-0.5" style={{ color: FGTONES[idx] }}>
                      {product.brandName}
                    </p>
                    <Link
                      to={productDetailUrl(product)}
                      className="text-[15px] font-semibold text-ink hover:text-primary transition-colors line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </Link>

                    {/* Variant + delivery */}
                    <p className="text-[12px] text-muted mt-1">
                      {variantLabel && <span>{variantLabel} · </span>}
                      Delivery by {getDeliveryDate()}
                    </p>

                    {/* Qty + actions */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1, variantId)}
                          className="w-7 h-7 flex items-center justify-center text-[18px] text-muted hover:text-ink transition-colors"
                        >
                          −
                        </button>
                        <span className="w-9 h-8 border border-border rounded-[8px] flex items-center justify-center text-[14px] font-semibold text-ink tnum">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1, variantId)}
                          className="w-7 h-7 flex items-center justify-center text-[18px] text-muted hover:text-ink transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(product.id, variantId)}
                        className="text-[12px] font-medium text-muted hover:text-error transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => handleMoveToWishlist(product, variantId)}
                        className="text-[12px] font-medium text-muted hover:text-primary transition-colors"
                      >
                        Move to wishlist
                      </button>
                    </div>
                  </div>

                  {/* Price column */}
                  <div className="text-right shrink-0">
                    <p className="text-[20px] font-bold text-ink tnum">
                      ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                    </p>
                    {discPct > 0 && (
                      <p className="text-[13px] text-muted line-through tnum mt-0.5">
                        ₹{(mrp * quantity).toLocaleString('en-IN')}
                      </p>
                    )}
                    {saved > 0 && (
                      <span className="inline-block mt-2 text-[11px] font-bold text-success bg-success/10 border border-success/30 rounded-full px-2.5 py-0.5 uppercase tracking-wide tnum">
                        You save ₹{Math.round(saved).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Free shipping notice */}
          <div className="flex items-center gap-2 mt-4 text-[13px] text-muted">
            <Truck size={15} className="text-success shrink-0" />
            <span>You qualify for free shipping.</span>
          </div>
        </div>

        {/* ── Right: order summary ─────────────────────────────── */}
        <div className="w-[300px] shrink-0 bg-white border border-border rounded-[16px] overflow-hidden sticky top-[calc(var(--nav-h)+var(--topbar-h)+16px)]">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[15px] font-bold text-ink">Order summary</h2>
          </div>

          <div className="px-5 py-4 space-y-3 text-[13px]">
            <div className="flex justify-between text-ink">
              <span>Subtotal</span>
              <span className="font-semibold tnum">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-success font-semibold">
                <span>You save</span>
                <span className="tnum">−₹{Math.round(savings).toLocaleString('en-IN')}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-success font-semibold">
                <span>Coupon ({appliedCoupon!.code})</span>
                <span className="tnum">−₹{couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-ink">
              <span>Shipping</span>
              <span className="font-semibold text-success">Free</span>
            </div>

            {/* Coupon */}
            <div className="pt-1">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-[10px] px-3 py-2">
                  <p className="text-[12px] font-semibold text-success flex items-center gap-1">
                    <CheckCircle size={12} /> {appliedCoupon.code}
                  </p>
                  <button
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError('') }}
                    className="text-success hover:text-success/70 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Apply coupon code"
                    className="flex-1 border border-border rounded-[10px] px-3 py-2 text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase placeholder:normal-case"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-3 py-2 border border-border rounded-[10px] text-[12px] font-semibold text-ink hover:border-ink hover:bg-surface-2 disabled:opacity-50 transition-all"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && <p className="text-[11px] text-error mt-1">{couponError}</p>}
            </div>
          </div>

          {/* To pay */}
          <div className="px-5 pb-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-ink">To pay</span>
              <span className="text-[22px] font-bold text-ink tnum">₹{Math.round(toPay).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5 pt-3 space-y-2">
            {isCustomer ? (
              <button
                onClick={() => navigate(ROUTES.CHECKOUT)}
                className="w-full py-3 bg-primary text-white font-bold text-[15px] rounded-full hover:bg-primary-dark transition-colors"
              >
                Proceed to checkout →
              </button>
            ) : (
              <p className="text-[12px] text-center text-muted">Admin and Seller accounts cannot place orders.</p>
            )}
            <p className="text-center font-mono text-[10px] text-muted tracking-[0.08em] uppercase flex items-center justify-center gap-1.5">
              🔒 Secure checkout · 256-bit TLS
            </p>
          </div>
        </div>
      </div>

      {/* ── You may also like ─────────────────────────────────── */}
      {related.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[20px] font-bold text-ink">You may also like</h2>
            <Link to={ROUTES.PRODUCTS} className="text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors">
              Browse all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
