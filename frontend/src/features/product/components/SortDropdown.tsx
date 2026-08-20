import type { SortOption } from '@/features/product/types/product.types'

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance',  label: 'Relevance' },
  { value: 'price_asc',  label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'newest',     label: 'Newest' },
]

interface SortDropdownProps {
  value: SortOption
  onChange: (sort: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-semibold text-muted uppercase tracking-wider shrink-0">Sort:</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-pill border transition-all duration-150 whitespace-nowrap ${
              value === opt.value
                ? 'bg-primary text-white border-primary'
                : 'border-border text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
