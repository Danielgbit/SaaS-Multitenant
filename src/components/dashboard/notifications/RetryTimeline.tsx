'use client'

import { CheckCircle2, XCircle, RefreshCw, AlertTriangle, Clock } from 'lucide-react'

interface RetryAttempt {
  attemptNumber: number
  timestamp: string
  error?: string
  durationMs?: number
  result: 'success' | 'failed' | 'retrying' | 'dead_lettered'
}

interface RetryTimelineProps {
  attempts: RetryAttempt[]
  maxAttempts: number
}

function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null) return ''
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}min ${Math.round((ms % 60000) / 1000)}s`
}

function formatRelativeTime(ts: string): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Hace ${diffHr}h`
  return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function attemptIcon(result: string) {
  switch (result) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'retrying':
      return <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
    case 'dead_lettered':
      return <AlertTriangle className="w-5 h-5 text-purple-600" />
    default:
      return <Clock className="w-5 h-5 text-muted-foreground" />
  }
}

function attemptBg(result: string): string {
  switch (result) {
    case 'success': return 'bg-green-50 border-green-200'
    case 'failed': return 'bg-red-50 border-red-200'
    case 'retrying': return 'bg-amber-50 border-amber-200'
    case 'dead_lettered': return 'bg-purple-50 border-purple-200'
    default: return 'bg-muted border-border'
  }
}

function attemptLabel(result: string): { label: string; color: string } {
  switch (result) {
    case 'success': return { label: 'Entregado', color: 'text-green-700' }
    case 'failed': return { label: 'Fallido', color: 'text-red-700' }
    case 'retrying': return { label: 'Reintentando...', color: 'text-amber-700' }
    case 'dead_lettered': return { label: 'Dead Letter', color: 'text-purple-700' }
    default: return { label: 'Desconocido', color: 'text-muted-foreground' }
  }
}

export function RetryTimeline({ attempts, maxAttempts }: RetryTimelineProps) {
  if (attempts.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
        Sin intentos registrados
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Historial de Intentos</h3>
        <span className="text-xs text-muted-foreground">
          Máx: {maxAttempts} intentos
        </span>
      </div>

      <div className="relative">
        {/* Vertical connector line */}
        <div
          className="absolute left-[18px] top-2 bottom-2 w-0.5"
          style={{ backgroundColor: 'hsl(var(--border))' }}
        />

        <div className="space-y-4">
          {attempts.map((attempt, idx) => {
            const icon = attemptIcon(attempt.result)
            const { label, color } = attemptLabel(attempt.result)
            const showConnector = idx < attempts.length - 1

            return (
              <div key={idx} className="relative flex items-start gap-3">
                {/* Icon */}
                <div className="relative z-10 shrink-0 mt-0.5">
                  {icon}
                </div>

                {/* Content */}
                <div className={`flex-1 rounded-lg border p-3 ${attemptBg(attempt.result)}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Attempt #{attempt.attemptNumber}
                      </span>
                      <span className={`text-xs font-medium ${color}`}>
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatRelativeTime(attempt.timestamp)}</span>
                      {attempt.durationMs !== undefined && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{formatDuration(attempt.durationMs)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {attempt.error && (
                    <div className="mt-1.5 text-xs text-red-600 font-mono truncate" title={attempt.error}>
                      {attempt.error}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Max attempts indicator */}
        {attempts.length > 0 && attempts[attempts.length - 1].result === 'failed' && (
          <div className="mt-3 rounded-lg border border-dashed border-purple-300 bg-purple-50 p-2 text-center text-xs text-purple-700">
            Límite de {maxAttempts} intentos alcanzado — notificación movida a Dead Letter
          </div>
        )}
      </div>
    </div>
  )
}
