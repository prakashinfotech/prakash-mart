import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { FilterState } from '@/features/product/types/product.types'

const RATINGS = [4, 3, 2, 1]

interface BrandOption { id: string; name: string }

interface FilterSidebarProps {
  filters: FilterState
  onChange: (filters: Partial<FilterState>) => void
  onClear: () => void
  categories?: string[]
  brands?: BrandOption[]
  variantOptions?: Record<string, string[]> // { "Size": ["S","M","L"], "Color": ["Red","Blue"] }
}

const DIVIDER = <div className="h-px bg-border mx-4" />

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-3">{title}</h3>
      {children}
    </div>
  )
}

function FilterContent({
  filters, onChange, onClear,
  categories = [], brands = [], variantOptions = {},
}: FilterSidebarProps) {
  const toggleBrand = (id: string) => {
    const next = filters.brands.includes(id) ? filters.brands.filter(b => b !== id) : [...filters.brands, id]
    onChange({ brands: next })
  }

  const toggleVariantFilter = (key: string, value: string) => {
    const current = filters.variantFilters[key] ?? []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onChange({ variantFilters: { ...filters.variantFilters, [key]: next } })
  }

  return (
    <div className="bg-white border border-border rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <h2 className="text-[14px] font-bold text-ink">Filters</h2>
        <button
          onClick={onClear}
          className="text-[12px] font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <>
          <FilterSection title="Category">
            <ul className="space-y-1.5">
              <li>
                <label className="flex items-center gap-2 cursor-pointer text-[13px] text-ink">
                  <input type="radio" name="category" checked={filters.category === ''}
                    onChange={() => onChange({ category: '' })} className="accent-primary" />
                  All Categories
                </label>
              </li>
              {categories.map(cat => (
                <li key={cat}>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] text-ink">
                    <input type="radio" name="category" checked={filters.category === cat}
                      onChange={() => onChange({ category: cat })} className="accent-primary" />
                    {cat}
                  </label>
                </li>
              ))}
            </ul>
          </FilterSection>
          {DIVIDER}
        </>
      )}

      {/* Price */}
      <FilterSection title="Price Range">
        <div className="flex gap-2">
          <input
            type="number" placeholder="Min" value={filters.minPrice || ''}
            onChange={e => onChange({ minPrice: Number(e.target.value) })}
            className="w-full border border-border rounded-[8px] px-2.5 py-1.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint transition-all"
          />
          <input
            type="number" placeholder="Max" value={filters.maxPrice || ''}
            onChange={e => onChange({ maxPrice: Number(e.target.value) })}
            className="w-full border border-border rounded-[8px] px-2.5 py-1.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary-tint transition-all"
          />
        </div>
      </FilterSection>
      {DIVIDER}

      {/* Rating */}
      <FilterSection title="Customer Rating">
        <div className="flex flex-wrap gap-2">
          {RATINGS.map(r => (
            <button
              key={r}
              onClick={() => onChange({ minRating: filters.minRating === r ? 0 : r })}
              className={`px-3 py-1 rounded-pill text-[12px] font-medium border transition-all duration-150 ${
                filters.minRating === r
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {r}★ & up
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brand */}
      {brands.length > 0 && (
        <>
          {DIVIDER}
          <FilterSection title="Brand">
            <ul className="space-y-1.5">
              {brands.map(brand => (
                <li key={brand.id}>
                  <label className="flex items-center gap-2 cursor-pointer text-[13px] text-ink">
                    <input type="checkbox" checked={filters.brands.includes(brand.id)}
                      onChange={() => toggleBrand(brand.id)} className="accent-primary" />
                    {brand.name}
                  </label>
                </li>
              ))}
            </ul>
          </FilterSection>
        </>
      )}

      {/* Dynamic Variant Filters */}
      {Object.entries(variantOptions).map(([key, values]) => values.length > 0 ? (
        <div key={key}>
          {DIVIDER}
          <FilterSection title={key}>
            <div className="flex flex-wrap gap-2">
              {values.map(val => {
                const selected = (filters.variantFilters[key] ?? []).includes(val)
                return (
                  <button
                    key={val}
                    onClick={() => toggleVariantFilter(key, val)}
                    className={`px-3 py-1 text-[12px] font-medium border rounded-[6px] transition-colors ${
                      selected
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </FilterSection>
        </div>
      ) : null)}
    </div>
  )
}

export function FilterSidebar(props: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* Mobile: Filter button */}
      <div className="md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-[8px] text-[13px] font-medium text-ink hover:border-primary hover:text-primary transition-colors"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="relative w-72 bg-bg-page h-full overflow-y-auto shadow-3">
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border">
                <span className="font-bold text-ink">Filters</span>
                <button onClick={() => setDrawerOpen(false)}><X size={18} className="text-muted" /></button>
              </div>
              <div className="p-3"><FilterContent {...props} /></div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <FilterContent {...props} />
      </aside>
    </>
  )
}
