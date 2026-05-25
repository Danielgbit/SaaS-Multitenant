'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { TrendingUp, Calendar, BarChart3, Users } from 'lucide-react'

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

export function TodayPulseSkeleton() {
  const COLORS = useThemeColors()

  return (
    <div
      className="p-4 md:p-5 rounded-2xl border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5" style={{ color: COLORS.primary }} />
        <SkeletonBlock className="w-40 h-5" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <SkeletonBlock className="w-16 h-3" />
          <SkeletonBlock className="w-28 h-7" />
          <SkeletonBlock className="w-14 h-3" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="w-16 h-3" />
          <SkeletonBlock className="w-20 h-7" />
          <SkeletonBlock className="w-24 h-3" />
        </div>
      </div>

      <SkeletonBlock className="w-full h-px mb-4" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="w-32 h-3" />
          <SkeletonBlock className="w-12 h-3" />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonBlock className="w-24 h-3" />
          <SkeletonBlock className="w-16 h-3" />
        </div>
      </div>
    </div>
  )
}

export function StaffUtilizationSkeleton() {
  const COLORS = useThemeColors()

  return (
    <div
      className="p-4 md:p-5 rounded-2xl border"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5" style={{ color: COLORS.primary }} />
        <SkeletonBlock className="w-40 h-5" />
      </div>

      <div className="space-y-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock className="w-24 h-4" />
            <div className="flex-1">
              <SkeletonBlock className="w-full h-3 rounded-full" />
            </div>
            <SkeletonBlock className="w-12 h-4" />
          </div>
        ))}
      </div>

      <SkeletonBlock className="w-full h-px mb-4" />

      <div className="flex items-center justify-between">
        <SkeletonBlock className="w-32 h-4" />
        <SkeletonBlock className="w-24 h-4" />
      </div>
    </div>
  )
}
