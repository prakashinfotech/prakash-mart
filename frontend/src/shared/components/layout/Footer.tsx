import { Link } from 'react-router-dom'

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Jaipur', 'Hyderabad']

export function Footer() {
  const SECTIONS = [
    {
      title: 'The House',
      links: ['About us', 'Press', 'Sustainability', 'Careers', 'Investor relations'],
    },
    {
      title: 'Shopping',
      links: ['Track an order', 'Returns & exchanges', 'Shipping policy', 'Gift cards', 'Size guide'],
    },
    {
      title: 'Makers',
      links: [
        { label: 'Sell on PrakashMart', to: '/seller' },
        { label: 'Seller Center', to: '/seller' },
        { label: 'Admin Console', to: '/admin' },
        { label: 'Brand directory', to: '/products' },
      ],
    },
    {
      title: 'Help',
      links: ['Payments', 'Cancellation & Returns', 'Report infringement', 'FAQ', 'Grievance officer'],
    },
  ]

  return (
    <footer className="bg-[#FAFAFA] border-t border-[#F0F0F1] mt-auto">
      {/* Main grid */}
      <div className="max-w-[var(--container)] mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand column */}
        <div className="lg:col-span-1">
          <div className="flex items-baseline gap-0.5 text-ink font-bold text-[20px] mb-3">
            <span className="text-primary">P</span>rakashMart
            <span className="text-primary text-xl leading-none">.</span>
          </div>
          <p className="text-[12px] leading-relaxed text-muted mt-2">
            An original commerce house.<br />
            Hand-picked goods from India and the world.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {CITIES.map(c => (
              <span
                key={c}
                className="text-[10px] px-2.5 py-1 rounded-pill bg-surface-2 border border-border text-muted"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Link sections */}
        {SECTIONS.map(section => (
          <div key={section.title}>
            <h3 className="text-[11px] uppercase tracking-widest font-semibold text-muted mb-4">
              {section.title}
            </h3>
            <ul className="space-y-2.5">
              {section.links.map((link, i) =>
                typeof link === 'string' ? (
                  <li key={i}>
                    <span className="text-[13px] text-ink-2 hover:text-ink cursor-pointer transition-colors">
                      {link}
                    </span>
                  </li>
                ) : (
                  <li key={i}>
                    <Link
                      to={link.to}
                      className="text-[13px] text-ink-2 hover:text-ink transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-[var(--container)] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted">
          <span>© {new Date().getFullYear()} PrakashMart Commerce Pvt. Ltd · Built with React + .NET</span>
          <span>Terms · Privacy · IP policy</span>
        </div>
      </div>
    </footer>
  )
}
