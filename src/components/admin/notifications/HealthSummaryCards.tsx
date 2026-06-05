import { HealthSummary } from '@/types/admin/notifications'
import { Activity, Inbox, AlertTriangle, Bell } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

export function HealthSummaryCards({ summary }: { summary: HealthSummary }) {
  const COLORS = useThemeColors()

  const cards = [
    {
      label: 'Healthy Workers',
      value: summary.healthyWorkers,
      icon: Activity,
      color: COLORS.success,
    },
    {
      label: 'Total Queued',
      value: summary.totalQueueDepth,
      icon: Inbox,
      color: summary.totalQueueDepth > 50 ? COLORS.warning : COLORS.info,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-6 flex items-start gap-4"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${card.color}15`, color: card.color }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#475569] dark:text-slate-400">{card.label}</p>
              <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1">
                {card.value}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
