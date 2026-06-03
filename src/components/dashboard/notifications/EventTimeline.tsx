'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Copy, Check, Search, X, Inbox } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

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

function getEventColor(eventType: string, colors: ReturnType<typeof useThemeColors>) {
  const map: Record<string, string> = {
    DELIVERED: colors.success,
    READ: colors.success,
    SENT: colors.info,
    QUEUED: colors.textMuted,
    PROCESSING: colors.warning,
    FAILED: colors.error,
    DEAD_LETTERED: colors.error,
    REPLIED: colors.info,
    CANCELLED: colors.textMuted,
  }
  return map[eventType] || colors.textMuted
}

function getEventBgColor(eventType: string, colors: ReturnType<typeof useThemeColors>) {
  const map: Record<string, string> = {
    DELIVERED: colors.successLight || '#D1FAE5',
    READ: colors.successLight || '#D1FAE5',
    SENT: colors.infoLight || '#E0F2FE',
    QUEUED: colors.surfaceSubtle,
    PROCESSING: colors.warningLight || '#FEF3C7',
    FAILED: colors.errorLight || '#FEE2E2',
    DEAD_LETTERED: colors.errorLight || '#FEE2E2',
    REPLIED: colors.infoLight || '#E0F2FE',
    CANCELLED: colors.surfaceSubtle,
  }
  return map[eventType] || colors.surfaceSubtle
}

function getEventBorderColor(eventType: string, colors: ReturnType<typeof useThemeColors>) {
  const map: Record<string, string> = {
    DELIVERED: colors.successLight || '#D1FAE5',
    READ: colors.successLight || '#D1FAE5',
    SENT: colors.infoLight || '#E0F2FE',
    QUEUED: colors.border,
    PROCESSING: colors.warningLight || '#FEF3C7',
    FAILED: colors.errorLight || '#FEE2E2',
    DEAD_LETTERED: colors.errorLight || '#FEE2E2',
    REPLIED: colors.infoLight || '#E0F2FE',
    CANCELLED: colors.border,
  }
  return map[eventType] || colors.border
}

function getLatencyColor(ms?: number) {
  if (ms === undefined || ms === null) return 'text-muted-foreground'
  if (ms < 10) return 'text-green-600'
  if (ms < 1000) return 'text-amber-600'
  return 'text-red-600'
}

function getSeverityStyle(severity: 'success' | 'warning' | 'error' | 'info' | 'neutral', colors: ReturnType<typeof useThemeColors>) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: colors.successLight || '#D1FAE5', text: 'text-green-700 dark:text-green-400', border: colors.successLight || '#D1FAE5' },
    warning: { bg: colors.warningLight || '#FEF3C7', text: 'text-amber-700 dark:text-amber-400', border: colors.warningLight || '#FEF3C7' },
    error: { bg: colors.errorLight || '#FEE2E2', text: 'text-red-700 dark:text-red-400', border: colors.errorLight || '#FEE2E2' },
    info: { bg: colors.infoLight || '#E0F2FE', text: 'text-blue-700 dark:text-blue-400', border: colors.infoLight || '#E0F2FE' },
    neutral: { bg: colors.surfaceSubtle, text: 'text-gray-600 dark:text-gray-400', border: colors.border },
  }
  return map[severity]
}

export function EventTimeline({ events }: EventTimelineProps) {
  const COLORS = useThemeColors()
  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set())
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set(EVENT_TYPES))
  const [traceSearch, setTraceSearch] = useState('')
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

  const allExpanded = expandedTraces.size === sortedTraces.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border bg-background/70 backdrop-blur-[6px] p-4"
      style={{ borderColor: COLORS.border }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>
          Timeline de Eventos
        </h3>
        <span className="text-xs font-mono" style={{ color: COLORS.textMuted }}>
          {filteredEvents.length} eventos
        </span>
      </div>

      <div className="space-y-3">
        <motion.div
          className="flex flex-wrap gap-1.5"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
          }}
          initial="hidden"
          animate="visible"
        >
          {EVENT_TYPES.map((type) => {
            const severity = eventSeverity(type)
            const style = getSeverityStyle(severity, COLORS)
            const isActive = filterTypes.has(type)

            return (
              <motion.button
                key={type}
                onClick={() => toggleFilter(type)}
                whileTap={{ scale: 0.98 }}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={{ duration: 0.12 }}
                className={`rounded-lg px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all border ${
                  isActive
                    ? 'opacity-100'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{
                  backgroundColor: isActive ? style.bg : 'transparent',
                  color: isActive ? style.text : COLORS.textMuted,
                  borderColor: isActive ? style.border : COLORS.border,
                }}
              >
                <span className="flex items-center gap-1">
                  {type}
                  {!isActive && <X className="w-2 h-2" />}
                </span>
              </motion.button>
            )
          })}
        </motion.div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
            <input
              type="text"
              value={traceSearch}
              onChange={(e) => setTraceSearch(e.target.value)}
              placeholder="Filtrar por trace ID..."
              className="w-full rounded-lg border bg-background/70 backdrop-blur-[6px] pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-colors"
              style={{ borderColor: COLORS.border }}
            />
            {traceSearch && (
              <button
                onClick={() => setTraceSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
              >
                <X className="w-3 h-3" style={{ color: COLORS.textMuted }} />
              </button>
            )}
          </div>
          <button
            onClick={toggleExpandAll}
            className="rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/50"
            style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
          >
            {allExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="w-8 h-8 mb-3" style={{ color: COLORS.textMuted }} />
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            No hay eventos que coincidan con los filtros
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          <AnimatePresence initial={false}>
            {sortedTraces.slice(0, 20).map(([traceId, traceEvents], index) => {
              const lastEventType = traceEvents[traceEvents.length - 1].event_type
              const severity = eventSeverity(lastEventType)
              const style = getSeverityStyle(severity, COLORS)
              const isExpanded = expandedTraces.has(traceId) || expandedTraces.size === 0

              return (
                <motion.div
                  key={traceId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: index * 0.03, duration: 0.12 }}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: COLORS.border }}
                >
                  <button
                    onClick={() => toggleTrace(traceId)}
                    className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0" style={{ color: COLORS.textMuted }} />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" style={{ color: COLORS.textMuted }} />
                      )}
                      <span className="font-mono text-xs truncate max-w-[140px]" style={{ color: COLORS.textSecondary }}>
                        {traceId.slice(0, 12)}...
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border"
                        style={{ backgroundColor: style.bg, color: style.text, borderColor: style.border }}
                      >
                        {lastEventType}
                      </span>
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>
                        ({traceEvents.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(traceId, `trace-${traceId}`)
                        }}
                        className="rounded p-1 hover:bg-muted/50 transition-colors"
                        title="Copiar trace ID"
                      >
                        {copiedId === `trace-${traceId}` ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
                        )}
                      </button>
                      <span className="text-xs font-mono" style={{ color: COLORS.textMuted }}>
                        {formatRelativeTime(traceEvents[traceEvents.length - 1].created_at)}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="border-t overflow-hidden"
              style={{ borderColor: COLORS.border }}
                      >
                        <div className="relative py-2">
                          <svg className="absolute left-[25px] top-2 bottom-2 w-0.5" style={{ overflow: 'visible' }}>
                            <line
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="100%"
                              stroke={COLORS.border}
                              strokeWidth="1.5"
                              strokeOpacity="0.4"
                            />
                          </svg>
                          {traceEvents.map((event, idx) => {
                             const dotColor = getEventColor(event.event_type, COLORS)
                             const bgColor = getEventBgColor(event.event_type, COLORS)
                             const borderColor = getEventBorderColor(event.event_type, COLORS)
                            const nextEvent = idx < traceEvents.length - 1 ? traceEvents[idx + 1] : null
                            const latencyMs = nextEvent
                              ? new Date(nextEvent.created_at).getTime() - new Date(event.created_at).getTime()
                              : undefined

                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02, duration: 0.12 }}
                                className="relative flex items-start gap-3 px-3 py-1.5"
                              >
                                <div
                                  className="relative z-10 shrink-0 w-2.5 h-2.5 rounded-full mt-2 border-2"
                                  style={{
                                    backgroundColor: dotColor,
                                    borderColor: dotColor,
                                    boxShadow: (event.event_type === 'FAILED' || event.event_type === 'DEAD_LETTERED')
                                      ? `0 0 8px ${dotColor}40`
                                      : 'none',
                                  }}
                                />
                                <div
                                  className="flex-1 rounded-lg border px-3 py-2"
                                  style={{ backgroundColor: bgColor, borderColor }}
                                >
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                       <span className="text-xs font-mono font-medium uppercase tracking-wider" style={{ color: COLORS.textPrimary }}>
                                         {event.event_type}
                                       </span>
                                       {event.latency_ms !== undefined && event.latency_ms !== null && (
                                         <span
                                           className="rounded px-1 py-0.5 text-[10px] font-mono border"
                                           style={{
                                             color: getLatencyColor(event.latency_ms),
                                             backgroundColor: COLORS.surfaceSubtle,
                                             borderColor: COLORS.border,
                                           }}
                                        >
                                          {formatLatency(event.latency_ms)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                       <span style={{ color: COLORS.textMuted }}>
                                         {formatTime(event.created_at)}
                                      </span>
                                      {latencyMs !== undefined && latencyMs !== null && (
                                        <span className={getLatencyColor(latencyMs)}>
                                          +{formatLatency(latencyMs)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                                    <details className="mt-2 group">
                                       <summary className="text-xs cursor-pointer hover:text-foreground list-none flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                                        <span className="group-open:hidden">Ver metadata</span>
                                        <span className="hidden group-open:inline">Ocultar</span>
                                      </summary>
                                      <pre
                                        className="mt-2 p-2 rounded-lg text-xs whitespace-pre-wrap font-mono overflow-x-auto max-h-40"
                                        style={{
                                           backgroundColor: COLORS.surfaceSubtle,
                                           color: COLORS.textSecondary,
                                        }}
                                      >
                                        {JSON.stringify(event.metadata, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {eventsByTrace.noTrace.slice(0, 5).map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.12 }}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs" style={{ color: COLORS.textMuted }}>
                    {formatTime(event.created_at)}
                  </span>
                  <span className="font-mono text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.textPrimary }}>
                    {event.event_type}
                  </span>
                  {event.latency_ms !== undefined && event.latency_ms !== null && (
                    <span
                      className="rounded px-1 py-0.5 text-[10px] font-mono border"
                       style={{
                         color: getLatencyColor(event.latency_ms),
                         backgroundColor: COLORS.surfaceSubtle,
                         borderColor: COLORS.border,
                       }}
                    >
                      {formatLatency(event.latency_ms)}
                    </span>
                  )}
                </div>
                {event.queue_item_id && (
                  <button
                    onClick={() => handleCopy(event.queue_item_id!, `qi-${event.id}`)}
                    className="rounded p-1 hover:bg-muted/50 transition-colors"
                  >
                    {copiedId === `qi-${event.id}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                       <Copy className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t text-xs font-mono" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
        Mostrando {Math.min(sortedTraces.length, 20)} de {sortedTraces.length} trazas
      </div>
    </motion.div>
  )
}
