import { cn } from '@/shared/utils/cn'

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#e0e0e0] rounded animate-pulse', className)} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg overflow-hidden">
      <Bone className="aspect-[4/5] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-3/4" />
        <div className="flex items-center gap-2 pt-1">
          <Bone className="h-5 w-10 rounded" />
          <Bone className="h-3 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-4 w-16" />
          <Bone className="h-3 w-10" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="max-w-container mx-auto px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <Bone className="h-5 w-32" />
        <Bone className="h-4 w-16" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-40 shrink-0">
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  )
}
