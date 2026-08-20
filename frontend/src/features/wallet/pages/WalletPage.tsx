import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, ArrowDownCircle, ArrowUpCircle, ShoppingBag } from 'lucide-react'
import { walletApi, type WalletDto } from '@/features/wallet/api/walletApi'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import { ROUTES } from '@/app/router'

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Credit' | 'Debit'>('All')

  useEffect(() => {
    walletApi.get()
      .then(setWallet)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const transactions = (wallet?.transactions ?? []).filter(
    (t) => filter === 'All' || t.type === filter
  )

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        PrakashMart wallet
      </p>
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-6">
        Your <em className="italic text-primary">wallet</em>.
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Balance column */}
        <div className="lg:col-span-1 space-y-4">

          {/* Balance card */}
          <div className="bg-primary rounded-[20px] p-6 text-white">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/90">PrakashMart Wallet</p>
                <p className="text-[11px] text-white/60">Instant payments & refunds</p>
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/60 mb-1">Available Balance</p>
            <p className="text-[40px] font-bold leading-none tnum">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* How it works */}
          <div className="bg-white border border-border rounded-[16px] p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted mb-3">How it works</p>
            <ul className="space-y-2.5 text-[13px] text-ink">
              {[
                '₹50 welcome bonus on sign-up',
                'Refunds for cancelled non-COD orders',
                'Use wallet balance at checkout',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 font-bold text-[15px] leading-none">✦</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-[16px] overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-bold text-ink">Transaction History</h2>
              <div className="flex gap-1.5">
                {(['All', 'Credit', 'Debit'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[12px] font-semibold px-3 py-1 rounded-full border transition-colors ${
                      filter === f
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Wallet size={24} className="text-primary" />
                </div>
                <p className="text-[14px] font-semibold text-ink mb-1">No transactions yet</p>
                <p className="text-[13px] text-muted">Your wallet activity will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F5F7] transition-colors">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      t.type === 'Credit' ? 'bg-success/10' : 'bg-error/10'
                    }`}>
                      {t.type === 'Credit'
                        ? <ArrowDownCircle size={18} className="text-success" />
                        : <ArrowUpCircle size={18} className="text-error" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ink font-medium truncate">{t.description}</p>
                      <p className="text-[11px] text-muted">
                        {new Date(t.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {t.orderId && (
                      <Link
                        to={ROUTES.ORDER_DETAIL.replace(':id', t.orderId!)}
                        className="shrink-0 p-1.5 text-muted hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        title="View Order"
                      >
                        <ShoppingBag size={14} />
                      </Link>
                    )}
                    <p className={`text-[14px] font-bold shrink-0 tnum ${
                      t.type === 'Credit' ? 'text-success' : 'text-error'
                    }`}>
                      {t.type === 'Credit' ? '+' : '−'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
