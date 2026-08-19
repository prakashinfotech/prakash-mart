import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Package, Truck, MapPin, Clock, Download, XCircle, Wallet, ChevronLeft } from 'lucide-react'
import { orderApi, type OrderDto, type OrderReturnDto } from '@/features/order/api/orderApi'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { ROUTES } from '@/app/router'

const STATUS_STEPS  = ['Pending', 'Processing', 'Shipped', 'InTransit', 'Delivered']
const STEP_ICONS    = [Clock, Package, Package, Truck, MapPin]
const STEP_LABELS: Record<string, string> = {
  Pending: 'Order Placed', Processing: 'Processing',
  Shipped: 'Shipped', InTransit: 'In Transit', Delivered: 'Delivered',
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending:    { bg: '#FFF4E0', text: '#D97706' },
  Processing: { bg: '#E6F1FE', text: '#006FEE' },
  Shipped:    { bg: '#EEF2FF', text: '#4F46E5' },
  InTransit:  { bg: '#F5F3FF', text: '#7828C8' },
  Delivered:  { bg: '#E6F8EF', text: '#17C964' },
  Cancelled:  { bg: '#FEE2E2', text: '#EF4444' },
}

const TONES   = ['#E6F1FE', '#E6F8EF', '#FFF4E0', '#FCEAF2', '#F1ECFF']
const FGTONES = ['#006FEE', '#17C964', '#D97706', '#D6336C', '#7828C8']
function getColorIdx(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % TONES.length
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<OrderDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [returnData, setReturnData] = useState<OrderReturnDto | null | undefined>(undefined)
  const [returnReason, setReturnReason] = useState('')
  const [returningOrder, setReturningOrder] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)

  const handleDownloadInvoice = async () => {
    if (!id) return
    setDownloading(true)
    try { await orderApi.downloadInvoice(id) }
    finally { setDownloading(false) }
  }

  const handleCancelOrder = async () => {
    if (!id || !confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    try {
      const updated = await orderApi.cancelOrder(id)
      setOrder(updated)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg ?? 'Failed to cancel order.')
    } finally { setCancelling(false) }
  }

  const handleRequestReturn = async () => {
    if (!id || !returnReason.trim()) return
    setReturningOrder(true)
    try {
      const r = await orderApi.requestReturn(id, returnReason)
      setReturnData(r)
      setShowReturnForm(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      alert(msg ?? 'Failed to submit return request.')
    } finally { setReturningOrder(false) }
  }

  const canCancel = user?.role === 'Customer' && (order?.status === 'Pending' || order?.status === 'Processing')
  const canReturn = user?.role === 'Customer' && order?.status === 'Delivered' && returnData === null

  useEffect(() => {
    if (!id) return
    orderApi.getById(id).then(setOrder).catch(() => setError('Order not found.')).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || user?.role !== 'Customer') return
    orderApi.getReturn(id).then(setReturnData).catch(() => setReturnData(null))
  }, [id, user?.role])

  if (loading) return <PageSpinner />

  if (error || !order) {
    return (
      <div className="max-w-[var(--container)] mx-auto px-4 py-8 text-center">
        <p className="text-error mb-4">{error || 'Order not found.'}</p>
        <Link to={ROUTES.ORDERS} className="text-primary text-[13px] font-semibold hover:underline">
          ← Back to Orders
        </Link>
      </div>
    )
  }

  const currentStepIndex = order.status === 'Cancelled' ? -1 : STATUS_STEPS.indexOf(order.status)
  const statusStyle = STATUS_STYLES[order.status] ?? { bg: '#F4F4F5', text: '#71717A' }

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      {/* Back + header */}
      <Link to={ROUTES.ORDERS} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink transition-colors mb-6">
        <ChevronLeft size={15} /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="text-[28px] font-bold text-ink tracking-tight">
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
        </div>
        <span
          className="text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shrink-0"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: tracking + items */}
        <div className="lg:col-span-2 space-y-5">

          {/* Tracking timeline */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-5">Order Status</h2>

            {order.status === 'Cancelled' ? (
              <div className="flex items-center gap-2 text-error font-semibold">
                <XCircle size={18} /> Order Cancelled
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                {currentStepIndex >= 0 && (
                  <div
                    className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * (100 - 8)}%` }}
                  />
                )}
                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const Icon = STEP_ICONS[i]
                    const done   = i <= currentStepIndex
                    const active = i === currentStepIndex
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 w-16">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                          done ? 'bg-primary text-white' : 'bg-white border-2 border-border text-muted'
                        } ${active ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                          {done ? <CheckCircle size={15} /> : <Icon size={14} />}
                        </div>
                        <span className={`text-[11px] text-center leading-tight font-medium ${done ? 'text-primary' : 'text-muted'}`}>
                          {STEP_LABELS[step]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-4">Order Items</h2>
            <div className="space-y-0 divide-y divide-border">
              {order.items.map((item) => {
                const idx = getColorIdx(item.productName)
                return (
                  <div key={`${item.productId}-${item.variantLabel ?? ''}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div
                      className="w-10 h-10 rounded-[10px] flex-shrink-0 flex items-center justify-center text-[16px] font-bold"
                      style={{ background: TONES[idx], color: FGTONES[idx] }}
                    >
                      {item.productName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink line-clamp-1">{item.productName}</p>
                      {item.variantLabel && (
                        <p className="text-[11px] text-primary font-medium">{item.variantLabel}</p>
                      )}
                      <p className="text-[12px] text-muted">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</p>
                    </div>
                    <p className="text-[14px] font-bold text-ink tnum shrink-0">₹{item.subtotal.toLocaleString('en-IN')}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: summary + address */}
        <div className="space-y-4">

          {/* Summary card */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-ink">Order Summary</h2>
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-primary border border-primary/30 rounded-full px-3 py-1 hover:bg-primary/5 disabled:opacity-50 transition-colors"
              >
                <Download size={12} />
                {downloading ? 'Downloading...' : 'Invoice'}
              </button>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-muted">
                <span>Order ID</span>
                <span className="font-mono font-semibold text-ink">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Payment</span>
                <span className="text-ink font-medium">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</span>
              </div>
              {(order.walletAmountUsed ?? 0) > 0 && (
                <div className="flex justify-between text-success font-medium">
                  <span className="flex items-center gap-1"><Wallet size={12} /> Wallet used</span>
                  <span className="tnum">−₹{order.walletAmountUsed!.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-ink text-[15px] pt-2 border-t border-border">
                <span>Total</span>
                <span className="tnum">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="mt-4 w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-error border-2 border-error/30 rounded-full py-2.5 hover:bg-error/5 disabled:opacity-50 transition-colors"
              >
                <XCircle size={15} />
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {/* Return status */}
            {returnData?.status && (
              <div className={`mt-4 px-4 py-3 rounded-[12px] text-[13px] font-medium border ${
                returnData.status === 'Approved' ? 'bg-success/10 border-success/30 text-success' :
                returnData.status === 'Rejected' ? 'bg-error/10 border-error/30 text-error' :
                'bg-warning/10 border-warning/30 text-warning'
              }`}>
                Return <strong>{returnData.status}</strong>
                {returnData.status === 'Approved' && ' — Refund credited to your wallet.'}
                {returnData.status === 'Pending' && ' — Awaiting seller review.'}
              </div>
            )}

            {/* Return form */}
            {canReturn && !showReturnForm && (
              <button
                onClick={() => setShowReturnForm(true)}
                className="mt-4 w-full text-[13px] font-semibold text-warning border-2 border-warning/30 rounded-full py-2.5 hover:bg-warning/5 transition-colors"
              >
                Request Return / Refund
              </button>
            )}
            {canReturn && showReturnForm && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Reason for return..."
                  rows={3}
                  className="w-full border border-border rounded-[12px] px-3 py-2.5 text-[13px] outline-none focus:border-primary resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestReturn}
                    disabled={returningOrder || !returnReason.trim()}
                    className="flex-1 text-[13px] font-semibold bg-warning text-white rounded-full py-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {returningOrder ? 'Submitting...' : 'Submit Request'}
                  </button>
                  <button
                    onClick={() => setShowReturnForm(false)}
                    className="px-4 text-[13px] font-semibold border border-border rounded-full hover:border-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delivery address */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-3 flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> Delivery Address
            </h2>
            <p className="text-[13px] text-muted leading-relaxed">
              {order.shippingAddress}<br />
              {order.city}, {order.state} — {order.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
