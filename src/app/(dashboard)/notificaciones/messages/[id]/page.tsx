import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMessageInspectorData, getRetryHistory, getInboundEvents } from '@/lib/notifications/inspector'
import { RawWebhookViewer } from '@/components/dashboard/notifications/RawWebhookViewer'
import { RetryTimeline } from '@/components/dashboard/notifications/RetryTimeline'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Copy, Clock, Send, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import type { NotificationEvent, NotificationInboundEvent, NotificationMessageRecord, NotificationQueueItem } from '@/types/notifications'

export const metadata: Metadata = {
  title: 'Inspector de Mensaje | Prügressy',
  description: 'Inspección detallada de mensaje de notificación',
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    sent: 'success', delivered: 'success', read: 'info',
    pending: 'warning', processing: 'warning',
    failed: 'error', failed_permanently: 'error', error: 'error',
    received: 'info',
  }
  return map[status] || 'neutral'
}

function relativeTime(dateStr?: string) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Hace ${diffHr}h`
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function InfoRow({ label, value, mono }: { label: string; value: string | undefined | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs ${mono ? 'font-mono' : ''} max-w-[300px] truncate text-right`} title={value || ''}>
        {value || '—'}
      </span>
    </div>
  )
}

function IdCopy({ id, label }: { id: string | undefined | null; label: string }) {
  if (!id) return <InfoRow label={label} value={null} mono />
  return (
    <div className="flex items-center justify-between py-1.5 border-b last:border-b-0" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 max-w-[300px]">
        <span className="text-xs font-mono truncate" title={id}>
          {id.slice(0, 8)}...{id.slice(-4)}
        </span>
        <button
          onClick={async () => {
            try { await navigator.clipboard.writeText(id) } catch {}
          }}
          className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors"
          title={`Copiar ${label}`}
        >
          <Copy className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

function LatencyTag({ label, ms }: { label: string; ms?: number | null }) {
  if (ms === undefined || ms === null) return null
  const color = ms < 1000 ? 'text-green-600' : ms < 5000 ? 'text-amber-600' : 'text-red-600'
  const display = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
  return (
    <span className={`text-xs font-mono ${color}`}>
      {label}: {display}
    </span>
  )
}

function DeliveryTimeline({ events }: { events: NotificationEvent[] }) {
  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">Sin eventos registrados</div>
  }

  const eventIcons: Record<string, React.ReactNode> = {
    QUEUED: <Clock className="w-4 h-4 text-blue-500" />,
    PROCESSING: <Send className="w-4 h-4 text-amber-500" />,
    SENT: <Send className="w-4 h-4 text-blue-600" />,
    DELIVERED: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    READ: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    FAILED: <XCircle className="w-4 h-4 text-red-500" />,
    DEAD_LETTERED: <AlertTriangle className="w-4 h-4 text-purple-600" />,
    REPLIED: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
  }

  const eventColors: Record<string, string> = {
    QUEUED: 'border-blue-200 bg-blue-50',
    PROCESSING: 'border-amber-200 bg-amber-50',
    SENT: 'border-blue-200 bg-blue-50',
    DELIVERED: 'border-green-200 bg-green-50',
    READ: 'border-green-200 bg-green-50',
    FAILED: 'border-red-200 bg-red-50',
    DEAD_LETTERED: 'border-purple-200 bg-purple-50',
    REPLIED: 'border-blue-200 bg-blue-50',
  }

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-2 bottom-2 w-0.5" style={{ backgroundColor: 'hsl(var(--border))' }} />
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div key={event.id} className="relative flex items-start gap-3">
            <div className="relative z-10 shrink-0 mt-0.5">{eventIcons[event.eventType] || <Clock className="w-4 h-4 text-muted-foreground" />}</div>
            <div className={`flex-1 rounded-lg border px-3 py-2 ${eventColors[event.eventType] || 'bg-muted border-border'}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium">{event.eventType}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(event.createdAt)}</span>
                  {event.latencyMs !== null && event.latencyMs !== undefined && (
                    <LatencyTag label="lat" ms={event.latencyMs} />
                  )}
                </div>
              </div>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <details className="mt-1 group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1">
                    <span className="group-open:hidden">Ver metadata</span>
                    <span className="hidden group-open:inline">Ocultar</span>
                  </summary>
                  <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function MessageInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember?.organization_id) redirect('/dashboard')

  const inspectorData = await getMessageInspectorData(id, orgMember.organization_id)

  if (!inspectorData.message && !inspectorData.queueItem) {
    return (
      <div className="space-y-6">
        <Link href="/notificaciones/messages" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a búsqueda
        </Link>
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Mensaje no encontrado</p>
          <p className="text-sm mt-1">El ID &quot;{id}&quot; no corresponde a ningún mensaje registrado</p>
        </div>
      </div>
    )
  }

  const msg = inspectorData.message
  const qi = inspectorData.queueItem
  const events = inspectorData.events
  const inboundEvents = inspectorData.inboundEvents

  const retryEvents = await getRetryHistory(qi?.id || msg?.queueItemId || '')
  const retryAttempts = retryEvents
    .filter((e) => e.eventType === 'FAILED' || e.eventType === 'SENT' || e.eventType === 'DEAD_LETTERED')
    .map((e, idx) => ({
      attemptNumber: idx + 1,
      timestamp: e.createdAt,
      error: (e.metadata?.error as string) || undefined,
      durationMs: e.latencyMs || undefined,
      result: (e.eventType === 'SENT' ? 'success' : e.eventType === 'DEAD_LETTERED' ? 'dead_lettered' : 'failed') as 'success' | 'failed' | 'dead_lettered',
    }))

  const status = qi?.status || msg?.status || 'unknown'
  const channel = qi?.channel || msg?.channel || '—'
  const providerSnapshot = qi?.providerSnapshot
  const providerName = providerSnapshot?.provider || null

  const corrId = msg?.correlationId || qi?.correlationId || null

  const latencyMs = qi?.createdAt && qi?.sentAt
    ? new Date(qi.sentAt).getTime() - new Date(qi.createdAt).getTime()
    : undefined

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/notificaciones/messages"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a búsqueda
      </Link>

      {/* Section 1: Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Inspector de Mensaje</h1>
          <Badge variant={statusBadgeVariant(status)} size="md">{status}</Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Canal: <span className="font-mono">{channel}</span></span>
          {providerName && <span>Provider: <span className="font-mono">{providerName}</span></span>}
          {formatDate(msg?.createdAt || qi?.createdAt)}
        </div>
      </div>

      {/* Section 2: General Info */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--border))' }}>
        <h3 className="font-semibold mb-3">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div>
            <IdCopy id={msg?.id} label="Message ID" />
            <IdCopy id={qi?.id || msg?.queueItemId} label="Queue Item ID" />
            <IdCopy id={msg?.traceId || qi?.traceId} label="Trace ID" />
            <IdCopy id={corrId} label="Correlation ID" />
          </div>
          <div>
            <IdCopy id={qi?.appointmentId} label="Appointment ID" />
            <IdCopy id={msg?.providerMessageId || qi?.providerMessageId} label="Provider Message ID" />
            <InfoRow label="Organization ID" value={qi?.organizationId || msg?.organizationId} mono />
            <InfoRow label="Canal" value={channel} />
          </div>
        </div>
      </div>

      {/* Section 3: Request Payload */}
      <div>
        <h3 className="font-semibold mb-2">Payload Enviado</h3>
        <RawWebhookViewer
          data={(msg?.requestPayload || (msg?.payload as Record<string, unknown>)) as Record<string, unknown>}
          title="Request Payload"
          defaultCollapsed={false}
          height="240px"
          tabs={
            msg?.requestPayload
              ? [
                  { label: 'Request', data: msg.requestPayload as Record<string, unknown> },
                  { label: 'Variables', data: (msg?.payload?.variables || qi?.variables || {}) as Record<string, unknown> },
                ]
              : undefined
          }
        />
      </div>

      {/* Section 4: Provider Response */}
      <div>
        <h3 className="font-semibold mb-2">Respuesta del Provider</h3>
        <RawWebhookViewer
          data={msg?.responsePayload as Record<string, unknown>}
          title="Provider Response"
          defaultCollapsed
          height="240px"
          tabs={
            msg?.responseHeaders
              ? [
                  { label: 'Response Body', data: msg.responsePayload as Record<string, unknown> },
                  { label: 'Headers', data: msg.responseHeaders as Record<string, unknown> },
                ]
              : undefined
          }
        />
        {msg?.responseStatus && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Status Code:</span>
            <span className={`font-mono font-medium ${
              msg.responseStatus < 300 ? 'text-green-600' :
              msg.responseStatus < 500 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {msg.responseStatus}
            </span>
            {msg?.processingTimeMs !== undefined && msg?.processingTimeMs !== null && (
              <>
                <span className="text-muted-foreground">·</span>
                <LatencyTag label="Processing" ms={msg.processingTimeMs} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Delivery Timeline */}
      <div className="rounded-xl border p-4" style={{ borderColor: 'hsl(var(--border))' }}>
        <h3 className="font-semibold mb-3">Delivery Timeline</h3>
        <DeliveryTimeline events={events} />
      </div>

      {/* Section 6: Retry History */}
      {retryAttempts.length > 0 && (
        <RetryTimeline attempts={retryAttempts} maxAttempts={qi?.maxAttempts || 3} />
      )}

      {/* Section 7: Inbound Webhooks */}
      {inboundEvents.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Webhooks Entrantes ({inboundEvents.length})</h3>
          <div className="space-y-3">
            {inboundEvents.map((ie) => (
              <RawWebhookViewer
                key={ie.id}
                data={ie.rawPayload as Record<string, unknown>}
                title={`${ie.provider} · ${ie.parsedAction || 'webhook'} · ${formatDate(ie.createdAt)}`}
                defaultCollapsed
                height="200px"
                tabs={
                  ie.normalizedPayload
                    ? [
                        { label: 'Raw', data: ie.rawPayload as Record<string, unknown> },
                        { label: 'Normalized', data: ie.normalizedPayload as Record<string, unknown> },
                        ...(ie.providerHeaders ? [{ label: 'Headers', data: ie.providerHeaders as Record<string, unknown> }] : []),
                      ]
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 8: Debug Section */}
      <details className="rounded-xl border" style={{ borderColor: 'hsl(var(--border))' }}>
        <summary className="cursor-pointer px-4 py-3 font-semibold text-sm hover:bg-muted/30 transition-colors list-none flex items-center gap-2">
          <span>Debug & Metadata</span>
          <span className="text-xs text-muted-foreground font-normal">(IDs técnicos, latencias, config)</span>
        </summary>
        <div className="px-4 pb-4 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-3">
            <div>
              <InfoRow label="Message ID" value={msg?.id} mono />
              <InfoRow label="Queue Item ID" value={qi?.id || msg?.queueItemId} mono />
              <InfoRow label="Provider Message ID" value={msg?.providerMessageId || qi?.providerMessageId} mono />
              <InfoRow label="Trace ID" value={msg?.traceId || qi?.traceId} mono />
              <InfoRow label="Correlation ID" value={corrId} mono />
              <InfoRow label="Worker Version" value={qi?.workerVersion} mono />
              <InfoRow label="Claimed By" value={qi?.claimedBy} mono />
            </div>
            <div>
              <InfoRow label="Retry Count" value={qi?.attempts?.toString()} />
              <InfoRow label="Max Attempts" value={qi?.maxAttempts?.toString()} />
              <InfoRow label="Last Error" value={qi?.lastError || msg?.errorMessage} />
              <InfoRow label="Next Retry At" value={formatDate(qi?.nextRetryAt)} />
              <InfoRow label="Queue Latency" value={latencyMs !== undefined ? `${latencyMs}ms` : undefined} />
              {msg?.processingTimeMs !== undefined && msg?.processingTimeMs !== null && (
                <InfoRow label="Processing Time" value={`${msg.processingTimeMs}ms`} />
              )}
              {msg?.retryCount !== undefined && msg?.retryCount !== null && (
                <InfoRow label="Retry Count (msg)" value={msg.retryCount.toString()} />
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
