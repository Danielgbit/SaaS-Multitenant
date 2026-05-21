'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

interface StuckProcessingAlertProps {
  stuckItems: Array<{
    id: string
    claimed_at: string
    created_at: string
    trace_id?: string
  }>
}

export function StuckProcessingAlert({ stuckItems }: StuckProcessingAlertProps) {
  const router = useRouter()
  const [isRequeuing, setIsRequeuing] = useState<string | null>(null)

  const handleRequeue = async (queueItemId: string) => {
    setIsRequeuing(queueItemId)
    try {
      const response = await fetch('/api/notifications/stuck/requeue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`,
        },
        body: JSON.stringify({ queueItemId }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      router.refresh()
    } catch (error) {
      console.error('Failed to requeue:', error)
      alert('Error al reencolar. Intente nuevamente.')
    } finally {
      setIsRequeuing(null)
    }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">
            {stuckItems.length} item(s) atascado(s) en procesamiento
          </h3>
          <p className="mt-1 text-sm text-red-700">
            Estos items llevan más de 5 minutos en estado &quot;processing&quot;. Puede ser un worker muerto o timeout.
          </p>
          <div className="mt-3 space-y-2">
            {stuckItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded bg-white px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-mono text-xs">{item.id.slice(0, 8)}...</span>
                  {item.trace_id && (
                    <span className="ml-2 text-muted-foreground">
                      trace: {item.trace_id.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRequeue(item.id)}
                  disabled={isRequeuing === item.id}
                  className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isRequeuing === item.id ? '...' : 'Requeue'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
