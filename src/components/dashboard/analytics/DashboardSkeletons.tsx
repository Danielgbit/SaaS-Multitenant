'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { TrendingUp, Calendar } from 'lucide-react'

function SkeletonBlock({ className = '' }: { className?: string }) {
  const COLORS = useThemeColors()
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: COLORS.textMuted + '20' }}
    />
  )
}

export function StatsGridSkeleton() {
  const COLORS = useThemeColors()

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: COLORS.border,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <SkeletonBlock className="w-8 h-8 rounded-lg" />
            <SkeletonBlock className="w-20 h-3" />
          </div>
          <SkeletonBlock className="w-24 h-7 mb-2" />
          <SkeletonBlock className="w-14 h-3" />
        </div>
      ))}
    </div>
  )
}

export function ChartSectionSkeleton() {
  const COLORS = useThemeColors()

  return (
    <div
      className="p-6 rounded-2xl border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
        <SkeletonBlock className="w-40 h-5" />
      </div>
      <SkeletonBlock className="w-full h-48" />
    </div>
  )
}

export function SidebarSectionSkeleton({ height = 'h-48' }: { height?: string }) {
  const COLORS = useThemeColors()

  return (
    <div
      className="p-6 rounded-2xl border space-y-4"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" style={{ color: COLORS.primary }} />
        <SkeletonBlock className="w-32 h-4" />
      </div>
      <SkeletonBlock className={`w-full ${height}`} />
    </div>
  )
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  const COLORS = useThemeColors()

  return (
    <div
      className="p-6 rounded-2xl border space-y-4"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <SkeletonBlock className="w-36 h-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBlock className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBlock className="w-3/5 h-3" />
            <SkeletonBlock className="w-2/5 h-2.5" />
          </div>
        </div>
      ))}
    </div>
  )
}
