'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { TrendingDown, AlertTriangle, CheckCircle2, Info, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getInsights } from '@/actions/analytics/getInsights'
import { getTodayPulse } from '@/actions/analytics/getTodayPulse'
import { getStaffUtilization } from '@/actions/analytics/getStaffUtilization'
import { dashboardKeys } from '@/lib/query-keys'
import { deriveOperationalSignals } from '@/lib/operational-intelligence'
import type { Period, TodayPulse, StaffUtilizationSummary } from '@/types/analytics'

interface InsightsBannerProps {
  orgId: string
  period: Period
}

const iconMap = {
  critical: TrendingDown,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
}

const colorMap = {
  critical: (COLORS: ReturnType<typeof useThemeColors>) => ({
    text: COLORS.error,
    bg: COLORS.errorLight,
    border: COLORS.error,
  }),
  warning: (COLORS: ReturnType<typeof useThemeColors>) => ({
    text: COLORS.warning,
    bg: COLORS.warningLight,
    border: COLORS.warning,
  }),
  success: (COLORS: ReturnType<typeof useThemeColors>) => ({
    text: COLORS.success,
    bg: COLORS.successLight,
    border: COLORS.success,
  }),
  info: (COLORS: ReturnType<typeof useThemeColors>) => ({
    text: COLORS.info,
    bg: COLORS.infoLight,
    border: COLORS.info,
  }),
}

type InsightItemType = {
  id: string
  type: 'critical' | 'warning' | 'success' | 'info'
  title: string
  description: string
  metric?: string
  action?: { label?: string; href?: string }
}

export function InsightsBanner({ orgId, period }: InsightsBannerProps) {
  const COLORS = useThemeColors()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: [...dashboardKeys.all, 'insights', orgId, period],
    queryFn: () => getInsights(orgId, period),
    select: (result) => result.success ? result.data?.filter(i => !dismissedIds.has(i.id)) : [],
    staleTime: 5 * 60 * 1000,
    enabled: orgId !== 'empleado',
  })

  const { data: pulseData } = useQuery({
    queryKey: dashboardKeys.pulse(orgId),
    queryFn: () => getTodayPulse(orgId),
    select: (result) => result.success ? result.data : undefined,
    staleTime: 30_000,
    enabled: orgId !== 'empleado',
  })

  const { data: staffData } = useQuery({
    queryKey: dashboardKeys.staffUtilization(orgId),
    queryFn: () => getStaffUtilization(orgId),
    select: (result) => result.success ? result.data : undefined,
    staleTime: 30_000,
    enabled: orgId !== 'empleado',
  })

  const { bannerSignals } = useMemo(
    () => deriveOperationalSignals(
      pulseData as TodayPulse | undefined,
      staffData as StaffUtilizationSummary | undefined
    ),
    [pulseData, staffData]
  )

  const operationalItems: InsightItemType[] = useMemo(() => {
    return bannerSignals.map(signal => ({
      id: signal.id,
      type: signal.severity,
      title: signal.title,
      description: signal.description,
      metric: signal.metric ? `${signal.metric.current}${signal.metric.unit}` : undefined,
      action: signal.actionHref ? { label: signal.actionLabel, href: signal.actionHref } : undefined,
    }))
  }, [bannerSignals])

  const insights = insightsData || []
  const allItems: InsightItemType[] = useMemo(() => [...operationalItems, ...insights], [operationalItems, insights])

  const current = allItems[currentIndex]
  if (insightsLoading || allItems.length === 0) return null

  const variantColors = colorMap[current.type](COLORS)
  const Icon = iconMap[current.type]

  const total = allItems.length
  const hasMultiple = total > 1

  return (
    <div
      className="relative rounded-xl border p-4 flex items-start gap-3 animate-fade-in"
      style={{
        backgroundColor: variantColors.bg,
        borderColor: variantColors.border + '40',
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
        style={{ backgroundColor: variantColors.text + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color: variantColors.text }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold" style={{ color: variantColors.text }}>
            {current.title}
          </p>
          {current.metric && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: variantColors.text + '20',
                color: variantColors.text,
              }}
            >
              {current.metric}
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: variantColors.text + 'CC' }}>
          {current.description}
        </p>

        <div className="flex items-center gap-3 mt-2">
          {current.action && (
            <Link
              href={current.action.href || '#'}
              className="text-xs font-medium underline underline-offset-2 hover:no-underline"
              style={{ color: variantColors.text }}
            >
              {current.action.label}
            </Link>
          )}
          {hasMultiple && (
            <span className="text-xs" style={{ color: variantColors.text + '99' }}>
              {currentIndex + 1} / {total}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasMultiple && (
          <>
            <button
              onClick={() => setCurrentIndex(i => (i - 1 + total) % total)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
              type="button"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-3 h-3" style={{ color: variantColors.text }} />
            </button>
            <button
              onClick={() => setCurrentIndex(i => (i + 1) % total)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
              type="button"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-3 h-3" style={{ color: variantColors.text }} />
            </button>
          </>
        )}
        <button
          onClick={() => {
            setDismissedIds(prev => new Set(prev).add(current.id))
            if (currentIndex >= allItems.length - 1) {
              setCurrentIndex(0)
            }
          }}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
          type="button"
          aria-label="Descartar"
        >
          <X className="w-3 h-3" style={{ color: variantColors.text }} />
        </button>
      </div>
    </div>
  )
}
