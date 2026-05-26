import { HealthSummary } from '@/types/admin/notifications'
import { Activity, Inbox, AlertTriangle, Bell } from 'lucide-react'

type CardConfig = {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export function HealthSummaryCards({ summary }: { summary: HealthSummary }) {
  const cards: CardConfig[] = [
    {
      label: 'Healthy Workers',
      value: summary.healthyWorkers,
      icon: Activity,
      color: '#16A34A',
    },
    {
      label: 'Total Queued',
      value: summary.totalQueueDepth,
      icon: Inbox,
      color: summary.totalQueueDepth > 50 ? '#F59E0B' : '#0EA5E9',
    },
    {
      label: 'DLQ Pending',
      value: summary.totalDlqDepth,
      icon: AlertTriangle,
      color: summary.totalDlqDepth > 5 ? '#DC2626' : '#475569',
    },
    {
      label: 'Active Alerts',
      value: summary.activeAlerts,
      icon: Bell,
      color: summary.activeAlerts > 0 ? '#DC2626' : '#16A34A',
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
