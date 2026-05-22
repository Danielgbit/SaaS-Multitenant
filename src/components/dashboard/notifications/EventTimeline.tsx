'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Copy, Check, Search, Filter, X } from 'lucide-react'

interface Event {
  id: string
  event_type: string
  created_at: string
  trace_id?: string
  queue_item_id?: string
  message_id?: string
  metadata?: Record<string, unknown>
  latency_ms?: number
  provider_message_id?: string
  correlation_id?: string
}

interface EventTimelineProps {
  events: Event[]
}

const EVENT_TYPES = ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'DEAD_LETTERED', 'REPLIED', 'CANCELLED']

function eventSeverity(eventType: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    DELIVERED: 'success',
    READ: 'success',
    SENT: 'info',
    QUEUED: 'neutral',
    PROCESSING: 'warning',
    FAILED: 'error',
    DEAD_LETTERED: 'error',
    REPLIED: 'info',
    CANCELLED: 'neutral',
  }
  return map[eventType] || 'neutral'
}

function eventColor(eventType: string): string {
  const map: Record<string, string> = {
    DELIVERED: 'border-green-200 bg-green-50',
    READ: 'border-green-200 bg-green-50',
    SENT: 'border-blue-200 bg-blue-50',
    QUEUED: 'border-gray-200 bg-gray-50',
    PROCESSING: 'border-amber-200 bg-amber-50',
    FAILED: 'border-red-200 bg-red-50',
    DEAD_LETTERED: 'border-purple-200 bg-purple-50',
    REPLIED: 'border-blue-200 bg-blue-50',
    CANCELLED: 'border-gray-200 bg-gray-50',
  }
  return map[eventType] || 'border-border bg-muted'
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

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatLatency(ms?: number): string | null {
  if (ms === undefined || ms === null) return null
  if (ms < 10) return `<10ms`
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}min`
}

function latencyColor(ms?: number): string {
  if (ms === undefined || ms === null) return ''
  if (ms < 10) return 'text-green-600 bg-green-50 border-green-200'
  if (ms < 1000) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function severityBadge(severity: 'success' | 'warning' | 'error' | 'info' | 'neutral') {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  }
  const s = map[severity]
  return `${s.bg} ${s.text} ${s.border}`
}

export function EventTimeline({ events }: EventTimelineProps) {
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set())
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set(EVENT_TYPES))
  const [traceSearch, setTraceSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!filterTypes.has(e.event_type)) return false
      if (traceSearch && !e.trace_id?.toLowerCase().includes(traceSearch.toLowerCase())) return false
      return true
    })
  }, [events, filterTypes, traceSearch])

  const eventsByTrace = useMemo(() => {
    const map = new Map<string, Event[]>()
    const noTrace: Event[] = []
    for (const event of filteredEvents) {
      if (event.trace_id) {
        const existing = map.get(event.trace_id) || []
        existing.push(event)
        map.set(event.trace_id, existing)
      } else {
        noTrace.push(event)
      }
    }
    for (const [, traceEvents] of map) {
      traceEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    return { traces: map, noTrace }
  }, [filteredEvents])

  const sortedTraces = useMemo(() => {
    return Array.from(eventsByTrace.traces.entries()).sort(
      (a, b) => new Date(b[1][b[1].length - 1].created_at).getTime() - new Date(a[1][a[1].length - 1].created_at).getTime()
    )
  }, [eventsByTrace])

  const toggleTrace = (traceId: string) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev)
      if (next.has(traceId)) next.delete(traceId)
      else next.add(traceId)
      return next
    })
  }

  const toggleExpandAll = () => {
    if (expandedTraces.size === sortedTraces.length) {
      setExpandedTraces(new Set())
    } else {
      setExpandedTraces(new Set(sortedTraces.map(([id]) => id)))
    }
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const toggleFilter = (type: string) => {
    setFilterTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const anyExpanded = expandedTraces.size > 0
  const allExpanded = expandedTraces.size === sortedTraces.length

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'hsl(var(--border))' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Timeline de Eventos</h3>
        <span className="text-xs text-muted-foreground">
          {filteredEvents.length} eventos
        </span>
      </div>

      {/* Filters bar */}
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors border ${
                filterTypes.has(type)
                  ? `${severityBadge(eventSeverity(type))} border`
                  : 'text-muted-foreground border-border bg-transparent opacity-50'
              }`}
            >
              {type}
              {!filterTypes.has(type) && <X className="inline w-2.5 h-2.5 ml-1" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={traceSearch}
              onChange={(e) => setTraceSearch(e.target.value)}
              placeholder="Filtrar por trace ID..."
              className="w-full rounded border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-colors"
              style={{ borderColor: 'hsl(var(--border))' }}
            />
            {traceSearch && (
              <button onClick={() => setTraceSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={toggleExpandAll}
            className="rounded border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors shrink-0"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {/* Events */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No hay eventos que coincidan con los filtros
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTraces.slice(0, 20).map(([traceId, traceEvents]) => {
            const lastEventType = traceEvents[traceEvents.length - 1].event_type
            const severity = eventSeverity(lastEventType)
            const sevStyle = severityBadge(severity)
            const isExpanded = expandedTraces.has(traceId) || expandedTraces.size === 0

            return (
              <div key={traceId} className="rounded border" style={{ borderColor: 'hsl(var(--border))' }}>
                {/* Trace header */}
                <button
                  onClick={() => toggleTrace(traceId)}
                  className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-mono text-xs truncate max-w-[120px]">{traceId.slice(0, 12)}...</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium border ${sevStyle}`}>
                      {lastEventType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({traceEvents.length} eventos)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(traceId, `trace-${traceId}`)
                      }}
                      className="rounded p-1 hover:bg-muted transition-colors"
                      title="Copiar trace ID"
                    >
                      {copiedId === `trace-${traceId}` ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(traceEvents[traceEvents.length - 1].created_at)}
                    </span>
                  </div>
                </button>

                {/* Trace events */}
                {isExpanded && (
                  <div className="border-t" style={{ borderColor: 'hsl(var(--border))' }} role="region">
                    <div className="relative">
                      <div className="absolute left-[26px] top-2 bottom-2 w-0.5" style={{ backgroundColor: 'hsl(var(--border))' }} />
                      {traceEvents.map((event, idx) => {
                        const colorClass = eventColor(event.event_type)
                        const nextEvent = idx < traceEvents.length - 1 ? traceEvents[idx + 1] : null
                        const latencyMs = nextEvent && event.created_at
                          ? new Date(nextEvent.created_at).getTime() - new Date(event.created_at).getTime()
                          : undefined

                        return (
                          <div key={event.id} className="relative flex items-start gap-3 px-3 py-2">
                            <div className={`relative z-10 shrink-0 w-3 h-3 rounded-full mt-1.5 border-2 ${
                              event.event_type === 'DELIVERED' || event.event_type === 'READ'
                                ? 'bg-green-400 border-green-600'
                                : event.event_type === 'FAILED' || event.event_type === 'DEAD_LETTERED'
                                ? 'bg-red-400 border-red-600'
                                : event.event_type === 'PROCESSING'
                                ? 'bg-amber-400 border-amber-600'
                                : 'bg-blue-400 border-blue-600'
                            }`} />
                            <div className={`flex-1 rounded border px-3 py-1.5 ${colorClass}`}>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{event.event_type}</span>
                                  {event.latency_ms !== undefined && event.latency_ms !== null && (
                                    <span className={`rounded px-1 py-0.5 text-[10px] font-mono border ${latencyColor(event.latency_ms)}`}>
                                      {formatLatency(event.latency_ms)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatTime(event.created_at)}</span>
                                  {latencyMs !== undefined && latencyMs !== null && (
                                    <span className={`font-mono text-[10px] ${latencyColor(latencyMs)}`}>
                                      +{formatLatency(latencyMs)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <details className="mt-1 group">
                                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1">
                                    <span className="group-open:hidden">Ver metadata</span>
                                    <span className="hidden group-open:inline">Ocultar</span>
                                  </summary>
                                  <pre className="mt-1 p-2 rounded text-xs whitespace-pre-wrap font-mono overflow-x-auto max-h-32" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                                    {JSON.stringify(event.metadata, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Events without trace */}
          {eventsByTrace.noTrace.slice(0, 5).map((event) => (
            <div key={event.id} className="rounded px-3 py-2 text-sm" style={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{formatTime(event.created_at)}</span>
                  <span className="font-medium">{event.event_type}</span>
                  {event.latency_ms !== undefined && event.latency_ms !== null && (
                    <span className={`rounded px-1 py-0.5 text-[10px] font-mono border ${latencyColor(event.latency_ms)}`}>
                      {formatLatency(event.latency_ms)}
                    </span>
                  )}
                </div>
                {event.queue_item_id && (
                  <button
                    onClick={() => handleCopy(event.queue_item_id!, `qi-${event.id}`)}
                    className="rounded p-1 hover:bg-muted transition-colors"
                  >
                    {copiedId === `qi-${event.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 text-xs text-muted-foreground">
        Mostrando {Math.min(sortedTraces.length, 20)} trazas de {sortedTraces.length} · {filteredEvents.length - eventsByTrace.noTrace.length} eventos con trace · {eventsByTrace.noTrace.length} sin trace
      </div>
    </div>
  )
}
