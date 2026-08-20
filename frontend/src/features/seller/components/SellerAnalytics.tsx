import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, ShoppingBag, Package } from 'lucide-react'
import { sellerAnalyticsApi, type SellerAnalyticsDto } from '@/features/seller/api/sellerAnalyticsApi'

export function SellerAnalytics() {
  const [data, setData] = useState<SellerAnalyticsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    sellerAnalyticsApi.get()
      .then(setData)
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="bg-white border border-[#e0e0e0] rounded p-8 text-center text-sm text-[#878787]">Loading analytics...</div>
  if (error) return <div className="bg-white border border-[#e0e0e0] rounded p-8 text-center text-sm text-error">{error}</div>
  if (!data) return null

  const hasOrders = data.totalOrders > 0

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Revenue', value: `₹${data.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag, color: 'text-blue-600' },
          { label: 'Units Sold', value: data.totalProductsSold, icon: Package, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#e0e0e0] rounded p-4 flex items-center gap-3">
            <div className={`${s.color} bg-opacity-10`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#878787]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {!hasOrders ? (
        <div className="bg-white border border-[#e0e0e0] rounded p-12 text-center">
          <TrendingUp size={40} className="mx-auto text-[#e0e0e0] mb-3" />
          <p className="text-[#878787] text-sm">No sales data yet. Your revenue chart will appear once orders come in.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Revenue Chart */}
          {data.monthlyRevenue.length > 0 && (
            <div className="bg-white border border-[#e0e0e0] rounded p-5">
              <h3 className="font-semibold text-[#212121] mb-4">Monthly Revenue (Last 6 Months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyRevenue} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#2874f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Products Table */}
          {data.topProducts.length > 0 && (
            <div className="bg-white border border-[#e0e0e0] rounded p-5">
              <h3 className="font-semibold text-[#212121] mb-4">Top Products by Revenue</h3>
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={p.productName} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#212121] line-clamp-1">{p.productName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex-1 bg-[#f0f0f0] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${(p.revenue / data.topProducts[0].revenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#878787] shrink-0">{p.unitsSold} sold</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-[#212121] shrink-0">₹{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
