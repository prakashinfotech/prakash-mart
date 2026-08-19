import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { productApi } from '@/features/product/api/productApi'
import { variantTypeApi } from '@/features/product/api/variantApi'
import { categoryApi, type CategoryDto } from '@/features/category/api/categoryApi'
import { brandApi, type BrandDto } from '@/features/brand/api/brandApi'
import { ProductCard } from '@/features/product/components/ProductCard'
import { FilterSidebar } from '@/features/product/components/FilterSidebar'
import { SortDropdown } from '@/features/product/components/SortDropdown'
import { PageSpinner } from '@/shared/components/ui/Spinner'
import type { FilterState, SortOption, Product } from '@/features/product/types/product.types'

const DEFAULT_FILTERS: FilterState = {
  category: '', minPrice: 0, maxPrice: 0, minRating: 0, brands: [], variantFilters: {},
}
const PAGE_SIZE = 24

export default function ProductListPage() {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categoryDtos, setCategoryDtos] = useState<CategoryDto[]>([])
  const [allBrands, setAllBrands] = useState<BrandDto[]>([])
  const [variantOptions, setVariantOptions] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    category: searchParams.get('category') || '',
  })
  const [sort, setSort] = useState<SortOption>('relevance')
  const [page, setPage] = useState(1)
  const query = searchParams.get('q') || ''

  useEffect(() => {
    categoryApi.getAll().then(setCategoryDtos)
    brandApi.getAll().then(setAllBrands)
  }, [])

  useEffect(() => {
    setLoading(true); setError(''); setPage(1)
    // Pick first selected value per variant filter key as a generic attribute search
    const attrValues = Object.values(filters.variantFilters).flat()
    productApi.getFiltered({
      category: filters.category || undefined,
      brandId: filters.brands[0] || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      minRating: filters.minRating || undefined,
      size: attrValues[0] || undefined,
      color: attrValues[1] || undefined,
    })
      .then(setProducts)
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false))
  }, [filters])

  // Load variant types for selected category and build filter options
  useEffect(() => {
    if (!filters.category) { setVariantOptions({}); return }
    const cat = categoryDtos.find(c => c.name === filters.category)
    if (!cat) return
    variantTypeApi.getByCategory(cat.id)
      .then(vts => {
        const opts: Record<string, string[]> = {}
        for (const vt of vts) if (vt.suggestedOptions.length > 0) opts[vt.name] = vt.suggestedOptions
        setVariantOptions(opts)
      })
      .catch(() => setVariantOptions({}))
  }, [filters.category, categoryDtos])

  useEffect(() => { setPage(1) }, [query, sort])

  const visibleBrands = useMemo(() => {
    if (!filters.category) return allBrands
    const cat = categoryDtos.find(c => c.name === filters.category)
    if (!cat) return allBrands
    return allBrands.filter(b => b.categoryId === cat.id)
  }, [allBrands, categoryDtos, filters.category])

  const filtered = useMemo(() => {
    let result = [...products]
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q))
    }
    if (filters.brands.length > 1) result = result.filter(p => filters.brands.includes(p.brandId))
    switch (sort) {
      case 'price_asc':  return [...result].sort((a, b) => a.price - b.price)
      case 'price_desc': return [...result].sort((a, b) => b.price - a.price)
      case 'rating':     return [...result].sort((a, b) => b.rating - a.rating)
      default: return result
    }
  }, [products, sort, query, filters.brands])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handlePageChange = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* Active filter chips */
  const activeChips: { label: string; clear: () => void }[] = [
    ...(filters.category ? [{ label: filters.category, clear: () => setFilters(f => ({ ...f, category: '' })) }] : []),
    ...(filters.minRating > 0 ? [{ label: `${filters.minRating}★ & above`, clear: () => setFilters(f => ({ ...f, minRating: 0 })) }] : []),
    ...(filters.minPrice > 0 ? [{ label: `From ₹${filters.minPrice.toLocaleString('en-IN')}`, clear: () => setFilters(f => ({ ...f, minPrice: 0 })) }] : []),
    ...(filters.maxPrice > 0 ? [{ label: `Up to ₹${filters.maxPrice.toLocaleString('en-IN')}`, clear: () => setFilters(f => ({ ...f, maxPrice: 0 })) }] : []),
    ...filters.brands.map(id => {
      const b = allBrands.find(x => x.id === id)
      return { label: b?.name ?? id, clear: () => setFilters(f => ({ ...f, brands: f.brands.filter(x => x !== id) })) }
    }),
    ...Object.entries(filters.variantFilters).flatMap(([key, vals]) =>
      vals.map(v => ({
        label: `${key}: ${v}`,
        clear: () => setFilters(f => ({
          ...f,
          variantFilters: { ...f.variantFilters, [key]: f.variantFilters[key].filter(x => x !== v) }
        }))
      }))
    ),
  ]

  return (
    <div className="max-w-[var(--container)] mx-auto px-4 py-8">

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-primary mb-1 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
        {filters.category || (query ? 'Search results' : 'All products')}
      </p>
      <h1 className="text-[28px] font-bold text-ink tracking-tight mb-5">
        {query
          ? <>Results for <em className="italic text-primary">"{query}"</em>{!loading && <span className="text-[18px] text-muted font-normal ml-2">— {filtered.length} found</span>}</>
          : filters.category
            ? <><em className="italic text-primary">{filters.category}</em> products.</>
            : <>Browse <em className="italic text-primary">products</em>.</>
        }
      </h1>

      <div className="flex gap-5 items-start">
        {/* Sidebar */}
        <FilterSidebar
          filters={filters}
          onChange={f => setFilters(prev => {
            const next = { ...prev, ...f }
            if (f.category !== undefined && f.category !== prev.category) next.brands = []
            return next
          })}
          onClear={() => setFilters(DEFAULT_FILTERS)}
          categories={categoryDtos.map(c => c.name)}
          brands={visibleBrands}
          variantOptions={variantOptions}
        />

        {/* Results area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="bg-white border border-border rounded-[10px] px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <SortDropdown value={sort} onChange={setSort} />
            </div>
            {!loading && (
              <p className="text-[12px] text-muted shrink-0">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                {' · '}Page {page} of {totalPages}
              </p>
            )}
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Active:</span>
              {activeChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={chip.clear}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 border border-primary-tint text-primary text-[12px] font-medium rounded-pill hover:bg-primary hover:text-white transition-colors"
                >
                  {chip.label}
                  <X size={11} />
                </button>
              ))}
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-[12px] font-semibold text-error hover:text-error/80 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Products */}
          {loading ? (
            <PageSpinner />
          ) : error ? (
            <div className="bg-white border border-border rounded-[10px] p-12 text-center">
              <p className="text-error text-[13px]">{error}</p>
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-3 text-primary text-[13px] hover:underline">
                Reset filters
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-[10px] p-12 text-center">
              <p className="text-[32px] mb-3">∅</p>
              <p className="text-[15px] font-semibold text-ink mb-1">No products match your filters.</p>
              <p className="text-muted text-[13px] mb-4">Try removing a filter or browse all products.</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="px-5 py-2.5 bg-primary text-white rounded-[8px] text-[13px] font-semibold hover:bg-primary-dark transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-in">
                {paginated.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-[8px] border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-muted text-[13px]">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p as number)}
                          className={`w-9 h-9 rounded-[8px] text-[13px] font-medium transition-colors ${
                            page === p
                              ? 'bg-primary text-white'
                              : 'border border-border text-ink hover:border-primary hover:text-primary'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-[8px] border border-border text-muted hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
