import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { adminApi, type AdminStatsDto, type SellerSummaryDto, type UserSummaryDto, type CreateSellerPayload } from '@/features/admin/api/adminApi'
import { couponApi, type CouponDto, type CreateCouponDto } from '@/features/coupon/api/couponApi'
import { bannerApi, type BannerDto, type CreateBannerDto } from '@/features/banner/api/bannerApi'
import { variantTypeApi, variantApi, inventoryApi, type VariantTypeDto, type CreateVariantTypeDto, type ProductVariantDto } from '@/features/product/api/variantApi'
import { forecastApi, type ForecastSummaryDto } from '@/features/product/api/forecastApi'
import { sellerApi } from '@/features/seller/api/sellerApi'
import type { Product } from '@/features/product/types/product.types'
import type { OrderDto } from '@/features/order/api/orderApi'
import type { CategoryDto } from '@/features/category/api/categoryApi'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { ROUTES } from '@/app/router'

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'InTransit', 'Delivered', 'Cancelled']
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending:    { bg: '#FFF4E0', text: '#D97706' },
  Processing: { bg: '#E6F1FE', text: '#006FEE' },
  Shipped:    { bg: '#EEF2FF', text: '#4F46E5' },
  InTransit:  { bg: '#F5F3FF', text: '#7828C8' },
  Delivered:  { bg: '#E6F8EF', text: '#17C964' },
  Cancelled:  { bg: '#FEE2E2', text: '#EF4444' },
}

const INPUT_CLS = 'w-full h-[40px] bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all'

type Tab = 'orders' | 'sellers' | 'users' | 'categories' | 'coupons' | 'banners' | 'variants' | 'inventory'

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('orders')
  const [stats, setStats] = useState<AdminStatsDto | null>(null)
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [sellers, setSellers] = useState<SellerSummaryDto[]>([])
  const [users, setUsers] = useState<UserSummaryDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [coupons, setCoupons] = useState<CouponDto[]>([])
  const [couponForm, setCouponForm] = useState<CreateCouponDto>({ code: '', discountPercent: 10, maxUses: 100, expiresAt: '' })
  const [addingCoupon, setAddingCoupon] = useState(false)
  const [banners, setBanners] = useState<BannerDto[]>([])
  const [bannerForm, setBannerForm] = useState<CreateBannerDto>({
    title: '', subtitle: '', badge: '', ctaText: '', ctaCategory: '', gradient: 'from-blue-700 via-blue-500 to-cyan-400', emoji: '🛍️', sortOrder: 10,
  })
  const [addingBanner, setAddingBanner] = useState(false)
  const [sellerForm, setSellerForm] = useState<CreateSellerPayload>({ name: '', email: '', password: '' })
  const [addingSeller, setAddingSeller] = useState(false)
  const [sellerFormError, setSellerFormError] = useState('')
  const [variantTypes, setVariantTypes] = useState<VariantTypeDto[]>([])
  const EMPTY_VT: CreateVariantTypeDto = { name: '', displayType: 'select', suggestedOptions: [], categoryIds: [] }
  const [vtForm, setVtForm] = useState<CreateVariantTypeDto>(EMPTY_VT)
  const [vtOptionInput, setVtOptionInput] = useState('')
  const [addingVt, setAddingVt] = useState(false)
  const [editingVtId, setEditingVtId] = useState<string | null>(null)

  // Inventory + forecast tab state
  const [adminForecast, setAdminForecast] = useState<ForecastSummaryDto | null>(null)
  const [adminForecastLoaded, setAdminForecastLoaded] = useState(false)
  const [invProducts, setInvProducts] = useState<Product[]>([])
  const [invProductsLoaded, setInvProductsLoaded] = useState(false)
  const [invSearch, setInvSearch] = useState('')
  const [invExpandedId, setInvExpandedId] = useState<string | null>(null)
  const [invVariantsMap, setInvVariantsMap] = useState<Record<string, ProductVariantDto[]>>({})
  const [invVariantsLoading, setInvVariantsLoading] = useState<string | null>(null)
  const [invAdjust, setInvAdjust] = useState<{ variantId: string; productId: string; stock: string; reason: string } | null>(null)
  const [invAdjusting, setInvAdjusting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'Admin') { navigate(ROUTES.HOME); return }
    Promise.all([
      adminApi.getStats(),
      adminApi.getAllOrders(),
      adminApi.getSellers(),
      adminApi.getUsers(),
      adminApi.getCategories(),
      couponApi.getAll(),
      bannerApi.getAll(),
      variantTypeApi.getAll(),
    ])
      .then(([s, o, se, u, c, cp, bn, vt]) => {
        setStats(s); setOrders(o); setSellers(se); setUsers(u); setCategories(c); setCoupons(cp); setBanners(bn); setVariantTypes(vt)
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    try {
      const updated = await adminApi.updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch { alert('Failed to update status.') }
    finally { setUpdatingId(null) }
  }

  const handleToggleUser = async (id: string) => {
    setUpdatingId(id)
    try {
      const updated = await adminApi.toggleUser(id)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch { alert('Failed to toggle user.') }
    finally { setUpdatingId(null) }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    setAddingCategory(true)
    try {
      const created = await adminApi.createCategory(newCategoryName.trim())
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCategoryName('')
    } catch { alert('Failed to create category.') }
    finally { setAddingCategory(false) }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products in this category may be affected.`)) return
    try {
      await adminApi.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch { alert('Failed to delete category.') }
  }

  const handleAddCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.expiresAt) { alert('Fill all coupon fields.'); return }
    setAddingCoupon(true)
    try {
      const created = await couponApi.create({ ...couponForm, code: couponForm.code.toUpperCase() })
      setCoupons((prev) => [created, ...prev])
      setCouponForm({ code: '', discountPercent: 10, maxUses: 100, expiresAt: '' })
    } catch { alert('Failed to create coupon. Code may already exist.') }
    finally { setAddingCoupon(false) }
  }

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return
    try {
      await couponApi.delete(id)
      setCoupons((prev) => prev.filter((c) => c.id !== id))
    } catch { alert('Failed to delete coupon.') }
  }

  const handleAddBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.ctaCategory.trim()) { alert('Title and category are required.'); return }
    setAddingBanner(true)
    try {
      const created = await bannerApi.create(bannerForm)
      setBanners((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder))
      setBannerForm({ title: '', subtitle: '', badge: '', ctaText: '', ctaCategory: '', gradient: 'from-blue-700 via-blue-500 to-cyan-400', emoji: '🛍️', sortOrder: 10 })
    } catch { alert('Failed to create banner.') }
    finally { setAddingBanner(false) }
  }

  const handleToggleBanner = async (id: string) => {
    setUpdatingId(id)
    try {
      await bannerApi.toggle(id)
      setBanners((prev) => prev.map((b) => b.id === id ? { ...b, isActive: !b.isActive } : b))
    } catch { alert('Failed to toggle banner.') }
    finally { setUpdatingId(null) }
  }

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Delete banner "${title}"?`)) return
    try {
      await bannerApi.delete(id)
      setBanners((prev) => prev.filter((b) => b.id !== id))
    } catch { alert('Failed to delete banner.') }
  }

  const handleCreateSeller = async () => {
    setSellerFormError('')
    if (!sellerForm.name.trim() || !sellerForm.email.trim() || !sellerForm.password.trim()) {
      setSellerFormError('All fields are required.')
      return
    }
    setAddingSeller(true)
    try {
      const created = await adminApi.createSeller(sellerForm)
      setSellers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSellerForm({ name: '', email: '', password: '' })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSellerFormError(msg ?? 'Failed to create seller.')
    } finally { setAddingSeller(false) }
  }

  const handleToggleSeller = async (id: string) => {
    setUpdatingId(id)
    try {
      const updated = await adminApi.toggleSeller(id)
      setSellers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch { alert('Failed to toggle seller.') }
    finally { setUpdatingId(null) }
  }

  if (loading) return <PageSpinner />

  const TABS: { key: Tab; label: string }[] = [
    { key: 'orders', label: `Orders (${orders.length})` },
    { key: 'sellers', label: `Sellers (${sellers.length})` },
    { key: 'users', label: `Users (${users.length})` },
    { key: 'categories', label: `Categories (${categories.length})` },
    { key: 'coupons', label: `Coupons (${coupons.length})` },
    { key: 'banners', label: `Banners (${banners.length})` },
    { key: 'variants', label: `Variant Types (${variantTypes.length})` },
    { key: 'inventory', label: 'Inventory' },
  ]

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        Platform management
      </p>
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-6">
        Admin <em className="italic text-primary">dashboard</em>.
      </h1>

      {/* Stats */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Total Orders', value: stats.totalOrders, color: '#006FEE' },
              { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, color: '#D97706' },
              { label: 'Customers', value: stats.totalCustomers, color: '#17C964' },
              { label: 'Sellers', value: stats.totalSellers, color: '#7828C8' },
              { label: 'Products', value: stats.totalProducts, color: '#D6336C' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-border rounded-[16px] p-4">
                <p className="text-[24px] font-bold tnum" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[12px] text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {stats.monthlyRevenue.length > 0 && (
              <div className="bg-white border border-border rounded-[16px] p-5">
                <h3 className="text-[13px] font-bold text-ink mb-4">Monthly Revenue (6 months)</h3>
                <div className="flex items-end gap-2 h-32">
                  {(() => {
                    const max = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1)
                    return stats.monthlyRevenue.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted">₹{(m.revenue / 1000).toFixed(0)}k</span>
                        <div className="w-full bg-primary rounded-t transition-all" style={{ height: `${(m.revenue / max) * 88}px` }} />
                        <span className="text-[10px] text-muted text-center leading-tight">{m.month.split(' ')[0]}</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {stats.topCategories.length > 0 && (
              <div className="bg-white border border-border rounded-[16px] p-5">
                <h3 className="text-[13px] font-bold text-ink mb-4">Top Categories by Revenue</h3>
                <div className="space-y-2.5">
                  {(() => {
                    const max = Math.max(...stats.topCategories.map(c => c.revenue), 1)
                    return stats.topCategories.map((c, i) => (
                      <div key={c.category} className="flex items-center gap-2">
                        <span className="text-[11px] text-muted w-4">{i + 1}</span>
                        <span className="text-[12px] text-ink w-24 truncate">{c.category}</span>
                        <div className="flex-1 bg-border rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-success transition-all" style={{ width: `${(c.revenue / max) * 100}%` }} />
                        </div>
                        <span className="text-[11px] text-muted w-14 text-right tnum">₹{(c.revenue / 1000).toFixed(0)}k</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              if (t.key === 'inventory' && !invProductsLoaded) {
                sellerApi.getMyProducts().then(prods => {
                  setInvProducts(prods)
                  setInvProductsLoaded(true)
                }).catch(() => {})
                if (!adminForecastLoaded) {
                  forecastApi.getAdmin().then(f => { setAdminForecast(f); setAdminForecastLoaded(true) }).catch(() => {})
                }
              }
            }}
            className={`px-4 py-2 text-[13px] font-semibold whitespace-nowrap rounded-full border transition-colors ${
              tab === t.key
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted hover:border-ink hover:text-ink bg-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-[13px] rounded-[12px] px-4 py-3 mb-4">{error}</div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        orders.length === 0 ? (
          <div className="bg-white border border-border rounded-[16px] p-16 text-center">
            <p className="text-muted text-[14px]">No orders yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-[16px] overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F5F5F7] border-b border-border">
                <tr>
                  {['Order ID', 'Items', 'Address', 'Total', 'Status', 'Date'].map((h, i) => (
                    <th key={h} className={`p-3 font-semibold text-muted ${i >= 3 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => {
                  const style = STATUS_STYLES[order.status] ?? { bg: '#F4F4F5', text: '#71717A' }
                  return (
                    <tr key={order.id} className="hover:bg-[#F5F5F7]">
                      <td className="p-3 font-mono text-[11px] text-muted">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="p-3">
                        {order.items.map((item) => (
                          <p key={item.productId} className="text-ink line-clamp-1">
                            {item.productName} <span className="text-muted">×{item.quantity}</span>
                          </p>
                        ))}
                      </td>
                      <td className="p-3 text-muted max-w-[160px]">
                        <p className="line-clamp-2">{order.shippingAddress}, {order.city}</p>
                      </td>
                      <td className="p-3 text-center font-semibold text-ink tnum">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        {updatingId === order.id ? (
                          <span className="text-[11px] text-muted">Updating…</span>
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="text-[11px] font-bold rounded-full px-2.5 py-1 border-0 cursor-pointer outline-none"
                            style={{ background: style.bg, color: style.text }}
                          >
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="p-3 text-muted text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Sellers Tab */}
      {tab === 'sellers' && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-4">Create Seller Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'name', label: 'Full Name', placeholder: 'Seller name', type: 'text' },
                { key: 'email', label: 'Email', placeholder: 'seller@example.com', type: 'email' },
                { key: 'password', label: 'Password', placeholder: 'Temporary password', type: 'password' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[12px] font-semibold text-muted mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(sellerForm as unknown as Record<string, string>)[key]}
                    onChange={(e) => setSellerForm({ ...sellerForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={INPUT_CLS}
                  />
                </div>
              ))}
            </div>
            {sellerFormError && <p className="text-[12px] text-error mt-2">{sellerFormError}</p>}
            <button
              onClick={handleCreateSeller}
              disabled={addingSeller}
              className="mt-4 flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Plus size={14} /> {addingSeller ? 'Creating...' : 'Create Seller'}
            </button>
          </div>

          <div className="bg-white border border-border rounded-[16px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F5F5F7] border-b border-border">
                <tr>
                  {['Seller', 'Email', 'Products', 'Status', 'Joined', 'Action'].map((h, i) => (
                    <th key={h} className={`p-3 font-semibold text-muted ${i >= 2 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sellers.map((s) => (
                  <tr key={s.id} className={!s.isActive ? 'opacity-60' : 'hover:bg-[#F5F5F7]'}>
                    <td className="p-3 font-semibold text-ink">{s.name}</td>
                    <td className="p-3 text-muted">{s.email}</td>
                    <td className="p-3 text-center text-ink">{s.productCount}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-muted text-[11px]">
                      {new Date(s.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleSeller(s.id)}
                        disabled={updatingId === s.id}
                        className={`text-[12px] font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                          s.isActive ? 'border-error/30 text-error hover:bg-error/5' : 'border-success/30 text-success hover:bg-success/5'
                        }`}
                      >
                        {updatingId === s.id ? '...' : s.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="bg-white border border-border rounded-[16px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F5F5F7] border-b border-border">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Action'].map((h, i) => (
                  <th key={h} className={`p-3 font-semibold text-muted ${i >= 2 ? 'text-center' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className={!u.isActive ? 'opacity-60' : 'hover:bg-[#F5F5F7]'}>
                  <td className="p-3 font-semibold text-ink">{u.name}</td>
                  <td className="p-3 text-muted">{u.email}</td>
                  <td className="p-3 text-center">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      u.role === 'Admin' ? 'bg-[#F5F3FF] text-[#7828C8]' : u.role === 'Seller' ? 'bg-[#E6F1FE] text-[#006FEE]' : 'bg-[#F4F4F5] text-[#71717A]'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${u.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-muted text-[11px]">
                    {new Date(u.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-3 text-center">
                    {u.role !== 'Admin' && (
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        disabled={updatingId === u.id}
                        className={`text-[12px] font-semibold px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                          u.isActive ? 'border-error/30 text-error hover:bg-error/5' : 'border-success/30 text-success hover:bg-success/5'
                        }`}
                      >
                        {updatingId === u.id ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-4">Add New Category</h2>
            <div className="flex gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="Category name"
                className={INPUT_CLS + ' flex-1'}
              />
              <button
                onClick={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
                className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                <Plus size={14} /> {addingCategory ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-border rounded-[16px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F5F5F7] border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold text-muted">Category Name</th>
                  <th className="text-center p-3 font-semibold text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F5F7]">
                    <td className="p-3 font-medium text-ink">{c.name}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {tab === 'coupons' && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-4">Create New Coupon</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'code', label: 'Code', placeholder: 'SAVE20', type: 'text' },
                { key: 'discountPercent', label: 'Discount %', placeholder: '10', type: 'number' },
                { key: 'maxUses', label: 'Max Uses', placeholder: '100', type: 'number' },
                { key: 'expiresAt', label: 'Expires At', placeholder: '', type: 'date' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[12px] font-semibold text-muted mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(couponForm as unknown as Record<string, string | number>)[key] as string}
                    onChange={(e) => setCouponForm({
                      ...couponForm,
                      [key]: type === 'number' ? Number(e.target.value) : (key === 'code' ? e.target.value.toUpperCase() : e.target.value),
                    })}
                    placeholder={placeholder}
                    className={INPUT_CLS + (key === 'code' ? ' uppercase' : '')}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAddCoupon}
              disabled={addingCoupon}
              className="mt-4 flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Plus size={14} /> {addingCoupon ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>

          <div className="bg-white border border-border rounded-[16px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F5F5F7] border-b border-border">
                <tr>
                  {['Code', 'Discount', 'Usage', 'Expires', 'Status', 'Action'].map((h, i) => (
                    <th key={h} className={`p-3 font-semibold text-muted ${i >= 1 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => {
                  const expired = new Date(c.expiresAt) < new Date()
                  const isActive = c.isActive && !expired && c.usedCount < c.maxUses
                  return (
                    <tr key={c.id} className="hover:bg-[#F5F5F7]">
                      <td className="p-3 font-mono font-bold text-ink">{c.code}</td>
                      <td className="p-3 text-center font-semibold text-success">{c.discountPercent}%</td>
                      <td className="p-3 text-center text-muted">{c.usedCount}/{c.maxUses}</td>
                      <td className="p-3 text-center text-muted text-[11px]">
                        {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                          {!c.isActive || expired ? 'Inactive' : c.usedCount >= c.maxUses ? 'Exhausted' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-[16px] p-5">
            <h2 className="text-[14px] font-bold text-ink mb-4">Add New Banner</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'title', label: 'Title', placeholder: 'Up to 80% Off' },
                { key: 'subtitle', label: 'Subtitle', placeholder: 'Short description' },
                { key: 'badge', label: 'Badge', placeholder: '🔥 Limited Time' },
                { key: 'ctaText', label: 'CTA Text', placeholder: 'Shop Now' },
                { key: 'ctaCategory', label: 'Category (for link)', placeholder: 'Electronics' },
                { key: 'emoji', label: 'Emoji', placeholder: '📱' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[12px] font-semibold text-muted mb-1.5">{label}</label>
                  <input
                    value={(bannerForm as unknown as Record<string, string | number>)[key] as string}
                    onChange={(e) => setBannerForm({ ...bannerForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={INPUT_CLS}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-[12px] font-semibold text-muted mb-1.5">Gradient (Tailwind classes)</label>
                <input
                  value={bannerForm.gradient}
                  onChange={(e) => setBannerForm({ ...bannerForm, gradient: e.target.value })}
                  placeholder="from-blue-700 via-blue-500 to-cyan-400"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-muted mb-1.5">Sort Order</label>
                <input
                  type="number"
                  min={1}
                  value={bannerForm.sortOrder}
                  onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <button
              onClick={handleAddBanner}
              disabled={addingBanner}
              className="mt-4 flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              <Plus size={14} /> {addingBanner ? 'Adding...' : 'Add Banner'}
            </button>
          </div>

          <div className="bg-white border border-border rounded-[16px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-[#F5F5F7] border-b border-border">
                <tr>
                  {['Preview', 'Title', 'Category', 'Sort', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} className={`p-3 font-semibold text-muted ${i >= 3 ? 'text-center' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {banners.map((b) => (
                  <tr key={b.id} className={!b.isActive ? 'opacity-50' : 'hover:bg-[#F5F5F7]'}>
                    <td className="p-3">
                      <div className={`w-16 h-8 rounded-lg bg-gradient-to-r ${b.gradient} flex items-center justify-center text-base`}>
                        {b.emoji}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-ink">{b.title}</p>
                      <p className="text-[11px] text-muted line-clamp-1">{b.subtitle}</p>
                    </td>
                    <td className="p-3 text-muted">{b.ctaCategory}</td>
                    <td className="p-3 text-center text-muted">{b.sortOrder}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${b.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleBanner(b.id)}
                          disabled={updatingId === b.id}
                          title={b.isActive ? 'Deactivate' : 'Activate'}
                          className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {b.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(b.id, b.title)}
                          className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Variant Types ───────────────────────────────────────────────── */}
      {tab === 'variants' && (
        <div className="space-y-5">
          {/* Add / Edit Form */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <p className="text-[13px] font-semibold text-ink mb-3">
              {editingVtId ? 'Edit Variant Type' : 'New Variant Type'}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                className={INPUT_CLS}
                placeholder="Name (e.g. Storage, Size, RAM)"
                value={vtForm.name}
                onChange={e => setVtForm(f => ({ ...f, name: e.target.value }))}
              />
              <select
                className={INPUT_CLS}
                value={vtForm.displayType}
                onChange={e => setVtForm(f => ({ ...f, displayType: e.target.value as 'select' | 'text' | 'color' }))}
              >
                <option value="select">Select (dropdown / pills)</option>
                <option value="text">Text (free input)</option>
                <option value="color">Color (swatch)</option>
              </select>
            </div>

            {/* Suggested options */}
            <div className="mb-3">
              <p className="text-[11px] text-muted mb-1.5">Suggested Options</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {vtForm.suggestedOptions.map(opt => (
                  <span key={opt} className="inline-flex items-center gap-1 bg-surface border border-border rounded-full px-2.5 py-1 text-[12px]">
                    {opt}
                    <button onClick={() => setVtForm(f => ({ ...f, suggestedOptions: f.suggestedOptions.filter(o => o !== opt) }))} className="text-muted hover:text-error">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={INPUT_CLS}
                  placeholder="Add option (e.g. 128GB)"
                  value={vtOptionInput}
                  onChange={e => setVtOptionInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && vtOptionInput.trim()) {
                      setVtForm(f => ({ ...f, suggestedOptions: [...f.suggestedOptions, vtOptionInput.trim()] }))
                      setVtOptionInput('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (vtOptionInput.trim()) {
                      setVtForm(f => ({ ...f, suggestedOptions: [...f.suggestedOptions, vtOptionInput.trim()] }))
                      setVtOptionInput('')
                    }
                  }}
                  className="px-3 py-2 bg-surface border border-border rounded-[10px] text-[12px] font-medium hover:bg-primary/10 transition-colors whitespace-nowrap"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Category mapping */}
            <div className="mb-4">
              <p className="text-[11px] text-muted mb-1.5">Assign to Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const selected = vtForm.categoryIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setVtForm(f => ({
                        ...f,
                        categoryIds: selected
                          ? f.categoryIds.filter(id => id !== cat.id)
                          : [...f.categoryIds, cat.id]
                      }))}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                        selected ? 'bg-primary text-white border-primary' : 'bg-white border-border text-muted hover:border-ink hover:text-ink'
                      }`}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                disabled={addingVt || !vtForm.name.trim()}
                onClick={async () => {
                  setAddingVt(true)
                  try {
                    if (editingVtId) {
                      const updated = await variantTypeApi.update(editingVtId, vtForm)
                      setVariantTypes(prev => prev.map(vt => vt.id === editingVtId ? updated : vt))
                      setEditingVtId(null)
                    } else {
                      const created = await variantTypeApi.create(vtForm)
                      setVariantTypes(prev => [...prev, created])
                    }
                    setVtForm(EMPTY_VT)
                    setVtOptionInput('')
                  } catch { alert('Failed to save variant type.') }
                  finally { setAddingVt(false) }
                }}
                className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-[10px] disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {addingVt ? 'Saving…' : editingVtId ? 'Update' : 'Create Variant Type'}
              </button>
              {editingVtId && (
                <button
                  onClick={() => { setEditingVtId(null); setVtForm(EMPTY_VT); setVtOptionInput('') }}
                  className="px-4 py-2 border border-border text-[13px] text-muted rounded-[10px] hover:border-ink hover:text-ink transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Variant Types Table */}
          <div className="bg-white border border-border rounded-[16px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-surface border-b border-border">
                <tr>
                  {['Name', 'Type', 'Options', 'Categories', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {variantTypes.map(vt => (
                  <tr key={vt.id} className={`hover:bg-surface/50 ${!vt.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-ink">{vt.name}</td>
                    <td className="px-4 py-3 text-muted capitalize">{vt.displayType}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {vt.suggestedOptions.slice(0, 4).map(o => (
                          <span key={o} className="bg-surface border border-border rounded-full px-2 py-0.5 text-[11px]">{o}</span>
                        ))}
                        {vt.suggestedOptions.length > 4 && (
                          <span className="text-[11px] text-muted">+{vt.suggestedOptions.length - 4} more</span>
                        )}
                        {vt.suggestedOptions.length === 0 && <span className="text-muted text-[11px]">Free text</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-[12px]">
                      {vt.categoryIds.length === 0
                        ? '—'
                        : vt.categoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ')
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        vt.isActive ? 'bg-success/10 text-success' : 'bg-surface text-muted'
                      }`}>
                        {vt.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingVtId(vt.id)
                            setVtForm({ name: vt.name, displayType: vt.displayType, suggestedOptions: [...vt.suggestedOptions], categoryIds: [...vt.categoryIds] })
                          }}
                          className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await variantTypeApi.toggle(vt.id)
                              setVariantTypes(prev => prev.map(v => v.id === vt.id ? { ...v, isActive: !v.isActive } : v))
                            } catch { alert('Failed to toggle.') }
                          }}
                          className="p-1.5 text-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                          title={vt.isActive ? 'Disable' : 'Enable'}
                        >
                          {vt.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete variant type "${vt.name}"?`)) return
                            try {
                              await variantTypeApi.delete(vt.id)
                              setVariantTypes(prev => prev.filter(v => v.id !== vt.id))
                            } catch { alert('Failed to delete.') }
                          }}
                          className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {variantTypes.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No variant types yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Tab — product-browse view */}
      {tab === 'inventory' && (() => {
        // Order count per product (computed from already-loaded orders)
        const orderCountMap: Record<string, number> = {}
        orders.forEach(o => {
          const seen = new Set<string>()
          o.items.forEach(item => {
            if (!seen.has(item.productId)) {
              seen.add(item.productId)
              orderCountMap[item.productId] = (orderCountMap[item.productId] || 0) + 1
            }
          })
        })

        const filtered = invProducts.filter(p =>
          p.name.toLowerCase().includes(invSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(invSearch.toLowerCase())
        )

        const handleExpand = async (productId: string) => {
          if (invExpandedId === productId) { setInvExpandedId(null); return }
          setInvExpandedId(productId)
          if (!invVariantsMap[productId]) {
            setInvVariantsLoading(productId)
            try {
              const variants = await variantApi.getByProduct(productId)
              setInvVariantsMap(prev => ({ ...prev, [productId]: variants }))
            } finally { setInvVariantsLoading(null) }
          }
        }

        const handleAdjust = async () => {
          if (!invAdjust || invAdjust.stock === '') return
          setInvAdjusting(true)
          try {
            await inventoryApi.adminAdjust(invAdjust.variantId, Number(invAdjust.stock), invAdjust.reason || 'Admin adjustment')
            // Reload variants for that product so stock number refreshes
            const variants = await variantApi.getByProduct(invAdjust.productId)
            setInvVariantsMap(prev => ({ ...prev, [invAdjust.productId]: variants }))
            setInvAdjust(null)
          } finally { setInvAdjusting(false) }
        }

        return (
          <div className="space-y-4">
            {/* At-risk summary */}
            {adminForecast && (adminForecast.outOfStockCount + adminForecast.criticalCount + adminForecast.lowCount) > 0 && (
              <div className="bg-white border border-border rounded-[16px] p-4">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> Stock Alerts
                </p>
                <div className="flex flex-wrap gap-3 mb-3">
                  {adminForecast.outOfStockCount > 0 && (
                    <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                      {adminForecast.outOfStockCount} Out of Stock
                    </span>
                  )}
                  {adminForecast.criticalCount > 0 && (
                    <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-red-50 text-red-600">
                      {adminForecast.criticalCount} Critical (&lt;7 days)
                    </span>
                  )}
                  {adminForecast.lowCount > 0 && (
                    <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">
                      {adminForecast.lowCount} Low (7–14 days)
                    </span>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {adminForecast.items
                    .filter(i => i.status === 'OutOfStock' || i.status === 'Critical' || i.status === 'Low')
                    .slice(0, 8)
                    .map(item => (
                      <div key={item.variantId} className="py-2 flex items-center justify-between gap-4 text-[12px]">
                        <div>
                          <span className="font-semibold text-ink">{item.productName}</span>
                          {item.variantLabel && <span className="text-muted ml-1">· {item.variantLabel}</span>}
                          <span className="font-mono text-[10px] text-muted/60 ml-2">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted">Stock: <strong className={item.availableStock === 0 ? 'text-error' : 'text-ink'}>{item.availableStock}</strong></span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'OutOfStock' ? 'bg-red-100 text-red-700' :
                            item.status === 'Critical'   ? 'bg-red-50 text-red-600'   :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {item.daysRemaining === 0 ? 'OOS' : `${item.daysRemaining}d left`}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Search */}
            <input
              value={invSearch}
              onChange={e => setInvSearch(e.target.value)}
              placeholder="Search by product name or category…"
              className="w-full h-[40px] bg-white border border-border rounded-[12px] px-4 text-[13px] outline-none focus:border-primary transition-all"
            />

            {!invProductsLoaded ? (
              <div className="bg-white border border-border rounded-[16px] p-10 text-center text-[13px] text-muted">Loading products…</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-border rounded-[16px] p-10 text-center text-[13px] text-muted">No products found.</div>
            ) : (
              <div className="bg-white border border-border rounded-[16px] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-[#F9FAFB]">
                      <th className="px-4 py-3 text-left font-semibold text-muted text-[11px] uppercase">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted text-[11px] uppercase">Category</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted text-[11px] uppercase">Orders</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted text-[11px] uppercase">Stock</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const isExpanded = invExpandedId === p.id
                      const variants = invVariantsMap[p.id] ?? []
                      const isLoadingVariants = invVariantsLoading === p.id
                      const stockColor = p.stock === 0 ? 'text-error' : p.stock < 10 ? 'text-warning' : 'text-success'

                      return (
                        <>
                          {/* Product row */}
                          <tr
                            key={p.id}
                            onClick={() => handleExpand(p.id)}
                            className="border-b border-border cursor-pointer hover:bg-[#F9FAFB] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="text-muted text-[11px] w-3">{isExpanded ? '▼' : '▶'}</span>
                                <div>
                                  <p className="font-semibold text-ink leading-tight">{p.name}</p>
                                  <p className="text-[11px] text-muted">{p.brandName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted">{p.category}</td>
                            <td className="px-4 py-3 text-right font-semibold text-ink">{orderCountMap[p.id] ?? 0}</td>
                            <td className={`px-4 py-3 text-right font-bold ${stockColor}`}>
                              {p.stock}
                              {p.stock < 10 && p.stock > 0 && <span className="ml-1 text-[10px]">⚠</span>}
                            </td>
                            <td className="px-4 py-3" />
                          </tr>

                          {/* Expanded variant rows */}
                          {isExpanded && (
                            isLoadingVariants ? (
                              <tr key={`${p.id}-loading`} className="border-b border-border bg-[#FAFAFA]">
                                <td colSpan={5} className="px-10 py-3 text-[12px] text-muted">Loading variants…</td>
                              </tr>
                            ) : variants.length === 0 ? (
                              <tr key={`${p.id}-novariants`} className="border-b border-border bg-[#FAFAFA]">
                                <td colSpan={5} className="px-10 py-3 text-[12px] text-muted italic">No variants — stock managed at product level.</td>
                              </tr>
                            ) : (
                              variants.map(v => {
                                const isAdjusting = invAdjust?.variantId === v.id
                                const vStockColor = v.availableStock === 0 ? 'text-error' : v.availableStock < 5 ? 'text-warning' : 'text-success'
                                return (
                                  <>
                                    <tr key={v.id} className="border-b border-border bg-[#FAFAFA] hover:bg-[#F5F5F7] transition-colors">
                                      <td className="px-10 py-2.5" colSpan={2}>
                                        <p className="text-[12px] font-semibold text-ink">{v.label || '—'}</p>
                                        <p className="font-mono text-[10px] text-muted/70">{v.sku}</p>
                                      </td>
                                      <td className="px-4 py-2.5 text-right text-[11px] text-muted">
                                        {v.reservedQuantity > 0 && <span className="text-warning">{v.reservedQuantity} held</span>}
                                      </td>
                                      <td className={`px-4 py-2.5 text-right font-bold text-[12px] ${vStockColor}`}>
                                        {v.availableStock}
                                        {v.availableStock < 5 && v.availableStock > 0 && <span className="ml-1 text-[10px]">⚠</span>}
                                        {v.availableStock === 0 && <span className="ml-1 text-[10px]">OUT</span>}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        <button
                                          onClick={e => { e.stopPropagation(); setInvAdjust(isAdjusting ? null : { variantId: v.id, productId: p.id, stock: String(v.stock), reason: '' }) }}
                                          className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors ${isAdjusting ? 'bg-ink text-white border-ink' : 'border-border text-muted hover:border-ink hover:text-ink'}`}
                                        >
                                          {isAdjusting ? 'Cancel' : 'Adjust'}
                                        </button>
                                      </td>
                                    </tr>

                                    {/* Inline adjust form */}
                                    {isAdjusting && (
                                      <tr key={`${v.id}-adjust`} className="border-b border-border bg-[#F0F4FF]">
                                        <td colSpan={5} className="px-10 py-3">
                                          <div className="flex items-center gap-3">
                                            <div>
                                              <label className="block text-[10px] text-muted mb-1">New stock</label>
                                              <input
                                                type="number" min={0}
                                                value={invAdjust!.stock}
                                                onChange={e => setInvAdjust(a => a && ({ ...a, stock: e.target.value }))}
                                                className="w-24 h-[34px] bg-white border border-border rounded-[8px] px-2 text-[13px] outline-none focus:border-primary"
                                              />
                                            </div>
                                            <div className="flex-1">
                                              <label className="block text-[10px] text-muted mb-1">Reason</label>
                                              <input
                                                value={invAdjust!.reason}
                                                onChange={e => setInvAdjust(a => a && ({ ...a, reason: e.target.value }))}
                                                placeholder="e.g. Counted physical stock"
                                                className="w-full h-[34px] bg-white border border-border rounded-[8px] px-2 text-[13px] outline-none focus:border-primary"
                                              />
                                            </div>
                                            <button
                                              disabled={invAdjusting || invAdjust!.stock === ''}
                                              onClick={e => { e.stopPropagation(); handleAdjust() }}
                                              className="mt-4 px-4 h-[34px] bg-primary text-white rounded-full text-[12px] font-semibold hover:bg-primary-dark disabled:opacity-40 transition-colors whitespace-nowrap"
                                            >
                                              {invAdjusting ? 'Saving…' : 'Apply'}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                )
                              })
                            )
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
