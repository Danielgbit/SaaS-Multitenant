'use client'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Skeleton } from '@/components/ui/Skeleton'
import { Loader2 } from 'lucide-react'

export function CashSessionSkeleton() {
  const COLORS = useThemeColors()

  return (
    <div className="flex flex-col gap-5 py-4 lg:py-6" role="status" aria-busy="true" aria-live="polite">
      <div className="flex flex-col lg:flex-row lg:items-start lg:flex-wrap gap-4">
        <div className="flex items-center gap-3 lg:min-w-[200px]">
          <Skeleton variant="circular" width="w-11" height="h-11" />
          <div className="space-y-2">
            <Skeleton width="w-32" height="h-5" />
            <Skeleton width="w-48" height="h-3" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center lg:gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[140px] lg:w-auto lg:flex-1 lg:max-w-[180px]">
              <Skeleton variant="metric" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 lg:pb-0 lg:ml-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={i < 2 ? 'w-28' : 'w-9'} height="h-9" />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Skeleton width="w-24" height="h-5" />
        <Skeleton width="w-36" height="h-4" />
      </div>

      <div
        className="rounded-[20px] p-10 flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
      >
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: COLORS.textMuted }} />
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Cargando caja...</p>
      </div>

      <span className="sr-only">Cargando</span>
    </div>
  )
}
