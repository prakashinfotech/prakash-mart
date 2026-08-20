import { cn } from '@/shared/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'rating' | 'bestseller' | 'new' | 'discount'
  className?: string
}

const variants = {
  rating: 'bg-primary text-white px-2 py-1',
  new: 'bg-primary text-white px-1.5 py-0.5',
  bestseller: 'bg-warning text-white px-1.5 py-0.5',
  discount: 'text-green-600 font-semibold',
}

export function Badge({ children, variant = 'new', className }: BadgeProps) {
  return (
    <span className={cn('text-xs rounded font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
