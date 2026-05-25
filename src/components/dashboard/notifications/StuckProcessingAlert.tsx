'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Spinner } from '@/components/ui'

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border border-l-4 p-4 shadow-sm"
      style={{
        borderColor: 'hsl(var(--border))',
        borderLeftColor: 'hsl(var(--error))',
        backgroundColor: 'hsl(var(--error) / 0.05)',
        boxShadow: '0 1px 2px hsl(var(--error) / 0.1)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: 'hsl(var(--error))' }} />
        <div className="flex-1">
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--error))' }}>
            {stuckItems.length} item(s) atascado(s) en procesamiento
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'hsl(var(--text-secondary))' }}>
            Estos items llevan más de 5 minutos en estado &quot;processing&quot;. Puede ser un worker muerto o timeout.
          </p>
          <div className="mt-3 space-y-2">
            {stuckItems.slice(0, 5).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center justify-between rounded-lg bg-background px-3 py-2 border"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <div className="text-sm">
                  <span className="font-mono text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                    {item.id.slice(0, 8)}...
                  </span>
                  {item.trace_id && (
                    <span className="ml-2 text-muted-foreground font-mono text-xs">
                      trace: {item.trace_id.slice(0, 8)}...
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRequeue(item.id)}
                  disabled={isRequeuing === item.id}
                  className="rounded-lg px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: 'hsl(var(--error))',
                    color: 'white',
                  }}
                >
                  {isRequeuing === item.id ? (
                    <Spinner size="sm" className="text-white" />
                  ) : (
                    'Requeue'
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
