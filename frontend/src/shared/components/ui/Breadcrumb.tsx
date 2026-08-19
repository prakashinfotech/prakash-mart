import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-[11px] text-muted mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={11} />}
          {item.href && i < items.length - 1
            ? <Link to={item.href} className="hover:text-primary transition-colors">{item.label}</Link>
            : <span className={i === items.length - 1 ? 'text-ink font-medium' : ''}>{item.label}</span>
          }
        </span>
      ))}
    </nav>
  )
}
