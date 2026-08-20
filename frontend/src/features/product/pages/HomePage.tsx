import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productApi } from '@/features/product/api/productApi'
import { categoryApi, type CategoryDto } from '@/features/category/api/categoryApi'
import { brandApi, type BrandDto } from '@/features/brand/api/brandApi'
import { HeroBanner } from '@/features/product/components/HeroBanner'
import { ProductRow } from '@/features/product/components/ProductRow'
import { ProductCard } from '@/features/product/components/ProductCard'
import { SkeletonCard } from '@/shared/components/ui/Skeleton'
import {
  CategoryTiles,
  TrustStrip,
  PromoStrip,
  TopBrandsStrip,
} from '@/features/product/components/HomeComponents'
import type { Product } from '@/features/product/types/product.types'
import { ROUTES } from '@/app/router'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [brands, setBrands] = useState<BrandDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      productApi.getFiltered(),
      categoryApi.getAll(),
      brandApi.getAll(),
    ])
      .then(([prods, cats, brnds]) => {
        setProducts(prods)
        setCategories(cats)
        setBrands(brnds)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const deals = [...products]
    .filter(p => (p.discountPercent ?? 0) >= 30)
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))

  const bestSellers = [...products].sort((a, b) => b.reviewCount - a.reviewCount)

  const topRated = [...products].filter(p => p.rating >= 4).sort((a, b) => b.rating - a.rating)

  const newArrivals = [...products].slice(0, 12)

  const byCategory = (name: string) => products.filter(p => p.category === name)

  const MARQUEE_ITEMS = [
    'Free shipping on orders above ₹499',
    'Easy 30-day returns on every order',
    'No Cost EMI on 1,800+ products',
    'Verified sellers · Authentic products only',
    'Quick delivery · 24/7 customer support',
    'Up to 80% off on Electronics',
    'New season Fashion arrivals',
  ]

  return (
    <div className="pb-12 space-y-6">
      {/* ── Gradient offer marquee ────────────────────────────── */}
      <div
        className="h-9 flex items-center overflow-hidden marquee-wrap"
        style={{ background: 'linear-gradient(90deg, #006FEE 0%, #7828C8 100%)' }}
      >
        <div className="marquee-track font-mono text-[12px] font-medium tracking-[0.04em] text-white gap-12">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="before:content-['●'] before:opacity-60 before:mr-2 shrink-0">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero carousel ────────────────────────────────────── */}
      <section className="max-w-[var(--container)] mx-auto px-4">
        <HeroBanner />
      </section>

      {/* ── Shop by Category ─────────────────────────────────── */}
      <CategoryTiles categories={categories} />

      {loading ? (
        <section className="max-w-[var(--container)] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </section>
      ) : (
        <>
          {/* ── Deals of the Day ─────────────────────────────── */}
          <ProductRow title="Deals of the Day" badge="Hot" badgeTone="hot" products={deals} />

          {/* ── Trust strip ──────────────────────────────────── */}
          <TrustStrip />

          {/* ── Promo banners ────────────────────────────────── */}
          <PromoStrip />

          {/* ── Best Sellers ─────────────────────────────────── */}
          <ProductRow title="Best Sellers" badge="Top Rated" badgeTone="top" products={bestSellers} />

          {/* ── Top Brands ───────────────────────────────────── */}
          <TopBrandsStrip brands={brands} />

          {/* ── Category rows (existing sections) ────────────── */}
          {['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Beauty'].map(cat => (
            <ProductRow
              key={cat}
              title={`Top in ${cat}`}
              products={byCategory(cat)}
              viewAllCategory={cat}
            />
          ))}

          {/* ── New Arrivals ──────────────────────────────────── */}
          <ProductRow title="New Arrivals" badge="New" badgeTone="new" products={newArrivals} />

          {/* ── Top Rated ─────────────────────────────────────── */}
          <ProductRow title="Trending Now" badge="Trending" badgeTone="trending" products={topRated} />

          {/* ── All Products grid ────────────────────────────── */}
          <section className="max-w-[var(--container)] mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-ink">All Products</h2>
              <Link to={ROUTES.PRODUCTS} className="text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 stagger-in">
              {products.slice(0, 12).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
