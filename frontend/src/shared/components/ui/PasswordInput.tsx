import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  defaultVisible?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, defaultVisible = false, ...props }, ref) => {
    const [visible, setVisible] = useState(defaultVisible)

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#212121] mb-1">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={cn(
              'w-full border border-[#e0e0e0] rounded-lg px-3 py-2 text-sm outline-none transition-all duration-150',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              'placeholder:text-[#878787] pr-10',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878787] hover:text-[#212121]"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
