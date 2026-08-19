import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useWishlistStore } from '@/features/wishlist/store/useWishlistStore'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { ROUTES, productDetailUrl } from '@/app/router'

const TONES   = ['#E6F1FE', '#E6F8EF', '#FFF4E0', '#FCEAF2', '#F1ECFF']
const FGTONES = ['#006FEE', '#17C964', '#D97706', '#D6336C', '#7828C8']
function getColorIdx(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % TONES.length
}

export default function WishlistPage() {
  const { items, remove } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)

  const handleAddToCart = (product: typeof items[0]) => {
    addToCart(product)
    remove(product.id)
  }

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Your wishlist
          </p>
          <h1 className="text-[28px] font-bold text-ink tracking-tight">
            Saved <em className="italic text-primary">favourites</em>.
          </h1>
        </div>
        <span className="font-mono text-[11px] font-bold text-muted tracking-[0.1em] uppercase flex items-center gap-1.5">
          <Heart size={13} className="text-error" />
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-border rounded-[16px] py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-error" />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-1">Your wishlist is empty</h2>
          <p className="text-[13px] text-muted mb-6">Save items you love and find them here.</p>
          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold text-[14px] rounded-full hover:bg-primary-dark transition-colors"
          >
            Explore Products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((product) => {
            const effectivePrice = product.discountPercent
              ? Math.round(product.price * (1 - product.discountPercent / 100))
              : product.price
            const discPct = product.discountPercent ? Math.round(product.discountPercent) : 0
            const idx = getColorIdx(product.name)

            return (
              <div key={product.id} className="bg-white border border-border rounded-[16px] overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

                {/* Letter thumbnail */}
                <Link to={productDetailUrl(product)}>
                  <div
                    className="aspect-square flex items-center justify-center text-[48px] font-bold"
                    style={{ background: TONES[idx], color: FGTONES[idx] }}
                  >
                    {product.name[0].toUpperCase()}
                  </div>
                </Link>

                <div className="p-3 flex flex-col flex-1">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] mb-0.5" style={{ color: FGTONES[idx] }}>
                    {product.brandName}
                  </p>
                  <Link to={productDetailUrl(product)}>
                    <p className="text-[13px] font-semibold text-ink line-clamp-2 leading-snug hover:text-primary transition-colors">
                      {product.name}
                    </p>
                  </Link>

                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-[15px] font-bold text-ink tnum">₹{effectivePrice.toLocaleString('en-IN')}</span>
                    {discPct > 0 && (
                      <span className="text-[11px] font-semibold text-discount">{discPct}% off</span>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white text-[12px] font-semibold py-2 rounded-full hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ShoppingCart size={13} />
                      {product.stock === 0 ? 'Out of Stock' : 'Add to cart'}
                    </button>
                    <button
                      onClick={() => remove(product.id)}
                      className="w-8 h-8 flex items-center justify-center border border-border rounded-full text-muted hover:text-error hover:border-error transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
