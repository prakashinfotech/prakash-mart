import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { orderApi, type OrderDto } from '@/features/order/api/orderApi'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { ROUTES } from '@/app/router'

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending:    { bg: '#FFF4E0', text: '#D97706' },
  Processing: { bg: '#E6F1FE', text: '#006FEE' },
  Shipped:    { bg: '#EEF2FF', text: '#4F46E5' },
  InTransit:  { bg: '#F5F3FF', text: '#7828C8' },
  Delivered:  { bg: '#E6F8EF', text: '#17C964' },
  Cancelled:  { bg: '#FEE2E2', text: '#EF4444' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    orderApi.getMyOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      {/* Header */}
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        Order history
      </p>
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-6">
        Your <em className="italic text-primary">orders</em>.
      </h1>

      {error ? (
        <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[14px] px-4 py-3">{error}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-border rounded-[16px] py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-primary" />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-1">No orders yet</h2>
          <p className="text-[13px] text-muted mb-6">Your order history will appear here.</p>
          <Link
            to={ROUTES.PRODUCTS}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold text-[14px] rounded-full hover:bg-primary-dark transition-colors"
          >
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => {
            const style = STATUS_STYLES[order.status] ?? { bg: '#F4F4F5', text: '#71717A' }
            return (
              <div key={order.id} className="bg-white border border-border rounded-[16px] p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-mono text-[12px] font-bold text-ink tracking-wide">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[12px] text-muted mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                    style={{ background: style.bg, color: style.text }}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {order.items.map((item) => (
                    <div key={`${item.productId}-${item.variantLabel ?? ''}`} className="flex justify-between text-[13px]">
                      <span className="text-ink line-clamp-1 flex-1 pr-4">
                        {item.productName}
                        {item.variantLabel && (
                          <span className="text-primary ml-1 font-medium">({item.variantLabel})</span>
                        )}
                      </span>
                      <span className="text-muted shrink-0 tnum">
                        {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-[13px] text-muted">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                    <span className="font-semibold text-ink tnum">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  </span>
                  <Link
                    to={ROUTES.ORDER_DETAIL.replace(':id', order.id)}
                    className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    View Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
