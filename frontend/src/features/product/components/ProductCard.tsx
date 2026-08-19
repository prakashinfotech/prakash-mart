import { Link } from 'react-router-dom'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import type { Product } from '@/features/product/types/product.types'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore'
import { useToastStore } from '@/shared/store/useToastStore'
import { productDetailUrl } from '@/app/router'
import { cn } from '@/shared/utils/cn'
import { computeMrp } from '@/shared/utils/price'
import { ProductImage } from '@/shared/components/ui/ProductImage'

const COLOR_HEX: Record<string, string> = {
  'black': '#212121', 'active black': '#1a1a1a', 'midnight black': '#0d0d0d', 'jet black': '#111111',
  'white': '#f5f5f5', 'ivory white': '#f5f0e8', 'soft white': '#fafafa', 'natural silver': '#d1d5db',
  'blue': '#2563eb', 'deep blue': '#1d4ed8', 'lavender blue': '#818cf8', 'navy blue': '#1e3a8a', 'abyss blue': '#1e40af',
  'red': '#dc2626', 'coral orange': '#f97316', 'rust red': '#b45309', 'teal': '#0d9488',
  'rose gold': '#d4a5a5', 'olive green': '#65a30d', 'olive': '#6b7c3c', 'arctic grey': '#9ca3af', 'grey': '#6b7280',
  'silver': '#9ca3af', 'navy': '#1e3a8a', 'beige': '#d4b899',
  'yellow': '#eab308', 'green': '#16a34a', 'orange': '#f97316',
  'purple': '#9333ea', 'groovy violet': '#7c3aed', 'pastel lime': '#a3e635',
  'sunny saffron': '#f59e0b', 'monster green': '#22c55e',
}
const getColorHex = (name: string) => COLOR_HEX[name.toLowerCase()]

interface ProductCardProps {
  product: Product
  compact?: boolean
}

/* Deterministic tile bg from product id */
const TILE_COLORS = [
  '#E6F1FE', '#FCEAF2', '#FFF4E0', '#E6F8EF',
  '#F1ECFF', '#FCE9F4', '#E6F8FF', '#FFF8E7',
]
function tileColor(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return TILE_COLORS[h % TILE_COLORS.length]
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem)
  const { toggle, has } = useWishlistStore()
  const show = useToastStore(s => s.show)
  const wishlisted = has(product.id)
  const inStock = product.stock > 0
  const mrp = computeMrp(product.price, product.discountPercent)
  const discPct = product.discountPercent ? Math.round(product.discountPercent) : 0
  const displayPrice = product.minVariantPrice ?? product.price
  const hasVariants = (product.colorOptions?.length ?? 0) > 0

  /* ── Compact (used inside horizontal scroll rows) ─────────── */
  if (compact) {
    return (
      <Link
        to={productDetailUrl(product)}
        className="flex flex-col group h-full p-3 hover:bg-surface-2 transition-colors rounded-[10px]"
      >
        <div
          className="aspect-square overflow-hidden rounded-[8px] mb-2 relative"
          style={{ background: tileColor(product.id) }}
        >
          <ProductImage
            src={product.imageUrl} alt={product.name} loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
          />
        </div>
        <p className="text-[13px] text-ink font-medium line-clamp-2 leading-snug flex-1">{product.name}</p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-semibold text-ink tnum">₹{product.price.toLocaleString('en-IN')}</span>
          {discPct > 0 && (
            <span className="text-[11px] text-discount font-semibold">{discPct}% off</span>
          )}
        </div>
      </Link>
    )
  }

  /* ── Full card ───────────────────────────────────────────────── */
  return (
    <div className="bg-white border border-[#F0F0F1] rounded-lg hover:shadow-3 hover:-translate-y-[4px] hover:border-border transition-all duration-[220ms] ease-[cubic-bezier(.2,.8,.2,1)] group relative overflow-hidden flex flex-col">
      {/* Wishlist button */}
      <button
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={e => {
          e.preventDefault()
          toggle(product)
          show(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', wishlisted ? 'info' : 'success')
        }}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-1 hover:scale-110 transition-transform duration-150"
      >
        <Heart
          size={15}
          className={wishlisted ? 'fill-error text-error' : 'text-muted'}
        />
      </button>

      <Link to={productDetailUrl(product)} className="flex flex-col flex-1">
        {/* Image tile */}
        <div
          className="aspect-[4/5] overflow-hidden rounded-t-lg relative"
          style={{ background: tileColor(product.id) }}
        >
          <ProductImage
            src={product.imageUrl} alt={product.name} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-in-out"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-error bg-white px-2.5 py-1 rounded-pill shadow-1">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          {/* Brand */}
          {product.brandName && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{product.brandName}</span>
          )}
          {/* Name */}
          <p className="text-[13px] text-ink line-clamp-2 font-medium leading-snug">{product.name}</p>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 bg-success text-white text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px]">
              <Star size={9} fill="white" stroke="none" />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-[11px] text-muted">({product.reviewCount.toLocaleString('en-IN')})</span>
          </div>

          {/* Color swatches */}
          {(product.colorOptions?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {product.colorOptions.slice(0, 5).map(color => {
                const hex = getColorHex(color)
                return hex ? (
                  <span
                    key={color}
                    title={color}
                    className="w-3.5 h-3.5 rounded-full border border-[#E4E4E7] shrink-0 inline-block"
                    style={{ backgroundColor: hex }}
                  />
                ) : (
                  <span
                    key={color}
                    className="text-[9px] font-medium text-muted border border-border rounded px-1"
                  >
                    {color}
                  </span>
                )
              })}
              {product.colorOptions.length > 5 && (
                <span className="text-[10px] text-muted">+{product.colorOptions.length - 5}</span>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
            {product.minVariantPrice != null && (
              <span className="text-[10px] font-mono text-muted">From</span>
            )}
            <span className="text-[18px] font-bold text-ink tnum tracking-[-0.02em]">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {discPct > 0 && (
              <>
                <span className="text-[12px] text-muted line-through tnum font-mono">
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-discount font-mono font-bold bg-success/10 px-2 py-[2px] rounded-pill">
                  {discPct}% off
                </span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* Hover slide-up CTA */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0',
        'transition-transform duration-200 ease-in-out',
        'px-3 pb-3 pt-2 bg-white border-t border-border',
      )}>
        {hasVariants ? (
          <Link
            to={productDetailUrl(product)}
            onClick={e => e.stopPropagation()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-[8px] text-[13px] font-semibold',
              'transition-all duration-150 active:scale-95',
              inStock
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-surface-2 text-muted cursor-not-allowed pointer-events-none',
            )}
          >
            <ShoppingCart size={14} />
            {inStock ? 'Choose Options' : 'Unavailable'}
          </Link>
        ) : (
          <button
            aria-label={`Add ${product.name} to cart`}
            onClick={e => {
              e.preventDefault()
              if (!inStock) return
              addItem(product)
              show('Added to cart', 'success')
            }}
            disabled={!inStock}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-[8px] text-[13px] font-semibold',
              'transition-all duration-150 active:scale-95',
              inStock
                ? 'bg-primary text-white hover:bg-primary-dark'
                : 'bg-surface-2 text-muted cursor-not-allowed',
            )}
          >
            <ShoppingCart size={14} />
            {inStock ? 'Add to Cart' : 'Unavailable'}
          </button>
        )}
      </div>
    </div>
  )
}
