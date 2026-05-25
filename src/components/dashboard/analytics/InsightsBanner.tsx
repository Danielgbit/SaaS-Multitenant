'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingDown, AlertTriangle, CheckCircle2, Info, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useThemeColors } from '@/hooks/useThemeColors'
import { getInsights } from '@/actions/analytics/getInsights'
import { dashboardKeys } from '@/lib/query-keys'
import type { Period } from '@/types/analytics'

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
  critical: { text: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  warning: { text: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  success: { text: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  info: { text: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE' },
}

export function InsightsBanner({ orgId, period }: InsightsBannerProps) {
  const COLORS = useThemeColors()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: [...dashboardKeys.all, 'insights', orgId, period],
    queryFn: () => getInsights(orgId, period),
    select: (result) => result.success ? result.data?.filter(i => !dismissedIds.has(i.id)) : [],
    staleTime: 5 * 60 * 1000,
    enabled: orgId !== 'empleado',
  })

  const insights = data || []
  if (isLoading || insights.length === 0) return null

  const current = insights[currentIndex]
  if (!current) return null

  const Icon = iconMap[current.type]
  const colors = colorMap[current.type]

  const total = insights.length
  const hasMultiple = total > 1

  return (
    <div
      className="relative rounded-xl border p-4 flex items-start gap-3"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: colors.text + '20' }}
      >
        <Icon className="w-4 h-4" style={{ color: colors.text }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold" style={{ color: colors.text }}>
            {current.title}
          </p>
          {current.metric && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: colors.text + '20',
                color: colors.text,
              }}
            >
              {current.metric}
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: colors.text + 'CC' }}>
          {current.description}
        </p>

        <div className="flex items-center gap-3 mt-2">
          {current.action && (
            <Link
              href={current.action.href || '#'}
              className="text-xs font-medium underline underline-offset-2 hover:no-underline"
              style={{ color: colors.text }}
            >
              {current.action.label}
            </Link>
          )}
          {hasMultiple && (
            <span className="text-xs" style={{ color: colors.text + '99' }}>
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
              <ChevronLeft className="w-3 h-3" style={{ color: colors.text }} />
            </button>
            <button
              onClick={() => setCurrentIndex(i => (i + 1) % total)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
              type="button"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-3 h-3" style={{ color: colors.text }} />
            </button>
          </>
        )}
        <button
          onClick={() => {
            setDismissedIds(prev => new Set(prev).add(current.id))
            if (currentIndex >= insights.length - 1) {
              setCurrentIndex(0)
            }
          }}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
          type="button"
          aria-label="Descartar"
        >
          <X className="w-3 h-3" style={{ color: colors.text }} />
        </button>
      </div>
    </div>
  )
}
