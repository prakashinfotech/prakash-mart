import { cn } from '@/shared/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-primary text-white hover:bg-[#003580] active:scale-95',
  accent: 'bg-accent text-white hover:bg-orange-600 active:scale-95',
  outline: 'border border-[#e0e0e0] text-[#212121] hover:border-primary hover:text-primary active:scale-95',
  ghost: 'text-primary hover:bg-blue-50 active:scale-95',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      aria-disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-all duration-150 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
