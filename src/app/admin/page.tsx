import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TicketIcon, BuildingIcon, TrendingUp, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export const metadata = {
  title: 'Admin - Prügressy',
  description: 'Panel de administración de Prügressy',
}

const SEVERITY_ORDER = ['error', 'warning', 'healthy']
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  error: AlertTriangle,
  warning: Clock,
  healthy: CheckCircle,
}
const STATUS_COLORS: Record<string, string> = {
  error: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  warning: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  healthy: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
}

function formatLastSeen(date: string | null): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `${min}m`
  const hours = Math.floor(min / 60)
  return `${hours}h ${min % 60}m`
}

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: orgCount }, { count: activeSubscriptions }, { count: promoCodesActive }, workersResult, alertsResult] =
    await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('promo_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('notification_worker_heartbeats')
        .select('*')
        .order('worker_name'),
      supabase
        .from('notification_alert_events')
        .select('*')
        .in('status', ['new', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const workers = workersResult.data || []
  const alerts = alertsResult.data || []

  workers.sort((a, b) => SEVERITY_ORDER.indexOf(a.status) - SEVERITY_ORDER.indexOf(b.status))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white font-heading">
          Panel de Administración
        </h1>
        <p className="text-[#475569] dark:text-slate-400 mt-2">
          Gestiona códigos promocionales y organizaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Organizaciones"
          value={orgCount ?? 0}
          href="/admin/organizations"
          icon={BuildingIcon}
        />
        <StatCard
          label="Suscripciones Activas"
          value={activeSubscriptions ?? 0}
          href="/admin/organizations"
          icon={TrendingUp}
        />
        <StatCard
          label="Códigos Activos"
          value={promoCodesActive ?? 0}
          href="/admin/promo-codes"
          icon={TicketIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Crear código promocional"
          description="Genera un nuevo código para clientes"
          href="/admin/promo-codes/new"
          icon={TicketIcon}
        />
        <ActionCard
          title="Ver organizaciones"
          description="Lista de todos los negocios registrados"
          href="/admin/organizations"
          icon={BuildingIcon}
        />
      </div>

      {/* Workers */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
          <h2 className="text-xl font-semibold text-[#0F172A] dark:text-white font-heading">
            Workers
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/80">
                  <th className="text-left px-4 py-3 font-medium text-[#475569] dark:text-slate-400">Worker</th>
                  <th className="text-left px-4 py-3 font-medium text-[#475569] dark:text-slate-400">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-[#475569] dark:text-slate-400">Último Latido</th>
                  <th className="text-right px-4 py-3 font-medium text-[#475569] dark:text-slate-400">Procesados</th>
                  <th className="text-right px-4 py-3 font-medium text-[#475569] dark:text-slate-400">Errores</th>
                  <th className="text-right px-4 py-3 font-medium text-[#475569] dark:text-slate-400">Queue</th>
                  <th className="text-right px-4 py-3 font-medium text-[#475569] dark:text-slate-400">DLQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {workers.map((w: any) => {
                  const StatusIcon = STATUS_ICONS[w.status] || CheckCircle
                  const statusColor = STATUS_COLORS[w.status] || 'text-slate-500 bg-slate-50'
                  return (
                    <tr key={w.worker_name} className="hover:bg-[#FAFAF9] dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#0F172A] dark:text-white">{w.worker_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#475569] dark:text-slate-400 font-mono text-xs">
                        {formatLastSeen(w.last_seen_at)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#475569] dark:text-slate-400 font-mono text-xs">
                        {w.processed_count?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {w.error_count > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-mono text-xs">
                            {w.error_count}
                          </span>
                        ) : (
                          <span className="text-[#475569] dark:text-slate-400 font-mono text-xs">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-xs ${(w.queue_depth || 0) > 50 ? 'text-red-600 dark:text-red-400' : 'text-[#475569] dark:text-slate-400'}`}>
                          {w.queue_depth ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-xs ${(w.dlq_depth || 0) > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-[#475569] dark:text-slate-400'}`}>
                          {w.dlq_depth ?? '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {workers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#475569] dark:text-slate-400">
                      No hay workers registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Alertas */}
      {alerts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-xl font-semibold text-[#0F172A] dark:text-white font-heading">
              Alertas Activas
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
              {alerts.map((a: any) => (
                <div key={a.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[#FAFAF9] dark:hover:bg-slate-700/30">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.severity === 'error' ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                      [{a.alert_code}] {a.worker_name}
                    </p>
                    {a.message && (
                      <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5 line-clamp-2">{a.message}</p>
                    )}
                    <p className="text-[11px] text-[#94A3B8] dark:text-slate-500 mt-1">
                      {a.created_at ? new Date(a.created_at).toLocaleString('es-CO') : ''}
                      {a.severity === 'error' ? ' · Sin resolver' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string
  value: number
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#0F4C5C] dark:text-[#38BDF8]" />
      </div>
      <div>
        <p className="text-sm text-[#475569] dark:text-slate-400">{label}</p>
        <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1">
          {value}
        </p>
      </div>
    </Link>
  )
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#0F4C5C] dark:text-[#38BDF8]" />
      </div>
      <div>
        <h3 className="font-medium text-[#0F172A] dark:text-white">{title}</h3>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>
    </Link>
  )
}