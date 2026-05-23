'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RotateCcw, ExternalLink, CheckCircle2 } from 'lucide-react'

interface MessageReplayButtonProps {
  messageId: string
  currentStatus: string
}

const REPLAYABLE_STATUSES = ['failed', 'failed_permanently', 'error']

export function MessageReplayButton({ messageId, currentStatus }: MessageReplayButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newQueueItemId, setNewQueueItemId] = useState<string | null>(null)

  if (!REPLAYABLE_STATUSES.includes(currentStatus)) {
    return null
  }

  const handleReplay = async () => {
    if (!window.confirm('¿Re-enviar este mensaje?\n\nSe creará un nuevo item en la cola con el payload original exacto.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/notifications/messages/${messageId}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Error al re-enviar')
      }

      const data = await response.json()
      setNewQueueItemId(data.newQueueItemId)
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      setError(msg)
      console.error('[ReplayButton] Failed:', msg)
    } finally {
      setLoading(false)
    }
  }

  if (newQueueItemId) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Re-encolado</span>
        </div>
        <Link
          href={`/notificaciones/messages/${newQueueItemId}`}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-primary hover:bg-muted/30 transition-colors"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          Ver nuevo envío
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleReplay}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Re-enviando...' : 'Re-enviar'}
      </button>
      {error && (
        <span className="text-xs text-red-600 max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}
