import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ExternalLink } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Validación V2 | Prügressy',
  description: 'Monitoreo de migración de notificaciones V1 vs V2',
}

async function fetchValidationData(organizationId: string) {
  const supabase = await createClient()

  const { data: kpiData } = await (supabase as any)
    .from('shadow_notification_logs')
    .select('severity, drift_score, drift_types')
    .eq('organization_id', organizationId)

  const total = kpiData?.length || 0
  const matches = kpiData?.filter((r: any) => r.severity === 'none').length || 0
  const drifts = kpiData?.filter((r: any) => r.severity !== 'none').length || 0
  const critical = kpiData?.filter((r: any) => r.severity === 'critical').length || 0

  const { data: logs } = await (supabase as any)
    .from('shadow_notification_logs')
    .select('id, seed_id, appointment_id, drift_types, drift_score, severity, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: seeds } = await (supabase as any)
    .from('shadow_notification_seeds')
    .select('correlation_id')
    .in(
      'id',
      logs?.map((l: any) => l.seed_id) || []
    )

  const correlationMap: Record<string, string> = {}
  if (seeds) {
    for (const seed of seeds) {
      correlationMap[seed.id] = seed.correlation_id
    }
  }

  return {
    kpi: { total, matches, drifts, critical },
    logs: logs?.map((log: any) => ({
      ...log,
      correlation_id: correlationMap[log.seed_id] || null,
    })) || [],
  }
}

function severityBadge(severity: string) {
  const tokens: Record<string, { variant: any; label: string }> = {
    none: { variant: 'success', label: 'Match' },
    minor: { variant: 'warning', label: 'Minor' },
    major: { variant: 'error', label: 'Major' },
    critical: { variant: 'error', label: 'Critical' },
  }

  const token = tokens[severity] || tokens.none

  return <Badge variant={token.variant} size="sm">{token.label}</Badge>
}

function formatDriftTypes(types: string[]) {
  if (types.length === 1 && types[0] === 'match') {
    return <span className="text-sm text-muted-foreground">Match</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {types.filter(t => t !== 'match').map((type) => (
        <Badge key={type} variant="warning" size="sm">
          {type.replace('_drift', '')}
        </Badge>
      ))}
    </div>
  )
}

function truncateCorrelation(id: string | null) {
  if (!id || id.length < 12) return id || '—'
  return `${id.slice(0, 4)}...${id.slice(-4)}`
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Hace ${diffHr}h`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default async function ValidationPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember?.organization_id) {
    redirect('/dashboard')
  }

  const data = await fetchValidationData(orgMember.organization_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/notificaciones"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Notificaciones
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Validación V2</h1>
          <p className="text-muted-foreground">
            Monitoreo de migración de notificaciones V1 vs V2
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total comparaciones"
          value={data.kpi.total}
          icon={<ShieldCheck className="w-5 h-5" />}
          iconColor="hsl(var(--primary))"
        />
        <MetricCard
          title="Matches"
          value={data.kpi.matches}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconColor="hsl(var(--success))"
        />
        <MetricCard
          title="Drifts"
          value={data.kpi.drifts}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconColor="hsl(var(--warning))"
        />
        <MetricCard
          title="Drifts críticos"
          value={data.kpi.critical}
          icon={<XCircle className="w-5 h-5" />}
          iconColor="hsl(var(--error))"
        />
      </div>

      {data.logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin comparaciones aún</p>
          <p className="text-sm mt-1">
            Los resultados aparecerán cuando se envíen recordatorios V1 y el worker procese los seeds
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Fecha</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Severidad</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Score</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Drift</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Correlation</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Cita</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log: any) => (
                <tr
                  key={log.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  style={{ borderColor: 'hsl(var(--border) / 0.5)' }}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatRelativeTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {severityBadge(log.severity)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.drift_score}
                  </td>
                  <td className="px-4 py-3">
                    {formatDriftTypes(log.drift_types)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {truncateCorrelation(log.correlation_id)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/appointments/${log.appointment_id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      {log.appointment_id.slice(0, 8)}...
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-1">
                        <span className="group-open:hidden">View JSON</span>
                        <span className="hidden group-open:inline">Hide</span>
                      </summary>
                      <pre className="mt-2 p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto" style={{ backgroundColor: 'hsl(var(--muted))', fontSize: '11px' }}>
                        {JSON.stringify({
                          drift_types: log.drift_types,
                          drift_score: log.drift_score,
                          severity: log.severity,
                        }, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
