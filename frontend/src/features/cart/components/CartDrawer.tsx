import { X, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { ROUTES } from '@/app/router'
import { computeMrp } from '@/shared/utils/price'

const TONES   = ['#E6F1FE', '#E6F8EF', '#FFF4E0', '#FCEAF2', '#F1ECFF']
const FGTONES = ['#006FEE', '#17C964', '#D97706', '#D6336C', '#7828C8']

function getColorIdx(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % TONES.length
}

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore()
  const navigate = useNavigate()

  if (!isDrawerOpen) return null

  const total = getTotal()
  const count = getItemCount()

  const totalMrp = items.reduce((sum, { product, quantity, unitPrice }) => {
    return sum + computeMrp(unitPrice, product.discountPercent) * quantity
  }, 0)
  const savings = totalMrp - total

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={closeDrawer}
      />

      {/* Slide-in panel */}
      <div className="relative ml-auto w-[420px] max-w-full h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-ink">Your cart</h2>
            <p className="text-[12px] text-muted mt-0.5">
              {count} {count === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-2 transition-colors text-muted hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                <ShoppingCart size={28} className="text-muted" />
              </div>
              <h3 className="text-[16px] font-bold text-ink mb-1">Cart is empty</h3>
              <p className="text-[13px] text-muted mb-6">
                Add things you love — we'll keep them safe.
              </p>
              <button
                onClick={() => { closeDrawer(); navigate(ROUTES.PRODUCTS) }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold text-[14px] rounded-[10px] hover:bg-primary-dark transition-colors"
              >
                Browse catalogue →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border px-5">
              {items.map(({ product, quantity, variantId, variantLabel, unitPrice }) => {
                const discPct = product.discountPercent ? Math.round(product.discountPercent) : 0
                const idx = getColorIdx(product.name)
                return (
                  <li key={`${product.id}::${variantId ?? ''}`} className="py-4 flex gap-3">
                    {/* Letter initial thumbnail */}
                    <div
                      className="w-14 h-14 rounded-[12px] flex-shrink-0 flex items-center justify-center text-[22px] font-bold"
                      style={{ background: TONES[idx], color: FGTONES[idx] }}
                    >
                      {product.name[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: FGTONES[idx] }}>
                        {product.brandName}
                      </p>
                      <p className="text-[13px] font-medium text-ink line-clamp-2 leading-snug">
                        {product.name}
                      </p>
                      {variantLabel && (
                        <p className="text-[11px] text-muted mt-0.5">{variantLabel}</p>
                      )}

                      {/* Qty controls + price row */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1, variantId)}
                            className="w-7 h-7 flex items-center justify-center text-[18px] font-medium text-muted hover:text-ink transition-colors"
                          >
                            −
                          </button>
                          <span className="text-[13px] font-semibold text-ink tnum w-6 text-center select-none">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1, variantId)}
                            className="w-7 h-7 flex items-center justify-center text-[18px] font-medium text-muted hover:text-ink transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(product.id, variantId)}
                            className="ml-1 text-[11px] font-medium text-muted hover:text-error transition-colors px-1"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-[15px] font-bold text-ink tnum">
                            ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                          </p>
                          {discPct > 0 && (
                            <p className="text-[11px] text-discount font-semibold">{discPct}% off</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer — only when items exist */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 pt-4 pb-5 shrink-0 space-y-2.5">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">Subtotal</span>
              <span className="text-[14px] font-semibold text-ink tnum">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            {/* You save */}
            {savings > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-success">You save</span>
                <span className="text-[13px] font-semibold text-success tnum">
                  −₹{Math.round(savings).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="border-t border-border" />

            {/* To pay */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">To pay</span>
              <span className="text-[20px] font-bold text-ink tnum">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Two buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { closeDrawer(); navigate(ROUTES.CART) }}
                className="flex-1 py-2.5 border-2 border-border rounded-[10px] text-[13px] font-semibold text-ink hover:border-ink transition-colors"
              >
                Open cart
              </button>
              <button
                onClick={() => { closeDrawer(); navigate(ROUTES.CHECKOUT) }}
                className="flex-1 py-2.5 bg-primary text-white font-semibold text-[14px] rounded-[10px] hover:bg-primary-dark transition-colors"
              >
                Checkout →
              </button>
            </div>

            {/* Security line */}
            <p className="text-[11px] text-muted text-center pt-0.5">
              🔒 Secure · 256-bit TLS · Easy 30-day returns
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
