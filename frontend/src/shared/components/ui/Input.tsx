import { cn } from '@/shared/utils/cn'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#212121] mb-1">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'placeholder:text-[#878787]',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
