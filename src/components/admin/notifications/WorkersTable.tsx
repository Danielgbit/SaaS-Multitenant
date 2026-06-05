import { WorkerHealth } from '@/types/admin/notifications'
import { Activity } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  healthy: { label: 'Healthy', className: 'bg-[#16A34A]/10 dark:bg-emerald-400/10 text-[#16A34A] dark:text-emerald-400', dot: 'bg-[#16A34A] dark:bg-emerald-400' },
  warning: { label: 'Warning', className: 'bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400', dot: 'bg-[#F59E0B] dark:bg-amber-400' },
  error: { label: 'Error', className: 'bg-[#DC2626]/10 dark:bg-red-400/10 text-[#DC2626] dark:text-red-400', dot: 'bg-[#DC2626] dark:bg-red-400' },
}

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

function successRate(processed: number, success: number): string {
  if (processed === 0) return '—'
  return `${Math.round((success / processed) * 100)}%`
}

export function WorkersTable({ workers }: { workers: WorkerHealth[] }) {
  if (workers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-12 text-center">
        <Activity className="w-12 h-12 mx-auto text-[#94A3B8] dark:text-slate-500" />
        <h3 className="mt-4 text-lg font-medium text-[#0F172A] dark:text-white">No workers registered</h3>
        <p className="text-[#475569] dark:text-slate-400 mt-2">Workers will appear after the first cron run</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-medium text-[#0F172A] dark:text-white">Workers</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FAFAF9] dark:bg-slate-900/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Worker</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Last Heartbeat</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Processed</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Success %</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Queue</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">DLQ</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
            {workers.map((worker) => {
              const config = STATUS_CONFIG[worker.status] ?? STATUS_CONFIG.warning
              return (
                <tr key={worker.worker_name} className="hover:bg-[#FAFAF9] dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[#0F172A] dark:text-white">{worker.worker_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-[#475569] dark:text-slate-400">{formatRelative(worker.last_seen_at)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono text-[#475569] dark:text-slate-400">{worker.processed_count.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-medium ${
                      successRate(worker.processed_count, worker.success_count) === '100%'
                        ? 'text-[#16A34A] dark:text-emerald-400'
                        : successRate(worker.processed_count, worker.success_count) === '—'
                        ? 'text-[#475569] dark:text-slate-400'
                        : successRate(worker.processed_count, worker.success_count).includes('0%')
                        ? 'text-[#DC2626] dark:text-red-400'
                        : 'text-[#F59E0B] dark:text-amber-400'
                    }`}>
                      {successRate(worker.processed_count, worker.success_count)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-mono ${
                      worker.queue_depth > 50 ? 'text-[#F59E0B] dark:text-amber-400' : 'text-[#475569] dark:text-slate-400'
                    }`}>
                      {worker.queue_depth.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-mono ${
                      worker.dlq_depth > 5 ? 'text-[#DC2626] dark:text-red-400' : 'text-[#475569] dark:text-slate-400'
                    }`}>
                      {worker.dlq_depth.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {worker.last_latency_ms !== null ? (
                      <span className="text-sm font-mono text-[#475569] dark:text-slate-400">
                        {Math.round(worker.last_latency_ms)}ms
                      </span>
                    ) : (
                      <span className="text-sm text-[#94A3B8] dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
