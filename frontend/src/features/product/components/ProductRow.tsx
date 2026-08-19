import { Link } from 'react-router-dom'
import { ProductCard } from './ProductCard'
import type { Product } from '@/features/product/types/product.types'
import { ROUTES } from '@/app/router'

interface ProductRowProps {
  title: string
  badge?: string
  badgeTone?: 'hot' | 'top' | 'new' | 'trending'
  products: Product[]
  viewAllCategory?: string
}

const BADGE_CLASSES: Record<string, string> = {
  hot:      'bg-warning/10 text-warning',
  top:      'bg-success/10 text-success',
  new:      'bg-primary-50 text-primary-dark',
  trending: 'bg-accent-tint text-accent-dark',
}

export function ProductRow({ title, badge, badgeTone = 'hot', products, viewAllCategory }: ProductRowProps) {
  if (products.length === 0) return null

  const viewAllHref = viewAllCategory
    ? `${ROUTES.PRODUCTS}?category=${encodeURIComponent(viewAllCategory)}`
    : ROUTES.PRODUCTS

  return (
    <section className="max-w-[var(--container)] mx-auto px-4">
      {/* Section header */}
      <div className="flex items-center justify-between pt-8 pb-[14px] mb-[14px]">
        <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em] flex items-center gap-2.5">
          {title}
          {badge && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-pill font-mono text-[10px] font-semibold tracking-[0.04em] uppercase before:content-['●'] before:text-[8px] ${BADGE_CLASSES[badgeTone] ?? BADGE_CLASSES.hot}`}>
              {badge}
            </span>
          )}
        </h2>
        <Link
          to={viewAllHref}
          className="text-[13px] font-medium px-[14px] py-2 rounded-pill border border-border bg-white text-ink hover:bg-ink hover:text-white hover:border-ink transition-all duration-150"
        >
          View all →
        </Link>
      </div>

      {/* Horizontal scroll row — negative margin trick keeps last card unclipped */}
      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {products.slice(0, 8).map(product => (
          <div key={product.id} className="min-w-[176px] max-w-[176px] flex-shrink-0">
            <div className="bg-white border border-border rounded-[10px] h-full overflow-hidden hover:shadow-2 hover:-translate-y-0.5 transition-all duration-150 group">
              <ProductCard product={product} compact />
            </div>
          </div>
        ))}
        {/* Trailing spacer so last card clears the right edge */}
        <div className="min-w-[1px] shrink-0" />
      </div>
    </section>
  )
}
