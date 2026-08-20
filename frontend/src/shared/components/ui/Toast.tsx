import { createPortal } from 'react-dom'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToastStore } from '@/shared/store/useToastStore'
import { cn } from '@/shared/utils/cn'

const ICONS = {
  success: <CheckCircle size={16} className="shrink-0 text-green-500" />,
  error: <AlertCircle size={16} className="shrink-0 text-red-500" />,
  info: <Info size={16} className="shrink-0 text-blue-500" />,
}

const BORDER = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
}

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore()

  return createPortal(
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 bg-white border border-[#e0e0e0] border-l-4 rounded shadow-lg px-4 py-3 min-w-[260px] max-w-xs',
            BORDER[t.type],
          )}
        >
          {ICONS[t.type]}
          <span className="flex-1 text-sm text-[#212121]">{t.message}</span>
          <button
            aria-label="Dismiss"
            onClick={() => dismiss(t.id)}
            className="text-[#878787] hover:text-[#212121] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
