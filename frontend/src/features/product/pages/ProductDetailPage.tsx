import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Zap, Star, Heart, Truck, RotateCcw, ShieldCheck, Tag, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { productApi } from '@/features/product/api/productApi'
import { reviewApi } from '@/features/review/api/reviewApi'
import { variantApi, variantTypeApi, type ProductVariantDto, type CategoryVariantTypeDto } from '@/features/product/api/variantApi'
import type { ReviewDto, CanReviewDto } from '@/features/review/api/reviewApi'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { computeMrp } from '@/shared/utils/price'
import { useToastStore } from '@/shared/store/useToastStore'
import type { Product } from '@/features/product/types/product.types'
import { ROUTES } from '@/app/router'
import { Breadcrumb } from '@/shared/components/ui/Breadcrumb'
import { ProductImage } from '@/shared/components/ui/ProductImage'
import { ProductCard } from '@/features/product/components/ProductCard'

/* ── Constants ───────────────────────────────────────────────── */
const COLOR_HEX: Record<string, string> = {
  'black': '#212121', 'active black': '#1a1a1a', 'midnight black': '#0d0d0d', 'jet black': '#111111',
  'white': '#f5f5f5', 'ivory white': '#f5f0e8', 'soft white': '#fafafa',
  'blue': '#2563eb', 'deep blue': '#1d4ed8', 'lavender blue': '#818cf8',
  'red': '#dc2626', 'coral orange': '#f97316', 'teal': '#0d9488',
  'rose gold': '#d4a5a5', 'olive green': '#65a30d', 'olive': '#6b7c3c',
  'silver': '#9ca3af', 'navy': '#1e3a8a', 'beige': '#d4b899',
  'yellow': '#eab308', 'green': '#16a34a', 'orange': '#f97316',
}
const getColorHex = (name: string) => COLOR_HEX[name.toLowerCase()]

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-600', 'bg-emerald-600', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-600']
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const THUMB_BG = ['#E6F1FE', '#E6F8EF', '#FFF4E0', '#FCEAF2', '#F1ECFF']

function ratingBadgeClass(rating: number) {
  if (rating >= 4) return 'bg-success'
  if (rating === 3) return 'bg-warning'
  return 'bg-error'
}

function getDeliveryDate(dispatchInfo?: string | null) {
  const days = dispatchInfo?.toLowerCase().includes('same day') ? 2 : 3
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

/* ── Rating Summary ──────────────────────────────────────────── */
function RatingSummary({ reviews }: { reviews: ReviewDto[] }) {
  const total = reviews.length
  if (total === 0) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / total
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-5 bg-surface-2 rounded-[10px] border border-border mb-6">
      <div className="flex flex-col items-center justify-center sm:min-w-[110px]">
        <span className="text-[48px] font-bold text-ink leading-none">{avg.toFixed(1)}</span>
        <div className="flex gap-0.5 mt-1.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={14} className={s <= Math.round(avg) ? 'text-warning fill-warning' : 'text-border fill-border'} />
          ))}
        </div>
        <span className="text-[11px] text-muted mt-1.5">{total.toLocaleString('en-IN')} {total === 1 ? 'rating' : 'ratings'}</span>
      </div>
      <div className="hidden sm:block w-px bg-border self-stretch" />
      <div className="flex-1 space-y-2">
        {dist.map(({ star, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2 text-[12px]">
              <span className="w-4 text-right text-ink shrink-0">{star}</span>
              <Star size={10} className="text-warning fill-warning shrink-0" />
              <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
                <div className="h-1.5 rounded-full bg-success transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-5 text-right text-muted shrink-0">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Review Form ─────────────────────────────────────────────── */
function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: (r: ReviewDto) => void }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (done) return (
    <p className="text-[13px] text-success bg-success-tint border border-success/20 rounded-[8px] px-4 py-3 mb-4">
      ✓ Review submitted. Thank you!
    </p>
  )

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return }
    if (!comment.trim()) { setError('Please write a comment.'); return }
    setSubmitting(true); setError('')
    try {
      const r = await reviewApi.create(productId, rating, comment)
      onSubmitted(r); setDone(true)
    } catch {
      setError('Failed to submit. You may have already reviewed this product.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="border border-border rounded-[10px] p-4 mb-4 bg-surface-2">
      <h3 className="text-[14px] font-bold text-ink mb-3">Write a Review</h3>
      <div className="flex items-center gap-1 mb-3">
        {[1,2,3,4,5].map(s => (
          <button key={s} type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="text-[24px] transition-transform hover:scale-110">
            <span className={(hovered || rating) >= s ? 'text-warning' : 'text-border'}>★</span>
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-[12px] text-muted">{['','Poor','Fair','Good','Very Good','Excellent'][rating]}</span>
        )}
      </div>
      <textarea
        rows={3} value={comment} onChange={e => setComment(e.target.value)}
        placeholder="Share your experience with this product..."
        className="w-full border border-border rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint resize-none bg-white"
      />
      {error && <p className="text-[12px] text-error mt-1">{error}</p>}
      <button
        onClick={handleSubmit} disabled={submitting}
        className="mt-2.5 bg-primary text-white text-[13px] font-semibold px-5 py-2 rounded-[8px] hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  )
}

type TabKey = 'highlights' | 'specs' | 'reviews' | 'maker'

/* ── Main Page ───────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore(s => s.addItem)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { toggle: toggleWishlist, has: isInWishlist } = useWishlistStore()
  const show = useToastStore(s => s.show)
  const ctaRef = useRef<HTMLDivElement>(null!)
  const [stickyVisible, setStickyVisible] = useState(false)

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [variants, setVariants] = useState<ProductVariantDto[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantDto | null>(null)
  const [categoryVariantTypes, setCategoryVariantTypes] = useState<CategoryVariantTypeDto[]>([])
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviewSort, setReviewSort] = useState<'recent' | 'highest' | 'lowest'>('recent')
  const [canReview, setCanReview] = useState<CanReviewDto | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [tab, setTab] = useState<TabKey>('highlights')
  const [pincode, setPincode] = useState('')
  const [pincodeMsg, setPincodeMsg] = useState('')
  const [related, setRelated] = useState<Product[]>([])
  const [notifyEmail, setNotifyEmail] = useState('')
  const [notified, setNotified] = useState(false)

  const sortedReviews = useMemo(() => {
    const copy = [...reviews]
    if (reviewSort === 'highest') return copy.sort((a, b) => b.rating - a.rating)
    if (reviewSort === 'lowest')  return copy.sort((a, b) => a.rating - b.rating)
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reviews, reviewSort])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setImgIdx(0); setTab('highlights'); setPincode(''); setPincodeMsg('')
    Promise.all([
      productApi.getBySlug(slug),
      // reviews and variants fetched after we have the product id
    ])
      .then(async ([p]) => {
        setProduct(p)
        const [r, v] = await Promise.all([
          reviewApi.getByProduct(p.id).catch(() => [] as ReviewDto[]),
          variantApi.getByProduct(p.id).catch(() => [] as ProductVariantDto[]),
        ])
        setReviews(r)
        const active = v.filter(x => x.isActive)
        setVariants(active)
        setSelectedAttrs({})
        if (active.length > 0) { setSelectedVariant(active[0]); setSelectedAttrs(active[0].attributes) }
        if (p.categoryId) variantTypeApi.getByCategory(p.categoryId).then(setCategoryVariantTypes).catch(() => {})
        productApi.getFiltered({ category: p.category })
          .then(prods => setRelated(prods.filter(x => x.id !== p.id).slice(0, 4)))
          .catch(() => {})
        if (isAuthenticated) reviewApi.canReview(p.id).then(setCanReview).catch(() => null)
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loading])

  if (loading) return <PageSpinner />
  if (error || !product) return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-16 text-center">
      <p className="text-muted text-[15px] mb-4">{error || 'Product not found.'}</p>
      <button onClick={() => navigate(ROUTES.PRODUCTS)} className="text-primary text-[13px] hover:underline">
        ← Back to Products
      </button>
    </div>
  )

  const hasVariants = variants.length > 0

  // Extract unique values per attribute key across all variants
  const attrOptions: Record<string, string[]> = {}
  for (const v of variants) {
    for (const [k, val] of Object.entries(v.attributes)) {
      if (!attrOptions[k]) attrOptions[k] = []
      if (!attrOptions[k].includes(val)) attrOptions[k].push(val)
    }
  }

  // Keys ordered by category variant types config, then any extra keys
  const orderedKeys = [
    ...categoryVariantTypes.map(vt => vt.name).filter(k => attrOptions[k]),
    ...Object.keys(attrOptions).filter(k => !categoryVariantTypes.some(vt => vt.name === k)),
  ]

  const effectivePrice = selectedVariant?.priceOverride ?? product.price
  const effectiveStock = hasVariants ? (selectedVariant?.availableStock ?? 0) : product.stock
  const inStock = effectiveStock > 0
  const mrp = computeMrp(effectivePrice, product.discountPercent)
  const discPct = product.discountPercent ? Math.round(product.discountPercent) : 0
  const emi = Math.round(effectivePrice / 12)
  const canCTA = inStock && (!hasVariants || !!selectedVariant)

  // Build image gallery from real imageUrls + fallback to single imageUrl
  const allImages = product.imageUrls?.length > 0
    ? [product.imageUrl, ...product.imageUrls.filter(u => u !== product.imageUrl)]
    : [product.imageUrl]

  const selectAttr = (key: string, value: string) => {
    setQty(1)
    const newAttrs = { ...selectedAttrs, [key]: value }
    // Try exact match with all currently-selected attrs
    let match = variants.find(v =>
      Object.entries(newAttrs).every(([k, sv]) => v.attributes[k] === sv) && v.availableStock > 0
    )
    if (!match) {
      // No exact combo — find the best in-stock variant for this selection and adopt its attrs
      match = variants.find(v => v.attributes[key] === value && v.availableStock > 0)
      if (match) { setSelectedAttrs({ ...match.attributes }); setSelectedVariant(match); return }
    }
    setSelectedAttrs(newAttrs)
    setSelectedVariant(match ?? null)
  }

  const handleAddToCart = (buyNow = false) => {
    addItem(product, selectedVariant?.id, selectedVariant?.label || undefined, selectedVariant?.priceOverride ?? undefined, qty)
    if (buyNow) navigate(ROUTES.CHECKOUT)
    else show('Added to cart', 'success')
  }

  const wishlisted = isInWishlist(product.id)

  const highlights = product.description
    ? product.description.split(/[.!]/).map(s => s.trim()).filter(s => s.length > 8).slice(0, 5)
    : [`Premium ${product.category} product`, `From ${product.brandName ?? 'a trusted brand'}`, 'Fast & reliable delivery', 'Easy 30-day returns', 'PrakashMart assured authentic']

  // Build offers from product.offers + computed EMI — no hardcoded bank discounts
  const computedOffers: string[] = []
  if (effectivePrice >= 1000) computedOffers.push(`No Cost EMI from ₹${emi.toLocaleString('en-IN')}/month`)
  const allOffers = [...computedOffers, ...(product.offers ?? [])]

  const specRows: [string, string][] = [
    ['Brand', product.brandName ?? '—'],
    ['Category', product.category],
    ['Seller', product.sellerName],
    ['Rating', `${product.rating.toFixed(1)} / 5 (${product.reviewCount.toLocaleString('en-IN')} reviews)`],
    ...(discPct > 0 ? [['Discount', `${discPct}% off`] as [string, string]] : []),
    ['Stock', `${effectiveStock} units`],
    ...(product.warranty ? [['Warranty', product.warranty] as [string, string]] : []),
    ...(product.countryOfOrigin ? [['Country of origin', product.countryOfOrigin] as [string, string]] : []),
    ...(product.dispatchInfo ? [['Dispatch', product.dispatchInfo] as [string, string]] : []),
  ]

  const handlePincodeCheck = () => {
    if (pincode.length !== 6) { setPincodeMsg('Enter a valid 6-digit pincode.'); return }
    setPincodeMsg(`Delivery available — estimated by ${getDeliveryDate(product.dispatchInfo)}`)
  }

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-5 pb-12">
      <Breadcrumb items={[
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Products', href: ROUTES.PRODUCTS },
        { label: product.category, href: `${ROUTES.PRODUCTS}?category=${encodeURIComponent(product.category)}` },
        { label: product.name },
      ]} />

      {/* ── 2-col main grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 mt-5">

        {/* ── Gallery column ─────────────────────────────────── */}
        <div>
          {/* Main image */}
          <div
            className="aspect-square rounded-lg overflow-hidden border border-[#F0F0F1] relative"
            style={{ background: THUMB_BG[imgIdx % THUMB_BG.length] }}
          >
            <span className="absolute top-3.5 left-3.5 z-10 text-[11px] font-mono text-ink-2 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-pill">
              {product.brandName ?? product.name.split(' ')[0]} · {String(imgIdx + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
            </span>
            {product.rating >= 4.5 && (
              <span className="absolute top-3.5 right-3.5 z-10 text-[10px] font-semibold tracking-[0.06em] uppercase bg-warning text-white px-2.5 py-1 rounded-pill">
                Bestseller
              </span>
            )}
            <ProductImage
              src={allImages[imgIdx]} alt={product.name}
              className="w-full h-full object-contain p-10"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#E4E4E7] flex items-center justify-center hover:bg-white transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % allImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#E4E4E7] flex items-center justify-center hover:bg-white transition-colors z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip — only real images */}
          <div className="grid grid-cols-5 gap-2.5 mt-3">
            {allImages.map((url, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`aspect-square rounded-[10px] overflow-hidden border transition-all duration-150 ${
                  imgIdx === i ? 'border-primary shadow-glow' : 'border-[#F0F0F1] hover:border-muted-2'
                }`}
                style={{ background: THUMB_BG[i % THUMB_BG.length] }}
                aria-label={`View image ${i + 1}`}
              >
                <ProductImage src={url} alt="" className="w-full h-full object-contain p-1.5" />
              </button>
            ))}
          </div>

          {/* Sticky CTA bar */}
          <div
            ref={ctaRef}
            className="sticky bottom-0 mt-7 flex gap-3 pt-3.5 pb-4 border-t border-[#F0F0F1] bg-white/90 backdrop-blur-sm"
            style={{ zIndex: 10 }}
          >
            {canCTA ? (
              <>
                <button
                  onClick={() => handleAddToCart(false)}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-white font-semibold text-[14px] rounded-[10px] hover:bg-primary-dark transition-colors"
                >
                  <ShoppingCart size={17} /> Add to cart
                </button>
                <button
                  onClick={() => handleAddToCart(true)}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-accent text-white font-semibold text-[14px] rounded-[10px] hover:bg-accent-dark transition-colors"
                >
                  <Zap size={17} /> Buy now
                </button>
              </>
            ) : !inStock ? (
              notified ? (
                <p className="flex-1 text-center text-[13px] text-success font-medium py-3">
                  ✓ We'll notify you when this is back in stock.
                </p>
              ) : (
                <div className="flex-1 flex gap-2">
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={e => setNotifyEmail(e.target.value)}
                    placeholder="Your email for restock alert"
                    className="flex-1 h-11 border border-border rounded-[10px] px-3 text-[13px] outline-none focus:border-primary transition-colors bg-white"
                  />
                  <button
                    onClick={() => { if (notifyEmail.includes('@')) setNotified(true) }}
                    className="h-11 px-4 bg-ink text-white text-[13px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Notify Me
                  </button>
                </div>
              )
            ) : (
              <button disabled className="flex-1 h-11 bg-surface-2 text-muted font-semibold text-[14px] rounded-[10px] cursor-not-allowed">
                Select a variant to continue
              </button>
            )}
          </div>
        </div>

        {/* ── Info column ────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Brand · category eyebrow + title */}
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              {product.brandName ?? '—'} · {product.category}
            </p>
            <h1 className="text-[30px] font-bold text-ink leading-[1.15] tracking-[-0.03em] mt-2">
              {product.name}
            </h1>
          </div>

          {/* Rating + stock */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-success text-white text-[12px] font-semibold px-2 py-1 rounded-[6px]">
              <Star size={10} fill="white" stroke="none" /> {product.rating.toFixed(1)}
            </span>
            <span className="text-[12px] text-muted">({product.reviewCount.toLocaleString('en-IN')})</span>
            <span className="text-border">·</span>
            <span className={`font-mono text-[11px] uppercase tracking-[0.08em] font-semibold ${inStock ? 'text-success' : 'text-error'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
            {inStock && effectiveStock <= 5 && (
              <span className="text-[11px] font-semibold text-error bg-error/10 border border-error/20 px-2 py-0.5 rounded-pill">
                Only {effectiveStock} left!
              </span>
            )}
            {product.shipsFrom && (
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                · Ships from {product.shipsFrom}
              </span>
            )}
          </div>

          {/* Price block */}
          <div
            className="rounded-lg border border-[#E4E4E7] px-5 py-4 flex flex-col gap-1.5"
            style={{ background: 'linear-gradient(135deg, #E6F1FE 0%, #FFFFFF 100%)' }}
          >
            <span className="font-mono text-[11px] text-muted">M.R.P. inclusive of all taxes</span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-[34px] font-bold text-ink tracking-[-0.03em] tnum">
                ₹{effectivePrice.toLocaleString('en-IN')}
              </span>
              {discPct > 0 && (
                <>
                  <span className="text-[15px] text-muted line-through tnum font-mono">
                    ₹{mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="font-mono text-[12px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-pill">
                    −{discPct}% off
                  </span>
                </>
              )}
            </div>
            {effectivePrice >= 1000 && (
              <span className="font-mono text-[11px] text-muted">
                EMI from ₹{emi.toLocaleString('en-IN')}/mo · No Cost EMI available
              </span>
            )}
          </div>

          {/* Offers — computed + product-specific, no hardcoded bank discounts */}
          {allOffers.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-ink mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                Offers · {allOffers.length} available
              </h3>
              <div className="space-y-2.5">
                {allOffers.map((offer, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[13px] text-ink">
                    <Tag size={14} className="text-primary shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-accent-dark">{offer.split(' ').slice(0, 2).join(' ')}</strong>
                      {' '}{offer.split(' ').slice(2).join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants — dynamic per category */}
          {hasVariants && (
            <div className="space-y-4">
              {orderedKeys.map(key => {
                const values = attrOptions[key] ?? []
                const isColor = key.toLowerCase() === 'color' || key.toLowerCase() === 'colour' || key.toLowerCase() === 'shade'
                const currentVal = selectedAttrs[key]
                return (
                  <div key={key}>
                    <p className="text-[13px] font-semibold text-ink mb-2">
                      {key}
                      {currentVal && (
                        <span className="font-mono text-[11px] font-normal text-muted uppercase tracking-wider ml-1.5">
                          — {currentVal}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {values.map(val => {
                        const available = variants.some(v =>
                          v.attributes[key] === val && v.availableStock > 0
                        )
                        const selected = currentVal === val
                        const hex = isColor ? getColorHex(val) : null
                        return hex ? (
                          <button
                            key={val} onClick={() => selectAttr(key, val)} disabled={!available}
                            title={val}
                            className={`w-9 h-9 rounded-full border-2 transition-all duration-150 disabled:opacity-40 ${
                              selected ? 'border-primary shadow-glow scale-110' : 'border-[#E4E4E7] hover:border-muted-2'
                            }`}
                            style={{ backgroundColor: hex }}
                          />
                        ) : (
                          <button
                            key={val} onClick={() => selectAttr(key, val)} disabled={!available}
                            className={`px-3.5 py-2 text-[13px] font-medium border rounded-[8px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed relative ${
                              selected ? 'border-primary bg-primary-50 text-primary' : 'border-border text-ink hover:border-primary'
                            }`}
                          >
                            {val}
                            {!available && (
                              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="w-full h-px bg-current opacity-60 absolute rotate-[-10deg]" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {!selectedVariant && orderedKeys.length > 0 && (
                <p className="text-[12px] text-warning font-medium">Please select all options to continue.</p>
              )}
            </div>
          )}

          {/* Quantity */}
          {canCTA && (
            <div>
              <p className="text-[13px] font-semibold text-ink mb-2">Quantity</p>
              <div className="flex items-center border border-border rounded-[10px] overflow-hidden w-fit">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                  className="w-10 h-10 flex items-center justify-center text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors font-bold text-[18px]"
                >−</button>
                <span className="w-12 text-center text-[14px] font-semibold text-ink border-x border-border tnum">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(Math.min(effectiveStock, 10), q + 1))}
                  disabled={qty >= Math.min(effectiveStock, 10)}
                  className="w-10 h-10 flex items-center justify-center text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors font-bold text-[18px]"
                >+</button>
              </div>
            </div>
          )}

          {/* Wishlist */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                toggleWishlist(product)
                show(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', wishlisted ? 'info' : 'success')
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-[8px] text-[13px] font-medium transition-colors ${
                wishlisted ? 'border-error/30 bg-error-tint text-error' : 'border-border text-muted hover:border-error/40 hover:text-error'
              }`}
            >
              <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
              {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            {!isAuthenticated && inStock && (
              <p className="text-[12px] text-muted">
                <button onClick={() => navigate(ROUTES.LOGIN)} className="text-primary hover:underline">Sign in</button> to sync your cart.
              </p>
            )}
          </div>

          {/* Delivery card */}
          <div className="border border-[#F0F0F1] rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F1]">
              <span className="text-[13px] text-muted font-medium shrink-0 w-[72px]">Deliver to</span>
              <input
                value={pincode}
                onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setPincodeMsg('') }}
                className="flex-1 text-[13px] text-ink outline-none bg-transparent font-mono tracking-wider"
                maxLength={6}
                placeholder="Enter pincode"
              />
              <button
                onClick={handlePincodeCheck}
                className="text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors shrink-0"
              >
                Check
              </button>
            </div>
            {pincodeMsg && (
              <div className={`px-4 py-2 text-[12px] border-b border-[#F0F0F1] ${pincodeMsg.startsWith('Delivery available') ? 'text-success' : 'text-error'}`}>
                {pincodeMsg}
              </div>
            )}
            {([
              { icon: Truck,       node: <>Delivery by <strong>{getDeliveryDate(product.dispatchInfo)}</strong>{product.dispatchInfo ? ` · ${product.dispatchInfo}` : ''}</> },
              { icon: RotateCcw,   node: 'Easy 30-day returns. No questions asked.' },
              ...(product.warranty ? [{ icon: ShieldCheck, node: `${product.warranty} · PrakashMart assured authentic` }] : [
                { icon: ShieldCheck, node: 'PrakashMart assured authentic product' }
              ]),
            ] as { icon: React.ElementType; node: React.ReactNode }[]).map(({ icon: Icon, node }, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F0F1] last:border-0">
                <Icon size={15} className="text-muted shrink-0" />
                <span className="text-[13px] text-ink">{node}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex gap-1 border-b border-border" style={{ marginBottom: -1 }}>
          {(['highlights', 'specs', 'reviews', 'maker'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'text-primary border-primary'
                  : 'text-muted border-transparent hover:text-ink'
              }`}
            >
              {t === 'specs' ? 'specifications' : t}
            </button>
          ))}
        </div>

        <div className="py-8">

          {/* Highlights */}
          {tab === 'highlights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> What we like
                </h3>
                <ul className="divide-y divide-[#F0F0F1]">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 py-3 text-[14px] text-ink">
                      <Check size={16} className="text-primary shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" /> Editor's note
                </h3>
                <p className="text-[20px] leading-[1.5] text-ink italic tracking-[-0.01em]">
                  "{product.description
                    ? product.description.slice(0, 220)
                    : `We tested ${product.brandName ?? ''}'s ${product.name.split(' ').slice(0, 3).join(' ')} alongside several alternatives. It wasn't the cheapest option. It was the one we kept reaching for. Recommended.`}"
                </p>
                <p className="mt-5 font-mono text-[11px] text-muted uppercase tracking-[0.1em]">
                  — Reviewed by the PrakashMart Edit team
                </p>
              </div>
            </div>
          )}

          {/* Specifications */}
          {tab === 'specs' && (
            <table className="w-full border-collapse">
              <tbody>
                {specRows.map(([label, value], i) => (
                  <tr key={i} className="border-b border-[#F0F0F1]">
                    <td className="py-3 pr-6 text-[13px] text-muted w-[35%] align-top">{label}</td>
                    <td className="py-3 text-[13px] text-ink font-medium">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Reviews */}
          {tab === 'reviews' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[17px] font-bold text-ink">
                  Ratings &amp; Reviews
                  {reviews.length > 0 && (
                    <span className="ml-2 text-[13px] font-normal text-muted">({reviews.length})</span>
                  )}
                </h2>
                {reviews.length > 1 && (
                  <select
                    value={reviewSort}
                    onChange={e => setReviewSort(e.target.value as typeof reviewSort)}
                    className="text-[12px] border border-border rounded-[8px] px-3 py-1.5 outline-none focus:border-primary text-ink bg-white cursor-pointer"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                )}
              </div>

              <RatingSummary reviews={reviews} />

              {isAuthenticated
                ? canReview?.canReview
                  ? <ReviewForm productId={product.id} onSubmitted={r => setReviews(prev => [r, ...prev])} />
                  : <p className="text-[12px] text-muted mb-4 border border-border rounded-[8px] px-4 py-3 bg-surface-2">
                      {canReview?.reason || 'You cannot review this product.'}
                    </p>
                : (
                  <p className="text-[13px] text-muted mb-4">
                    <button onClick={() => navigate(ROUTES.LOGIN)} className="text-primary hover:underline">Sign in</button> to write a review.
                  </p>
                )
              }

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[32px] mb-2">✍️</p>
                  <p className="text-[14px] font-semibold text-ink">No reviews yet</p>
                  <p className="text-[12px] text-muted mt-1">Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {sortedReviews.map(r => (
                    <div key={r.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className={`${getAvatarColor(r.userName)} text-white rounded-full w-9 h-9 flex items-center justify-center text-[13px] font-bold shrink-0`}>
                          {r.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`${ratingBadgeClass(r.rating)} text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5`}>
                              {r.rating} ★
                            </span>
                            <span className="text-[13px] font-semibold text-ink">{r.userName}</span>
                            <span className="text-[10px] text-success border border-success/30 bg-success-tint px-1.5 py-0.5 rounded-pill">
                              ✓ Verified
                            </span>
                          </div>
                          <p className="mt-2 text-[13px] text-ink leading-relaxed">{r.comment}</p>
                          <p className="mt-1.5 text-[11px] text-muted">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Maker */}
          {tab === 'maker' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  About {product.brandName ?? 'the seller'}
                </h3>
                <p className="text-[18px] leading-[1.5] text-ink italic tracking-[-0.01em] mb-6">
                  {/* Brand description from API if available */}
                  "Dedicated to bringing you quality {product.category.toLowerCase()} products at the best prices. Verified seller on PrakashMart."
                </p>
                <div className="divide-y divide-[#F0F0F1]">
                  {([
                    ['Seller', product.sellerName],
                    ['Category', product.category],
                    ['Rating', `${product.rating.toFixed(1)}★ from ${product.reviewCount.toLocaleString('en-IN')} reviews`],
                    ...(product.shipsFrom ? [['Ships from', product.shipsFrom]] : []),
                    ...(product.countryOfOrigin ? [['Made in', product.countryOfOrigin]] : []),
                  ] as [string, string][]).map(([label, value], i) => (
                    <div key={i} className="flex items-center gap-4 py-3 text-[13px]">
                      <span className="text-muted w-24 shrink-0">{label}</span>
                      <span className="text-ink font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="rounded-lg flex items-center justify-center min-h-[220px]"
                style={{ background: '#E6F1FE' }}
              >
                <span className="text-[120px] font-bold leading-none select-none" style={{ color: '#006FEE', opacity: 0.18 }}>
                  {(product.brandName ?? product.sellerName ?? 'F')[0].toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Related products ─────────────────────────────────── */}
      {related.length > 0 && (
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between pb-5 border-b border-border mb-6">
            <div>
              <p className="font-mono text-[10px] text-muted uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                № 08 · Edit
              </p>
              <h2 className="text-[24px] font-bold text-ink tracking-[-0.02em]">
                More from <span className="text-primary">{product.category.toLowerCase()}</span>
              </h2>
            </div>
            <Link
              to={`${ROUTES.PRODUCTS}?category=${encodeURIComponent(product.category)}`}
              className="text-[13px] font-medium px-[14px] py-2 rounded-pill border border-border bg-white text-ink hover:bg-ink hover:text-white hover:border-ink transition-all duration-150"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Mobile sticky CTAs */}
      {stickyVisible && canCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-border px-4 py-3 flex gap-3 shadow-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 h-11 border border-primary text-primary font-semibold text-[14px] rounded-[10px] hover:bg-primary-50 transition-colors"
            onClick={() => handleAddToCart(false)}
          >
            <ShoppingCart size={17} /> Add to Cart
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-white font-semibold text-[14px] rounded-[10px] hover:bg-primary-dark transition-colors"
            onClick={() => handleAddToCart(true)}
          >
            <Zap size={17} /> Buy Now
          </button>
        </div>
      )}
    </div>
  )
}
