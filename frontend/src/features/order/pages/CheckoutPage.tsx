import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Tag, X, CheckCircle, Wallet, CreditCard, Truck, Check, Plus, ChevronLeft, Clock,
} from 'lucide-react'
import { useCartStore } from '@/features/cart/store/useCartStore'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { orderApi } from '@/features/order/api/orderApi'
import { couponApi, type CouponValidateDto } from '@/features/coupon/api/couponApi'
import { addressApi, type AddressDto } from '@/features/address/api/addressApi'
import { walletApi } from '@/features/wallet/api/walletApi'
import { paymentApi } from '@/features/payment/api/paymentApi'
import { useGeolocation } from '@/shared/hooks/useGeolocation'
import { reserveApi } from '@/features/cart/api/reserveApi'
import { Input } from '@/shared/components/ui/Input'
import { ROUTES } from '@/app/router'

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description?: string
  handler: (response: RazorpayPaymentResponse) => void
  prefill?: { name?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

const schema = z.object({
  name: z.string().min(2, 'Required'),
  phone: z.string().length(10, 'Enter valid 10-digit mobile number'),
  pincode: z.string().length(6, 'Enter valid 6-digit pincode'),
  address: z.string().min(10, 'Enter complete address'),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
})

type FormData = z.infer<typeof schema>
type PaymentMethod = 'COD' | 'Razorpay'
type WizardStep = 1 | 2 | 3

/* ── Color helpers for letter thumbnails ──────────────────────── */
const TONES   = ['#E6F1FE', '#E6F8EF', '#FFF4E0', '#FCEAF2', '#F1ECFF']
const FGTONES = ['#006FEE', '#17C964', '#D97706', '#D6336C', '#7828C8']
function getColorIdx(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % TONES.length
}

/* ── Step indicator ───────────────────────────────────────────── */
function Stepper({ step }: { step: WizardStep }) {
  const STEPS = ['Address', 'Review', 'Payment']
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((label, i) => {
        const num = (i + 1) as WizardStep
        const done   = step > num
        const active = step === num
        return (
          <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors ${
                done   ? 'bg-success text-white' :
                active ? 'bg-primary text-white' :
                         'border-2 border-border text-muted bg-white'
              }`}>
                {done ? <Check size={14} /> : num}
              </div>
              <span className={`text-[13px] font-semibold ${active ? 'text-ink' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-4 transition-colors ${done ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Section heading ──────────────────────────────────────────── */
function SectionHeading({ children }: { children: string }) {
  return (
    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-5 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
      {children}
    </p>
  )
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<WizardStep>(1)
  const [apiError, setApiError] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateDto | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [walletBalance, setWalletBalance] = useState(0)
  const [useWallet, setUseWallet] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [razorpayProcessing, setRazorpayProcessing] = useState(false)

  const [reservedUntil, setReservedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState('')
  const [reservationExpired, setReservationExpired] = useState(false)
  const orderPlacedRef = useRef(false)

  const { detect: detectLocation, loading: locationLoading, error: locationError } = useGeolocation()

  const { register, handleSubmit, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (items.length === 0) { navigate(ROUTES.CART); return null }
  if (!isAuthenticated) { navigate(ROUTES.LOGIN); return null }
  if (user?.role === 'Admin' || user?.role === 'Seller') { navigate(ROUTES.HOME); return null }

  const fillFromAddress = (a: AddressDto) => {
    setValue('name', a.fullName)
    setValue('phone', a.phone)
    setValue('address', a.addressLine)
    setValue('city', a.city)
    setValue('state', a.state)
    setValue('pincode', a.postalCode)
  }

  const handleSelectAddress = (a: AddressDto) => {
    fillFromAddress(a)
    setSelectedAddressId(a.id)
    setShowNewForm(false)
  }

  useEffect(() => {
    addressApi.getAll().then((addrs) => {
      setSavedAddresses(addrs)
      const def = addrs.find((a) => a.isDefault) ?? addrs[0]
      if (def) {
        fillFromAddress(def)
        setSelectedAddressId(def.id)
      } else {
        setShowNewForm(true)
      }
    }).catch(() => { setShowNewForm(true) })

    walletApi.getBalance().then(setWalletBalance).catch(() => {})
  }, [])

  // Reserve stock on mount; release on unmount unless the order was placed
  useEffect(() => {
    const cartItems = items
      .filter((i) => i.variantId != null)
      .map((i) => ({ variantId: i.variantId as string, quantity: i.quantity }))

    if (cartItems.length > 0) {
      reserveApi.reserve(cartItems)
        .then((status) => {
          if (status.expiresAt) setReservedUntil(new Date(status.expiresAt))
        })
        .catch(() => { /* non-blocking — checkout still works without reservation */ })
    }

    return () => {
      if (!orderPlacedRef.current) {
        reserveApi.release().catch(() => {})
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!reservedUntil) return
    const tick = () => {
      const diff = Math.floor((reservedUntil.getTime() - Date.now()) / 1000)
      if (diff <= 0) {
        setCountdown('00:00')
        setReservationExpired(true)
        return
      }
      const m = Math.floor(diff / 60).toString().padStart(2, '0')
      const s = (diff % 60).toString().padStart(2, '0')
      setCountdown(`${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [reservedUntil])

  const subtotal = getTotal()
  const discount = appliedCoupon?.discountAmount ?? 0
  const afterCoupon = subtotal - discount
  const walletApplied = useWallet ? Math.min(walletBalance, afterCoupon) : 0
  const finalTotal = afterCoupon - walletApplied

  const paymentKey =
    finalTotal === 0     ? 'Wallet' :
    paymentMethod === 'Razorpay' ? 'Razorpay' :
    'COD'

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

  const handleDetectLocation = () => {
    detectLocation(({ pincode, city, state }) => {
      if (pincode) setValue('pincode', pincode)
      if (city)    setValue('city', city)
      if (state)   setValue('state', state)
    })
  }

  const handleContinueFromAddress = async () => {
    const valid = await trigger(['name', 'phone', 'pincode', 'address', 'city', 'state'])
    if (valid) setStep(2)
  }

  const buildOrderPayload = (data: FormData) => ({
    shippingAddress: `${data.name}, ${data.phone}, ${data.address}`,
    city: data.city,
    state: data.state,
    postalCode: data.pincode,
    paymentMethod: paymentKey,
    items: items.map(({ product, quantity, variantId }) => ({ productId: product.id, quantity, variantId })),
    couponCode: appliedCoupon?.code,
    walletAmount: walletApplied > 0 ? walletApplied : undefined,
  })

  const openRazorpay = (data: FormData): Promise<{ razorpayOrderId: string; razorpayPaymentId: string }> =>
    new Promise(async (resolve, reject) => {
      try {
        setRazorpayProcessing(true)
        const rzpOrder = await paymentApi.createRazorpayOrder(finalTotal)
        const options: RazorpayOptions = {
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          order_id: rzpOrder.razorpayOrderId,
          name: 'PrakashMart',
          description: 'Order Payment',
          prefill: { name: data.name, contact: data.phone },
          theme: { color: '#006FEE' },
          handler: async (response) => {
            try {
              await paymentApi.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              resolve({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
              })
            } catch {
              reject(new Error('Payment verification failed. Please contact support.'))
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } catch (err) {
        reject(err)
      } finally {
        setRazorpayProcessing(false)
      }
    })

  const onSubmit = async (data: FormData) => {
    if (reservationExpired) {
      setApiError('Your reservation has expired. Please return to cart and try again.')
      return
    }
    setApiError('')
    try {
      let order
      if (paymentMethod === 'Razorpay' && finalTotal > 0) {
        const { razorpayOrderId, razorpayPaymentId } = await openRazorpay(data)
        order = await orderApi.create({ ...buildOrderPayload(data), razorpayOrderId, razorpayPaymentId })
      } else {
        order = await orderApi.create(buildOrderPayload(data))
      }
      orderPlacedRef.current = true
      clearCart()
      navigate(ROUTES.ORDER_DETAIL.replace(':id', order.id))
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message
      setApiError(msg || 'Failed to place order. Please try again.')
    }
  }

  const isLoading = isSubmitting || razorpayProcessing
  const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId)

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Back link */}
      <Link
        to={ROUTES.CART}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink transition-colors mb-6"
      >
        <ChevronLeft size={15} /> Back to cart
      </Link>

      {/* Heading */}
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-8 leading-tight">
        Checkout, <em className="not-italic text-primary font-bold">three quick steps.</em>
      </h1>

      {/* Reservation countdown */}
      {countdown && (
        <div className={`mb-5 px-4 py-2.5 rounded-[12px] flex items-center gap-2 text-[13px] font-medium border ${
          reservationExpired
            ? 'bg-red-50 text-red-600 border-red-200'
            : parseInt(countdown.split(':')[0]) === 0 && parseInt(countdown.split(':')[1]) < 180
            ? 'bg-warning/10 text-yellow-700 border-warning/30'
            : 'bg-primary/5 text-primary border-primary/20'
        }`}>
          <Clock size={14} className="shrink-0" />
          {reservationExpired ? (
            <span>
              Your reservation expired.{' '}
              <a href="/cart" className="font-bold underline">Return to cart</a>
              {' '}to try again.
            </span>
          ) : (
            <span>Items reserved for <strong>{countdown}</strong> — complete checkout before time runs out.</span>
          )}
        </div>
      )}

      {/* Stepper */}
      <Stepper step={step} />

      {/* ── Step 1: Address ──────────────────────────────────── */}
      {step === 1 && (
        <div>
          <SectionHeading>Where should we send it?</SectionHeading>

          {savedAddresses.length > 0 && (() => {
            const selAddr = !showNewForm ? savedAddresses.find(a => a.id === selectedAddressId) : undefined
            const otherAddrs = savedAddresses.filter(a => a.id !== selectedAddressId || showNewForm)
            return (
              <>
                {/* Selected address — full-width card */}
                {selAddr && (
                  <div className="mb-4 p-5 border-2 border-ink rounded-[16px] bg-white">
                    <p className="text-[15px] font-semibold text-ink">
                      {selAddr.fullName} · <span className="font-normal text-muted">{selAddr.phone}</span>
                    </p>
                    <p className="text-[13px] text-muted mt-1 leading-snug">{selAddr.addressLine}</p>
                    <p className="text-[13px] text-muted">
                      {selAddr.city} — {selAddr.postalCode}, {selAddr.state}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5">
                        {selAddr.isDefault && (
                          <span className="text-[10px] font-bold text-success border border-success/50 rounded-full px-2.5 py-0.5 uppercase tracking-widest">
                            Default · {selAddr.label}
                          </span>
                        )}
                        {!selAddr.isDefault && (
                          <span className="text-[10px] font-bold text-muted border border-border rounded-full px-2.5 py-0.5 uppercase tracking-widest">
                            {selAddr.label}
                          </span>
                        )}
                      </div>
                      <Check size={18} className="text-ink" strokeWidth={2.5} />
                    </div>
                  </div>
                )}

                {/* Other addresses + Add new — 2-col grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {otherAddrs.map(a => (
                    <div key={a.id} className="p-4 border border-border rounded-[14px] bg-white flex flex-col gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">
                          {a.fullName} · <span className="font-normal text-muted">{a.label}</span>
                        </p>
                        <p className="text-[12px] text-muted mt-0.5 leading-snug">{a.addressLine}</p>
                        <p className="text-[12px] text-muted">{a.city} — {a.postalCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectAddress(a)}
                        className="self-start text-[12px] font-semibold text-ink border border-border rounded-[8px] px-3 py-1.5 hover:border-ink hover:bg-surface-2 transition-all"
                      >
                        Use this address
                      </button>
                    </div>
                  ))}

                  {/* Add new address */}
                  <button
                    type="button"
                    onClick={() => { setShowNewForm(true); setSelectedAddressId(null) }}
                    className={`p-4 border border-dashed rounded-[14px] flex flex-col items-start gap-1 min-h-[100px] transition-all ${
                      showNewForm ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={15} className={showNewForm ? 'text-primary' : 'text-ink'} />
                      <span className={`text-[13px] font-semibold ${showNewForm ? 'text-primary' : 'text-ink'}`}>
                        Add a new address
                      </span>
                    </div>
                    <span className="text-[12px] text-muted ml-[23px]">Save for later</span>
                  </button>
                </div>
              </>
            )
          })()}

          {/* Inline address form */}
          {(showNewForm || savedAddresses.length === 0) && (
            <div className="bg-white border border-border rounded-[14px] p-5 space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink">New address</p>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationLoading}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary-dark disabled:opacity-50 transition-colors"
                >
                  <MapPin size={13} />
                  {locationLoading ? 'Detecting...' : 'Use my location'}
                </button>
              </div>
              {locationError && <p className="text-[12px] text-error">{locationError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full Name" placeholder="Name" error={errors.name?.message} {...register('name')} />
                <Input label="Mobile Number" placeholder="10-digit number" error={errors.phone?.message} {...register('phone')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Pincode" placeholder="6-digit pincode" error={errors.pincode?.message} {...register('pincode')} />
                <Input label="City" placeholder="City" error={errors.city?.message} {...register('city')} />
              </div>
              <Input label="State" placeholder="State" error={errors.state?.message} {...register('state')} />
              <div>
                <label className="block text-[13px] font-medium text-ink mb-1.5">Address</label>
                <textarea
                  rows={3}
                  placeholder="House No, Building, Street, Area"
                  className="w-full border border-border rounded-[10px] px-3 py-2 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  {...register('address')}
                />
                {errors.address && <p className="text-[12px] text-error mt-1">{errors.address.message}</p>}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleContinueFromAddress}
            className="px-8 py-3 bg-primary text-white font-semibold text-[15px] rounded-full hover:bg-primary-dark transition-colors"
          >
            Continue to review →
          </button>
        </div>
      )}

      {/* ── Step 2: Review ───────────────────────────────────── */}
      {step === 2 && (
        <div>
          <SectionHeading>Review your order</SectionHeading>

          {/* Delivering to */}
          {selectedAddr && (
            <div className="bg-surface-2 rounded-[12px] px-4 py-3 mb-5 flex items-start gap-3">
              <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-ink">
                  {selectedAddr.fullName} · {selectedAddr.phone}
                </p>
                <p className="text-[12px] text-muted leading-snug">
                  {selectedAddr.addressLine}, {selectedAddr.city}, {selectedAddr.state} – {selectedAddr.postalCode}
                </p>
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="bg-white border border-border rounded-[14px] divide-y divide-border mb-5">
            {items.map(({ product, quantity, variantLabel, variantId, unitPrice }) => {
              const idx = getColorIdx(product.name)
              return (
                <div key={`${product.id}::${variantId ?? ''}`} className="flex gap-3 px-4 py-4 items-start">
                  <div
                    className="w-12 h-12 rounded-[10px] flex-shrink-0 flex items-center justify-center text-[18px] font-bold"
                    style={{ background: TONES[idx], color: FGTONES[idx] }}
                  >
                    {product.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: FGTONES[idx] }}>
                      {product.brandName}
                    </p>
                    <p className="text-[13px] font-medium text-ink line-clamp-2">{product.name}</p>
                    {variantLabel && <p className="text-[11px] text-muted">{variantLabel}</p>}
                    <p className="text-[12px] text-muted mt-0.5">Qty: {quantity}</p>
                  </div>
                  <p className="text-[14px] font-bold text-ink tnum shrink-0">
                    ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Coupon */}
          <div className="bg-white border border-border rounded-[14px] p-4 mb-4">
            <h3 className="text-[13px] font-bold text-ink mb-3 flex items-center gap-2">
              <Tag size={14} /> Promo Code
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-[10px] px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-success flex items-center gap-1">
                    <CheckCircle size={13} /> {appliedCoupon.code}
                  </p>
                  <p className="text-[11px] text-success/80">
                    {appliedCoupon.discountPercent}% off · Save ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError('') }}
                  className="text-success hover:text-success/70 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-border rounded-[10px] px-3 py-2 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-[10px] hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="text-[12px] text-error mt-1">{couponError}</p>}
            <p className="text-[11px] text-muted mt-2">Try: WELCOME10 · SAVE20 · FLAT5</p>
          </div>

          {/* Wallet */}
          {walletBalance > 0 && (
            <div className="bg-white border border-border rounded-[14px] p-4 mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Wallet size={16} className="text-primary" />
                  <div>
                    <p className="text-[13px] font-semibold text-ink">Use Wallet Balance</p>
                    <p className="text-[11px] text-muted">
                      Available: ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </label>
              {useWallet && walletApplied > 0 && (
                <p className="text-[12px] text-success mt-2 font-medium">
                  ₹{walletApplied.toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be deducted from your wallet
                </p>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="bg-white border border-border rounded-[14px] p-4 mb-6 space-y-2.5">
            <div className="flex justify-between text-[13px] text-muted">
              <span>Subtotal</span>
              <span className="tnum">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[13px] text-success font-medium">
                <span>Coupon Discount</span>
                <span className="tnum">−₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {walletApplied > 0 && (
              <div className="flex justify-between text-[13px] text-success font-medium">
                <span className="flex items-center gap-1"><Wallet size={12} /> Wallet</span>
                <span className="tnum">−₹{walletApplied.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="border-t border-border pt-2.5 flex justify-between font-bold text-ink">
              <span>Total</span>
              <span className="tnum text-[16px]">₹{Math.round(finalTotal).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 border-2 border-border rounded-[12px] text-[14px] font-semibold text-ink hover:border-ink transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-[2] py-3 bg-primary text-white font-semibold text-[15px] rounded-[12px] hover:bg-primary-dark transition-colors"
            >
              Continue to payment →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ──────────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <SectionHeading>How will you pay?</SectionHeading>

          {apiError && (
            <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[10px] px-4 py-3 mb-4">
              {apiError}
            </div>
          )}

          {finalTotal > 0 ? (
            <div className="space-y-3 mb-6">
              {/* Pay Online */}
              <label className={`flex items-start gap-4 p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
                paymentMethod === 'Razorpay'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-white'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="Razorpay"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={() => setPaymentMethod('Razorpay')}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-ink">Pay Online</p>
                  <p className="text-[12px] text-muted mt-0.5">UPI · Credit / Debit card · Net Banking via Razorpay</p>
                </div>
                <CreditCard size={18} className="text-muted mt-0.5 shrink-0" />
              </label>

              {/* Cash on Delivery */}
              <label className={`flex items-start gap-4 p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
                paymentMethod === 'COD'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 bg-white'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-ink">Cash on Delivery</p>
                  <p className="text-[12px] text-muted mt-0.5">Pay when your order arrives</p>
                </div>
                <Truck size={18} className="text-muted mt-0.5 shrink-0" />
              </label>
            </div>
          ) : (
            <div className="bg-success/10 border border-success/30 rounded-[14px] px-4 py-3 mb-6 flex items-center gap-2">
              <Wallet size={16} className="text-success" />
              <p className="text-[13px] font-semibold text-success">Full amount covered by wallet balance</p>
            </div>
          )}

          {/* Amount summary */}
          <div className="bg-surface-2 rounded-[12px] px-4 py-3 mb-6 flex justify-between items-center">
            <span className="text-[13px] text-muted font-medium">Amount to pay</span>
            <span className="text-[20px] font-bold text-ink tnum">
              ₹{Math.round(finalTotal).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setApiError(''); setStep(2) }}
              className="flex-1 py-3 border-2 border-border rounded-[12px] text-[14px] font-semibold text-ink hover:border-ink transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-3 bg-accent text-white font-semibold text-[15px] rounded-[12px] hover:bg-accent-dark transition-colors disabled:opacity-60"
            >
              {razorpayProcessing
                ? 'Opening Razorpay...'
                : isSubmitting
                  ? 'Placing Order...'
                  : finalTotal === 0
                    ? `Pay with Wallet · ₹${Math.round(afterCoupon).toLocaleString('en-IN')}`
                    : `Place order · ₹${Math.round(finalTotal).toLocaleString('en-IN')}`}
            </button>
          </div>

          <p className="text-[11px] text-muted text-center mt-4">
            🔒 Secure · 256-bit TLS · By placing this order you agree to our Terms of Service
          </p>
        </form>
      )}
    </div>
  )
}
