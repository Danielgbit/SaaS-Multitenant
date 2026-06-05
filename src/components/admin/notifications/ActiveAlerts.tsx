import { AlertEvent } from '@/types/admin/notifications'
import { AlertTriangle, Bell } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'



function formatRelative(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export function ActiveAlerts({ alerts }: { alerts: AlertEvent[] }) {
  const COLORS = useThemeColors()

  const levelConfig = {
    error: { icon: AlertTriangle, color: COLORS.error, label: 'Error' },
    warning: { icon: Bell, color: COLORS.warning, label: 'Warning' },
  }
  if (alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-[#16A34A]/10 dark:bg-emerald-400/10 flex items-center justify-center mx-auto">
          <Bell className="w-6 h-6 text-[#16A34A] dark:text-emerald-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-[#0F172A] dark:text-white">No active alerts</h3>
        <p className="text-[#475569] dark:text-slate-400 mt-2">All notification workers are healthy</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700">
        <h2 className="text-lg font-medium text-[#0F172A] dark:text-white">Active Alerts</h2>
      </div>
      <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
        {alerts.map((alert) => {
          const config = levelConfig[alert.level] ?? levelConfig.warning
          const Icon = config.icon
          return (
            <div
              key={alert.id}
              className="px-6 py-4 flex items-start gap-4 hover:bg-[#FAFAF9] dark:hover:bg-slate-900/50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.level === 'error' ? 'bg-[#DC2626]/10 dark:bg-red-400/10 text-[#DC2626] dark:text-red-400' : 'bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400'
                  }`}>
                    {config.label}
                  </span>
                  <span className="text-sm font-medium text-[#475569] dark:text-slate-400">{alert.code}</span>
                </div>
                <p className="text-sm text-[#0F172A] dark:text-white mt-1">{alert.message}</p>
                <p className="text-xs text-[#94A3B8] dark:text-slate-500 mt-2">
                  {alert.worker_name} • {formatRelative(alert.created_at)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
