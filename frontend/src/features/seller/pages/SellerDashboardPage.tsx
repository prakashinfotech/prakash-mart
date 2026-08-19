import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, X, Check, Layers, Package, IndianRupee, Tag, ImageIcon, Truck, Gift, Copy, Zap } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { sellerApi, type CreateProductPayload, type SellerOrderDto, type SellerReturnDto } from '@/features/seller/api/sellerApi'
import { categoryApi, type CategoryDto } from '@/features/category/api/categoryApi'
import { brandApi, type BrandDto } from '@/features/brand/api/brandApi'
import { variantApi, variantTypeApi, inventoryApi, type ProductVariantDto, type CategoryVariantTypeDto, type InventoryTransactionDto } from '@/features/product/api/variantApi'
import { forecastApi, type ForecastSummaryDto } from '@/features/product/api/forecastApi'
import { SellerAnalytics } from '@/features/seller/components/SellerAnalytics'
import type { Product } from '@/features/product/types/product.types'
import { ProductImage } from '@/shared/components/ui/ProductImage'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { ROUTES } from '@/app/router'

type Tab = 'products' | 'analytics' | 'orders' | 'returns' | 'inventory' | 'forecast'

const EMPTY_VARIANT_FORM = { predefined: {} as Record<string, string>, custom: [] as { key: string; value: string }[], stock: 0, priceOverride: null as number | null }

const EMPTY_FORM: CreateProductPayload = {
  name: '', description: '', price: 0, discountPercent: null,
  categoryId: '', brandId: '', imageUrl: '', stock: 0,
  imageUrls: [], warranty: null, countryOfOrigin: null,
  dispatchInfo: null, shipsFrom: null, offers: [],
}

const INPUT_CLS = 'w-full h-[40px] bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all'
const LABEL_CLS = 'block text-[12px] font-semibold text-muted mb-1.5'

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Pending:    { bg: '#FFF4E0', text: '#D97706' },
  Processing: { bg: '#E6F1FE', text: '#006FEE' },
  Shipped:    { bg: '#EEF2FF', text: '#4F46E5' },
  InTransit:  { bg: '#F5F3FF', text: '#7828C8' },
  Delivered:  { bg: '#E6F8EF', text: '#17C964' },
  Cancelled:  { bg: '#FEE2E2', text: '#EF4444' },
}

export default function SellerDashboardPage() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [allBrands, setAllBrands] = useState<BrandDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateProductPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariantDto[]>([])
  const [categoryVariantTypes, setCategoryVariantTypes] = useState<CategoryVariantTypeDto[]>([])
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT_FORM)
  const [savingVariant, setSavingVariant] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [inlineStock, setInlineStock] = useState<{ variantId: string; value: string } | null>(null)
  const [bulkStock, setBulkStock] = useState(10)
  const [generatingBulk, setGeneratingBulk] = useState(false)
  const [sellerOrders, setSellerOrders] = useState<SellerOrderDto[]>([])
  const [returns, setReturns] = useState<SellerReturnDto[]>([])
  const [returnsLoaded, setReturnsLoaded] = useState(false)
  const [ordersLoaded, setOrdersLoaded] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [inventoryHistory, setInventoryHistory] = useState<InventoryTransactionDto[]>([])
  const [inventoryLoaded, setInventoryLoaded] = useState(false)
  const [forecast, setForecast] = useState<ForecastSummaryDto | null>(null)
  const [forecastLoaded, setForecastLoaded] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'Seller' && user?.role !== 'Admin')) {
      navigate(ROUTES.HOME)
      return
    }
    Promise.all([
      sellerApi.getMyProducts(),
      categoryApi.getAll(),
      brandApi.getAll(),
    ]).then(([prods, cats, brands]) => {
      setProducts(prods.filter((p) => p.sellerName === user?.name || user?.role === 'Admin'))
      setCategories(cats)
      setAllBrands(brands)
    }).catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [])

  const loadProducts = () => {
    sellerApi.getMyProducts()
      .then((all) => setProducts(all.filter((p) => p.sellerName === user?.name || user?.role === 'Admin')))
      .catch(() => setError('Failed to load products.'))
  }

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setError('') }

  const openEdit = (p: Product) => {
    const cat = categories.find((c) => c.name === p.category)
    setForm({
      name: p.name, description: p.description, price: p.price,
      discountPercent: p.discountPercent, categoryId: cat?.id ?? '',
      brandId: p.brandId, imageUrl: p.imageUrl, stock: p.stock,
      imageUrls: p.imageUrls ?? [], warranty: p.warranty ?? null,
      countryOfOrigin: p.countryOfOrigin ?? null, dispatchInfo: p.dispatchInfo ?? null,
      shipsFrom: p.shipsFrom ?? null, offers: p.offers ?? [],
    })
    setEditingId(p.id)
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!form.name || !form.description || !form.categoryId || !form.brandId || !form.imageUrl || form.price <= 0) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await sellerApi.update(editingId, form)
      } else {
        await sellerApi.create(form)
      }
      setShowForm(false)
      loadProducts()
    } catch {
      setError('Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await sellerApi.delete(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('Failed to delete product.')
    }
  }

  const openVariants = async (p: Product) => {
    setVariantProduct(p)
    setVariantForm(EMPTY_VARIANT_FORM)
    setCategoryVariantTypes([])
    const [v, cat] = await Promise.all([
      variantApi.getByProduct(p.id).catch(() => []),
      categories.find(c => c.name === p.category)?.id
        ? variantTypeApi.getByCategory(categories.find(c => c.name === p.category)!.id).catch(() => [])
        : Promise.resolve([]),
    ])
    setVariants(v)
    setCategoryVariantTypes(cat as CategoryVariantTypeDto[])
  }

  const cloneVariant = (v: ProductVariantDto) => {
    const predefinedKeys = new Set(categoryVariantTypes.map(cvt => cvt.name))
    const predefined: Record<string, string> = {}
    const custom: { key: string; value: string }[] = []
    for (const [key, value] of Object.entries(v.attributes)) {
      if (predefinedKeys.has(key)) predefined[key] = value
      else custom.push({ key, value })
    }
    setVariantForm({ predefined, custom, stock: 0, priceOverride: v.priceOverride })
    setEditingVariantId(null)
  }

  const handleGenerateBulk = async () => {
    if (!variantProduct) return
    const dims = categoryVariantTypes
      .filter(vt => vt.suggestedOptions.length > 0)
      .map(vt => ({ name: vt.name, options: vt.suggestedOptions }))
    if (dims.length === 0) { alert('No dimensions with suggested options configured for this category.'); return }

    // Cartesian product of all dimension options
    const combos: Record<string, string>[] = dims.reduce<Record<string, string>[]>((acc, dim) => {
      if (acc.length === 0) return dim.options.map(opt => ({ [dim.name]: opt }))
      return acc.flatMap(existing => dim.options.map(opt => ({ ...existing, [dim.name]: opt })))
    }, [])

    const existingAttrs = new Set(variants.map(v => JSON.stringify(v.attributes)))
    const toCreate = combos.filter(c => !existingAttrs.has(JSON.stringify(c)))
    if (toCreate.length === 0) { alert('All combinations already exist.'); return }

    setGeneratingBulk(true)
    try {
      const created = await Promise.all(
        toCreate.map(attrs => variantApi.create(variantProduct.id, { attributes: attrs, stock: bulkStock, priceOverride: null }))
      )
      setVariants(prev => [...prev, ...created])
    } catch { alert('Some variants failed to create.') }
    finally { setGeneratingBulk(false) }
  }

  const saveInlineStock = async (variantId: string, value: string) => {
    if (!variantProduct) return
    const stock = parseInt(value, 10)
    if (isNaN(stock) || stock < 0) { setInlineStock(null); return }
    const v = variants.find(x => x.id === variantId)
    if (!v || v.stock === stock) { setInlineStock(null); return }
    try {
      const updated = await variantApi.update(variantProduct.id, variantId, { attributes: v.attributes, stock, priceOverride: v.priceOverride })
      setVariants(prev => prev.map(x => x.id === variantId ? updated : x))
    } catch { alert('Failed to update stock.') }
    finally { setInlineStock(null) }
  }

  const openEditVariant = (v: ProductVariantDto) => {
    const predefinedKeys = new Set(categoryVariantTypes.map(cvt => cvt.name))
    const predefined: Record<string, string> = {}
    const custom: { key: string; value: string }[] = []
    for (const [key, value] of Object.entries(v.attributes)) {
      if (predefinedKeys.has(key)) predefined[key] = value
      else custom.push({ key, value })
    }
    setVariantForm({ predefined, custom, stock: v.stock, priceOverride: v.priceOverride })
    setEditingVariantId(v.id)
  }

  const handleAddVariant = async () => {
    if (!variantProduct) return
    const customAttrs = Object.fromEntries(variantForm.custom.filter(c => c.key && c.value).map(c => [c.key, c.value]))
    const attributes = { ...variantForm.predefined, ...customAttrs }
    if (Object.keys(attributes).length === 0) { alert('Enter at least one attribute.'); return }
    setSavingVariant(true)
    try {
      if (editingVariantId) {
        const updated = await variantApi.update(variantProduct.id, editingVariantId, { attributes, stock: variantForm.stock, priceOverride: variantForm.priceOverride })
        setVariants((prev) => prev.map((v) => v.id === editingVariantId ? updated : v))
        setEditingVariantId(null)
      } else {
        const created = await variantApi.create(variantProduct.id, { attributes, stock: variantForm.stock, priceOverride: variantForm.priceOverride })
        setVariants((prev) => [...prev, created])
      }
      setVariantForm(EMPTY_VARIANT_FORM)
    } catch { alert('Failed to save variant.') }
    finally { setSavingVariant(false) }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!variantProduct) return
    try {
      await variantApi.delete(variantProduct.id, variantId)
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
    } catch { alert('Failed to delete variant.') }
  }

  const handleToggleVariant = async (variantId: string) => {
    if (!variantProduct) return
    try {
      await variantApi.toggle(variantProduct.id, variantId)
      setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, isActive: !v.isActive } : v))
    } catch { alert('Failed to toggle variant.') }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Seller panel
          </p>
          <h1 className="text-[28px] font-bold text-ink tracking-tight">
            Seller <em className="italic text-primary">dashboard</em>.
          </h1>
        </div>
        {tab === 'products' && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-colors"
          >
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {([['products', 'Products'], ['analytics', 'Analytics'], ['orders', 'Orders'], ['returns', 'Returns'], ['inventory', 'Inventory Log'], ['forecast', 'Forecasting']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key)
              if (key === 'orders' && !ordersLoaded) {
                sellerApi.getSellerOrders().then(setSellerOrders).then(() => setOrdersLoaded(true)).catch(() => {})
              }
              if (key === 'returns' && !returnsLoaded) {
                sellerApi.getReturns().then(setReturns).then(() => setReturnsLoaded(true)).catch(() => {})
              }
              if (key === 'inventory' && !inventoryLoaded) {
                inventoryApi.getSellerHistory().then(setInventoryHistory).then(() => setInventoryLoaded(true)).catch(() => {})
              }
              if (key === 'forecast' && !forecastLoaded) {
                forecastApi.getSeller().then(setForecast).then(() => setForecastLoaded(true)).catch(() => {})
              }
            }}
            className={`px-4 py-2 text-[13px] font-semibold whitespace-nowrap rounded-full border transition-colors ${
              tab === key
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted hover:border-ink hover:text-ink bg-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && <SellerAnalytics />}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {sellerOrders.length === 0
            ? (
              <div className="bg-white border border-border rounded-[16px] p-16 text-center">
                <p className="text-[14px] text-muted">No orders yet.</p>
              </div>
            )
            : sellerOrders.map((o) => {
              const style = STATUS_STYLES[o.status] ?? { bg: '#F4F4F5', text: '#71717A' }
              return (
                <div key={o.orderId} className="bg-white border border-border rounded-[16px] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-muted">#{o.orderId.slice(0, 8).toUpperCase()}</span>
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted mb-3">
                    {new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="space-y-1.5">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between text-[13px]">
                        <span className="text-ink">
                          {i.productName}
                          {i.variantLabel && <span className="text-muted ml-1">({i.variantLabel})</span>}
                          {' '}× {i.quantity}
                        </span>
                        <span className="font-semibold tnum">₹{i.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border mt-3 pt-3 flex justify-between text-[13px] font-semibold">
                    <span className="text-muted">Your Revenue</span>
                    <span className="text-success tnum">₹{o.sellerRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )
            })
          }
        </div>
      )}

      {/* Returns tab */}
      {tab === 'returns' && (
        <div className="space-y-3">
          {returns.length === 0
            ? (
              <div className="bg-white border border-border rounded-[16px] p-16 text-center">
                <p className="text-[14px] text-muted">No return requests.</p>
              </div>
            )
            : returns.map((r) => {
              const statusStyle =
                r.status === 'Approved' ? 'bg-success/10 text-success' :
                r.status === 'Rejected' ? 'bg-error/10 text-error' :
                'bg-warning/10 text-warning'
              return (
                <div key={r.id} className="bg-white border border-border rounded-[16px] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-muted">Order #{r.orderId.slice(0, 8).toUpperCase()}</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${statusStyle}`}>{r.status}</span>
                  </div>
                  <p className="text-[13px] text-ink mb-1"><span className="font-semibold">Reason:</span> {r.reason}</p>
                  <p className="text-[12px] text-muted mb-3">
                    {new Date(r.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  {r.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => sellerApi.processReturn(r.id, true).then((updated) => setReturns((prev) => prev.map((x) => x.id === r.id ? updated : x)))}
                        className="text-[12px] font-semibold px-4 py-1.5 bg-success text-white rounded-full hover:opacity-90 transition-opacity"
                      >
                        Approve & Refund
                      </button>
                      <button
                        onClick={() => sellerApi.processReturn(r.id, false).then((updated) => setReturns((prev) => prev.map((x) => x.id === r.id ? updated : x)))}
                        className="text-[12px] font-semibold px-4 py-1.5 border-2 border-error/30 text-error rounded-full hover:bg-error/5 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          }
        </div>
      )}

      {/* Inventory Log tab */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          {inventoryHistory.length === 0
            ? (
              <div className="bg-white border border-border rounded-[16px] p-16 text-center">
                <p className="text-[14px] text-muted">No inventory changes recorded yet.</p>
              </div>
            )
            : (
              <div className="bg-white border border-border rounded-[16px] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-[#F9FAFB]">
                      <th className="text-left px-4 py-3 font-semibold text-muted text-[11px] uppercase">Product</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted text-[11px] uppercase">Type</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted text-[11px] uppercase">Before</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted text-[11px] uppercase">After</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted text-[11px] uppercase">Change</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted text-[11px] uppercase">Reason</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted text-[11px] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryHistory.map((t) => {
                      const isPositive = t.quantityChanged > 0
                      return (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-semibold text-ink leading-tight">{t.productName}</p>
                            {t.variantLabel && <p className="text-[11px] text-muted mt-0.5">{t.variantLabel}</p>}
                            <p className="font-mono text-[10px] text-muted/60 mt-0.5">{t.sku}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              t.changeType === 'Purchase' ? 'bg-blue-50 text-blue-600' :
                              t.changeType === 'Cancellation' || t.changeType === 'Return' ? 'bg-green-50 text-green-600' :
                              t.changeType === 'AdminAdjustment' ? 'bg-purple-50 text-purple-600' :
                              t.changeType === 'SellerUpdate' ? 'bg-orange-50 text-orange-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{t.changeType}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-muted">{t.quantityBefore}</td>
                          <td className="px-4 py-3 text-right font-semibold">{t.quantityAfter}</td>
                          <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-success' : 'text-error'}`}>
                            {isPositive ? '+' : ''}{t.quantityChanged}
                          </td>
                          <td className="px-4 py-3 text-muted max-w-[200px] truncate">{t.reason}</td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* Forecasting tab */}
      {tab === 'forecast' && (() => {
        const STATUS_CFG = {
          OutOfStock: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Out of Stock' },
          Critical:   { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Critical'     },
          Low:        { bg: 'bg-yellow-50',  text: 'text-yellow-700', label: 'Low'          },
          Healthy:    { bg: 'bg-green-50',   text: 'text-green-700',  label: 'Healthy'      },
          NoSales:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'No Sales'     },
        } as const

        if (!forecast) return (
          <div className="bg-white border border-border rounded-[16px] p-16 text-center">
            <p className="text-[14px] text-muted">Loading forecast…</p>
          </div>
        )

        return (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Out of Stock', value: forecast.outOfStockCount, color: '#EF4444' },
                { label: 'Critical (<7d)',  value: forecast.criticalCount,   color: '#DC2626' },
                { label: 'Low (7-14d)',     value: forecast.lowCount,        color: '#D97706' },
                { label: 'Healthy (>14d)', value: forecast.healthyCount,    color: '#17C964' },
                { label: 'No Sales',       value: forecast.noSalesCount,    color: '#6B7280' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-border rounded-[16px] p-4">
                  <p className="text-[24px] font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[12px] text-muted mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Forecast table */}
            {forecast.items.length === 0 ? (
              <div className="bg-white border border-border rounded-[16px] p-16 text-center">
                <p className="text-[14px] text-muted">No active variants to forecast.</p>
              </div>
            ) : (
              <div className="bg-white border border-border rounded-[16px] overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-[#F9FAFB]">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Product / Variant</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">In Stock</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">7d Vel.</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">30d Vel.</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted uppercase">Days Left</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.items.map((item) => {
                      const cfg = STATUS_CFG[item.status]
                      return (
                        <tr key={item.variantId} className="border-b border-border last:border-0 hover:bg-[#F9FAFB]">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-ink">{item.productName}</p>
                            {item.variantLabel && <p className="text-[11px] text-muted mt-0.5">{item.variantLabel}</p>}
                            <p className="font-mono text-[10px] text-muted/60">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={item.availableStock === 0 ? 'text-error font-bold' : 'text-ink font-semibold'}>
                              {item.availableStock}
                            </span>
                            {item.reservedQuantity > 0 && (
                              <span className="text-[11px] text-muted ml-1">({item.reservedQuantity} rsv)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-muted">{item.velocity7d}/day</td>
                          <td className="px-4 py-3 text-right text-muted">{item.velocity30d}/day</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {item.daysRemaining < 0 ? '∞' : item.daysRemaining === 0 ? '—' : `${item.daysRemaining}d`}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

      {tab === 'products' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Products', value: products.length, color: '#11181C' },
              { label: 'In Stock', value: products.filter((p) => p.stock > 0).length, color: '#17C964' },
              { label: 'Low Stock (<10)', value: products.filter((p) => p.stock > 0 && p.stock < 10).length, color: '#D97706' },
              { label: 'Out of Stock', value: products.filter((p) => p.stock === 0).length, color: '#EF4444' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-border rounded-[16px] p-4">
                <p className="text-[24px] font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[12px] text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Product Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
              <div className="bg-white rounded-[24px] w-full max-w-4xl max-h-[94vh] flex flex-col shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22)]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F1] shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[10px] bg-primary-50 flex items-center justify-center">
                      <Package size={16} className="text-primary" />
                    </span>
                    <div>
                      <h2 className="text-[15px] font-bold text-ink leading-tight">
                        {editingId ? 'Edit Product' : 'Add New Product'}
                      </h2>
                      <p className="text-[11px] text-muted">{editingId ? 'Update product details' : 'Fill in the details below'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-[#F5F5F7] transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Body — 2-column layout so content fits without scrollbar */}
                <div className="overflow-y-auto flex-1 px-6 py-5">

                  {error && (
                    <div className="mb-4 bg-error/8 border border-error/25 text-error text-[13px] rounded-[12px] px-4 py-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />{error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-6">

                    {/* ── LEFT COLUMN: Basic Info + Images ─────── */}
                    <div className="space-y-5">

                      {/* Basic Info */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Package size={13} className="text-primary" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Basic Info</span>
                          <div className="flex-1 h-px bg-[#F0F0F1]" />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className={LABEL_CLS}>Product Name <span className="text-error">*</span></label>
                            <input
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                              placeholder="e.g. boAt Rockerz 450 Bluetooth Headphones"
                              className={INPUT_CLS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Description <span className="text-error">*</span></label>
                            <textarea
                              rows={5}
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              placeholder="Describe your product — key features, specifications, materials..."
                              className="w-full bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all resize-none"
                            />
                            <p className="text-[11px] text-muted mt-1">{form.description.length} / 2000 characters</p>
                          </div>
                        </div>
                      </div>

                      {/* Images */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <ImageIcon size={13} className="text-[#7828C8]" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Images</span>
                          <div className="flex-1 h-px bg-[#F0F0F1]" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className={LABEL_CLS}>Primary Image URL <span className="text-error">*</span></label>
                              <input
                                value={form.imageUrl}
                                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                placeholder="https://images.unsplash.com/..."
                                className={INPUT_CLS}
                              />
                              <p className="text-[11px] text-muted mt-1">Main image shown in product listings.</p>
                            </div>
                            {form.imageUrl && (
                              <div className="w-[56px] h-[56px] rounded-[10px] border border-[#E4E4E7] bg-[#F5F5F7] overflow-hidden shrink-0 mt-5">
                                <img src={form.imageUrl} alt="" className="w-full h-full object-contain p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Additional Image URLs <span className="text-[11px] font-normal text-muted">(one per line, optional)</span></label>
                            <textarea
                              rows={3}
                              value={(form.imageUrls ?? []).join('\n')}
                              onChange={(e) => setForm({ ...form, imageUrls: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                              placeholder={"https://... (angle 2)\nhttps://... (angle 3)"}
                              className="w-full bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all resize-none font-mono text-[12px]"
                            />
                            {(form.imageUrls ?? []).length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {(form.imageUrls ?? []).map((url, i) => (
                                  <div key={i} className="w-10 h-10 rounded-[8px] border border-[#E4E4E7] bg-[#F5F5F7] overflow-hidden">
                                    <img src={url} alt="" className="w-full h-full object-contain p-0.5" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* ── RIGHT COLUMN: Pricing + Classification + Logistics + Offers ── */}
                    <div className="space-y-5">

                      {/* Pricing & Stock */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <IndianRupee size={13} className="text-success" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Pricing &amp; Stock</span>
                          <div className="flex-1 h-px bg-[#F0F0F1]" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={LABEL_CLS}>Price (₹) <span className="text-error">*</span></label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted font-mono">₹</span>
                              <input
                                type="number" min={0}
                                value={form.price || ''}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                                placeholder="0"
                                className={`${INPUT_CLS} pl-6`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Discount %</label>
                            <div className="relative">
                              <input
                                type="number" min={0} max={100}
                                value={form.discountPercent ?? ''}
                                onChange={(e) => setForm({ ...form, discountPercent: e.target.value ? Number(e.target.value) : null })}
                                placeholder="0"
                                className={`${INPUT_CLS} pr-6`}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">%</span>
                            </div>
                            {form.price > 0 && form.discountPercent ? (
                              <p className="text-[11px] text-success mt-1 font-medium">
                                MRP ₹{Math.round(form.price / (1 - form.discountPercent / 100)).toLocaleString('en-IN')}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Stock <span className="text-error">*</span></label>
                            <input
                              type="number" min={0}
                              value={form.stock || ''}
                              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                              placeholder="0"
                              className={INPUT_CLS}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Classification */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Tag size={13} className="text-accent" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Classification</span>
                          <div className="flex-1 h-px bg-[#F0F0F1]" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL_CLS}>Category <span className="text-error">*</span></label>
                            <select
                              value={form.categoryId}
                              onChange={(e) => setForm({ ...form, categoryId: e.target.value, brandId: '' })}
                              className="w-full h-[40px] bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 text-[13px] text-ink outline-none focus:bg-white focus:border-primary transition-all"
                            >
                              <option value="">Select category</option>
                              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Brand <span className="text-error">*</span></label>
                            <select
                              value={form.brandId}
                              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                              disabled={!form.categoryId}
                              className="w-full h-[40px] bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 text-[13px] text-ink outline-none focus:bg-white focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <option value="">{form.categoryId ? 'Select brand' : 'Select category first'}</option>
                              {allBrands.filter((b) => b.categoryId === form.categoryId).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Logistics & Details */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Truck size={13} className="text-[#0EA5E9]" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Logistics &amp; Details</span>
                          <div className="flex-1 h-px bg-[#F0F0F1]" />
                          <span className="text-[10px] text-muted">Optional</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={LABEL_CLS}>Ships From</label>
                            <input value={form.shipsFrom ?? ''} onChange={(e) => setForm({ ...form, shipsFrom: e.target.value || null })} placeholder="e.g. Bengaluru" className={INPUT_CLS} />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Dispatch Info</label>
                            <input value={form.dispatchInfo ?? ''} onChange={(e) => setForm({ ...form, dispatchInfo: e.target.value || null })} placeholder="e.g. Same day dispatch" className={INPUT_CLS} />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Warranty</label>
                            <input value={form.warranty ?? ''} onChange={(e) => setForm({ ...form, warranty: e.target.value || null })} placeholder="e.g. 1 year manufacturer warranty" className={INPUT_CLS} />
                          </div>
                          <div>
                            <label className={LABEL_CLS}>Country of Origin</label>
                            <input value={form.countryOfOrigin ?? ''} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value || null })} placeholder="e.g. India" className={INPUT_CLS} />
                          </div>
                        </div>
                      </div>

                      {/* Offers */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Gift size={13} className="text-error" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Offers</span>
                          <div className="flex-1 h-px bg-[#F0F0F1]" />
                          <span className="text-[10px] text-muted">Optional</span>
                        </div>
                        <textarea
                          rows={3}
                          value={(form.offers ?? []).join('\n')}
                          onChange={(e) => setForm({ ...form, offers: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                          placeholder={"No Cost EMI from ₹500/month\nExchange up to ₹5,000 off"}
                          className="w-full bg-[#F5F5F7] border border-transparent rounded-[10px] px-3 py-2.5 text-[13px] text-ink placeholder:text-muted outline-none focus:bg-white focus:border-primary transition-all resize-none"
                        />
                        <p className="text-[11px] text-muted mt-1">Each line is a separate offer on the product page.</p>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F0F0F1] bg-[#FAFAFA] rounded-b-[24px] shrink-0">
                  <p className="text-[11px] text-muted"><span className="text-error">*</span> Required fields</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 border border-border text-ink text-[13px] font-semibold rounded-[10px] hover:bg-[#F5F5F7] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-[10px] text-[13px] font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors shadow-sm"
                    >
                      <Check size={14} /> {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Product Table */}
          {products.length === 0 ? (
            <div className="bg-white border border-border rounded-[16px] p-16 text-center">
              <p className="text-muted text-[14px]">No products yet.</p>
              <button onClick={openNew} className="mt-3 text-primary text-[13px] font-semibold hover:underline">
                Add your first product →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products by name…"
                className="w-full h-[40px] bg-white border border-border rounded-[12px] px-4 text-[13px] outline-none focus:border-primary transition-all"
              />
            <div className="bg-white border border-border rounded-[16px] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F5F5F7] border-b border-border">
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Actions'].map((h, i) => (
                      <th key={h} className={`p-3 font-semibold text-muted ${i >= 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map((p) => (
                    <tr
                      key={p.id}
                      className={
                        p.stock > 0 && p.stock < 10 ? 'bg-warning/5 hover:bg-warning/10' :
                        p.stock === 0 ? 'bg-error/5 hover:bg-error/10' :
                        'hover:bg-[#F5F5F7]'
                      }
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <ProductImage src={p.imageUrl} alt={p.name} className="w-10 h-10 object-contain bg-[#F5F5F7] rounded-[8px]" />
                          <div>
                            <p className="font-semibold text-ink line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-muted">{p.brandName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted">{p.category}</td>
                      <td className="p-3 text-right font-semibold text-ink tnum">
                        ₹{p.price.toLocaleString('en-IN')}
                        {p.discountPercent && (
                          <span className="ml-1 text-[11px] text-success">{Math.round(p.discountPercent)}% off</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className={p.stock === 0 ? 'text-error font-semibold' : p.stock < 10 ? 'text-warning font-semibold' : 'text-success'}>
                          {p.stock === 0 ? 'Out of stock' : p.stock < 10 ? `${p.stock} ⚠` : p.stock}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openVariants(p)} title="Manage Variants"
                            className="p-1.5 text-muted hover:text-[#7828C8] hover:bg-[#F1ECFF] rounded-lg transition-colors">
                            <Layers size={14} />
                          </button>
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors">
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

          {/* Variant Management Modal */}
          {variantProduct && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded-[20px] w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="text-[15px] font-bold text-ink">Variants — {variantProduct.name}</h2>
                  <button onClick={() => { setVariantProduct(null); setEditingVariantId(null); setInlineStock(null) }} className="text-muted hover:text-ink p-1 rounded-lg hover:bg-[#F5F5F7] transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {editingVariantId && (
                    <div className="flex items-center justify-between bg-primary-50 border border-primary-tint rounded-[10px] px-3 py-2">
                      <span className="text-[12px] font-semibold text-primary">Editing variant</span>
                      <button
                        onClick={() => { setEditingVariantId(null); setVariantForm(EMPTY_VARIANT_FORM) }}
                        className="text-[12px] text-muted hover:text-ink font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {/* Predefined attributes from category config */}
                  {categoryVariantTypes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {categoryVariantTypes.map(vt => (
                        <div key={vt.variantTypeId}>
                          <label className={LABEL_CLS}>{vt.name}</label>
                          {vt.displayType === 'select' && vt.suggestedOptions.length > 0 ? (
                            <select
                              className={INPUT_CLS}
                              value={variantForm.predefined[vt.name] ?? ''}
                              onChange={e => setVariantForm(f => ({ ...f, predefined: { ...f.predefined, [vt.name]: e.target.value } }))}
                            >
                              <option value="">Select {vt.name}</option>
                              {vt.suggestedOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              className={INPUT_CLS}
                              placeholder={vt.name}
                              value={variantForm.predefined[vt.name] ?? ''}
                              onChange={e => setVariantForm(f => ({ ...f, predefined: { ...f.predefined, [vt.name]: e.target.value } }))}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-muted bg-surface rounded-[10px] px-3 py-2">
                      No variant types configured for this category. Use custom attributes below.
                    </p>
                  )}

                  {/* Custom attributes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-muted">Custom Attributes</p>
                      <button
                        onClick={() => setVariantForm(f => ({ ...f, custom: [...f.custom, { key: '', value: '' }] }))}
                        className="text-[12px] text-primary font-semibold hover:underline"
                      >
                        + Add Attribute
                      </button>
                    </div>
                    {variantForm.custom.map((attr, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          className={INPUT_CLS}
                          placeholder="Attribute (e.g. Material)"
                          value={attr.key}
                          onChange={e => setVariantForm(f => { const c = [...f.custom]; c[i] = { ...c[i], key: e.target.value }; return { ...f, custom: c } })}
                        />
                        <input
                          className={INPUT_CLS}
                          placeholder="Value (e.g. Cotton)"
                          value={attr.value}
                          onChange={e => setVariantForm(f => { const c = [...f.custom]; c[i] = { ...c[i], value: e.target.value }; return { ...f, custom: c } })}
                        />
                        <button
                          onClick={() => setVariantForm(f => ({ ...f, custom: f.custom.filter((_, j) => j !== i) }))}
                          className="text-muted hover:text-error p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Stock + Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Stock *</label>
                      <input
                        type="number" min={0}
                        value={variantForm.stock}
                        onChange={e => setVariantForm(f => ({ ...f, stock: Number(e.target.value) }))}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Price Override (₹, optional)</label>
                      <input
                        type="number" min={0}
                        value={variantForm.priceOverride ?? ''}
                        onChange={e => setVariantForm(f => ({ ...f, priceOverride: e.target.value ? Number(e.target.value) : null }))}
                        placeholder={`Default: ₹${variantProduct.price}`}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddVariant}
                      disabled={savingVariant}
                      className="flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                      {editingVariantId ? <Check size={14} /> : <Plus size={14} />}
                      {savingVariant ? (editingVariantId ? 'Updating…' : 'Adding…') : (editingVariantId ? 'Update Variant' : 'Add Variant')}
                    </button>
                  </div>

                  {/* Bulk generate combinations */}
                  {!editingVariantId && categoryVariantTypes.some(vt => vt.suggestedOptions.length > 0) && (
                    <div className="flex items-center gap-2 p-3 bg-[#F5F5F7] rounded-[10px] border border-border">
                      <Zap size={13} className="text-primary shrink-0" />
                      <span className="text-[12px] text-muted flex-1">Bulk generate all combinations</span>
                      <input
                        type="number" min={0}
                        value={bulkStock}
                        onChange={e => setBulkStock(Number(e.target.value))}
                        className="w-20 h-8 border border-border rounded-[8px] px-2 text-[13px] text-center bg-white outline-none focus:border-primary"
                        title="Stock per variant"
                      />
                      <button
                        onClick={handleGenerateBulk}
                        disabled={generatingBulk}
                        className="h-8 px-3 bg-white border border-border text-[12px] font-semibold text-ink rounded-[8px] hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {generatingBulk ? 'Generating…' : 'Generate'}
                      </button>
                    </div>
                  )}
                </div>

                {variants.length > 0 ? (
                  <div className="border-t border-border">
                    <table className="w-full text-[13px]">
                      <thead className="bg-[#F5F5F7]">
                        <tr>
                          {['Variant', 'SKU', 'Stock', 'Price', 'Actions'].map((h, i) => (
                            <th key={h} className={`p-3 font-semibold text-muted ${i >= 1 ? 'text-center' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {variants.map((v) => (
                          <tr key={v.id} className={!v.isActive ? 'opacity-50' : ''}>
                            <td className="p-3 font-semibold text-ink">{v.label || '—'}</td>
                            <td className="p-3 text-center font-mono text-[11px] text-muted tracking-wide">{v.sku}</td>
                            <td className="p-3 text-center">
                              {inlineStock?.variantId === v.id ? (
                                <input
                                  type="number" min={0}
                                  value={inlineStock.value}
                                  autoFocus
                                  onChange={e => setInlineStock({ variantId: v.id, value: e.target.value })}
                                  onBlur={() => saveInlineStock(v.id, inlineStock.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') saveInlineStock(v.id, inlineStock.value)
                                    if (e.key === 'Escape') setInlineStock(null)
                                  }}
                                  className="w-16 text-center border border-primary rounded-[6px] px-1 py-0.5 text-[12px] outline-none"
                                />
                              ) : (
                                <button
                                  onClick={() => setInlineStock({ variantId: v.id, value: String(v.stock) })}
                                  title={`Total: ${v.stock} · Reserved: ${v.reservedQuantity} · Available: ${v.availableStock}\nClick to edit total stock`}
                                  className={`font-semibold hover:underline decoration-dotted cursor-pointer ${
                                    v.availableStock === 0 ? 'text-error' : v.availableStock <= 5 ? 'text-warning' : 'text-success'
                                  }`}
                                >
                                  {v.availableStock}
                                  {v.reservedQuantity > 0 && (
                                    <span className="ml-1 text-[10px] text-muted font-normal">({v.reservedQuantity} held)</span>
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="p-3 text-center text-muted">
                              {v.priceOverride ? `₹${v.priceOverride.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditVariant(v)}
                                  className="p-1 text-muted hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Edit variant"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => cloneVariant(v)}
                                  className="p-1 text-muted hover:text-[#7828C8] hover:bg-[#F1ECFF] rounded-lg transition-colors"
                                  title="Clone variant"
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  onClick={() => handleToggleVariant(v.id)}
                                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                                    v.isActive ? 'border-warning/30 text-warning hover:bg-warning/5' : 'border-success/30 text-success hover:bg-success/5'
                                  }`}
                                >
                                  {v.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button onClick={() => handleDeleteVariant(v.id)}
                                  className="p-1 text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-5 text-[13px] text-muted text-center border-t border-border">No variants yet.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
