import type { LucideIcon } from 'lucide-react'

interface AdminMetricCardProps {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  icon: LucideIcon
  color?: string
}

export function AdminMetricCard({ label, value, prefix, suffix, icon: Icon, color = '#0F4C5C' }: AdminMetricCardProps) {
  const displayValue = typeof value === 'number'
    ? value.toLocaleString('es-CO')
    : value

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-6 flex items-start gap-4 shadow-sm">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[#475569] dark:text-slate-400 truncate">{label}</p>
        <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1 font-heading">
          {prefix}{displayValue}{suffix}
        </p>
      </div>
    </div>
  )
}
