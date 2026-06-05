import { getNotificationSystemHealth } from '@/actions/admin/getNotificationSystemHealth'
import { HealthSummaryCards } from '@/components/admin/notifications/HealthSummaryCards'
import { WorkersTable } from '@/components/admin/notifications/WorkersTable'
import { ActiveAlerts } from '@/components/admin/notifications/ActiveAlerts'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NotificationsHealthPage() {
  const { workers, alerts, summary } = await getNotificationSystemHealth()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white font-heading">
            Notification System Health
          </h1>
          <p className="text-[#475569] dark:text-slate-400">
            Workers, queue status, and active alerts
          </p>
        </div>
        <Link
          href="/admin/system/notifications"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C5C] dark:bg-[#38BDF8] text-white dark:text-[#0F172A] rounded-md text-sm font-medium hover:bg-[#0C3E4A] dark:hover:bg-[#0EA5E9] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Link>
      </div>

      {/* Summary Cards */}
      <HealthSummaryCards summary={summary} />

      {/* Workers Table */}
      <WorkersTable workers={workers} />

      {/* Active Alerts */}
      <ActiveAlerts alerts={alerts} />
    </div>
  )
}
