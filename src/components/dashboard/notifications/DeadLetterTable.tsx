'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, RotateCcw, Trash2, Eye } from 'lucide-react'
import { replayDeadLetterAction } from '@/actions/admin/replayDeadLetter'
import { discardDeadLetterAction } from '@/actions/admin/discardDeadLetter'

interface DeadLetter {
  id: string
  original_queue_id: string
  organization_id: string
  channel: string
  to_address?: string
  rendered_body?: string
  subject?: string
  variables: Record<string, string>
  last_error?: string
  error_code?: string
  attempts: number
  moved_at: string
  replay_status: 'pending' | 'replayed' | 'discarded'
  replayed_at?: string
  trace_id?: string
  metadata: Record<string, unknown>
}

interface DeadLetterTableProps {
  deadLetters: DeadLetter[]
}

export function DeadLetterTable({ deadLetters }: DeadLetterTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedPayload, setExpandedPayload] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReplay = (dlqId: string) => {
    setActionId(dlqId)
    startTransition(async () => {
      try {
        await replayDeadLetterAction(dlqId)
        router.refresh()
      } catch (error) {
        console.error('Failed to replay:', error)
        alert('Error al reintentar. Intente nuevamente.')
      } finally {
        setActionId(null)
      }
    })
  }

  const handleDiscard = (dlqId: string) => {
    setActionId(dlqId)
    startTransition(async () => {
      try {
        await discardDeadLetterAction(dlqId)
        router.refresh()
      } catch (error) {
        console.error('Failed to discard:', error)
        alert('Error al descartar. Intente nuevamente.')
      } finally {
        setActionId(null)
      }
    })
  }

  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Canal</th>
              <th className="px-4 py-3 text-left">Destinatario</th>
              <th className="px-4 py-3 text-left">Error</th>
              <th className="px-4 py-3 text-left">Intentos</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">IDs</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {deadLetters.map((dl) => (
              <tr key={dl.id} className="border-t">
                <td className="px-4 py-3">
                  {new Date(dl.moved_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{dl.channel}</td>
                <td className="px-4 py-3 font-mono text-xs">{dl.to_address || '-'}</td>
                <td className="px-4 py-3 max-w-xs truncate" title={dl.last_error}>
                  {dl.last_error || '-'}
                </td>
                <td className="px-4 py-3">{dl.attempts}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      dl.replay_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : dl.replay_status === 'replayed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {dl.replay_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleCopy(dl.id, `dl-${dl.id}`)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === `dl-${dl.id}` ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      DL: {dl.id.slice(0, 8)}...
                    </button>
                    {dl.trace_id && (
                      <button
                        onClick={() => handleCopy(dl.trace_id!, `trace-${dl.id}`)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copiedId === `trace-${dl.id}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Trace: {dl.trace_id.slice(0, 8)}...
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {dl.replay_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReplay(dl.id)}
                          disabled={isPending && actionId === dl.id}
                          className="rounded bg-blue-600 p-1 text-white hover:bg-blue-700 disabled:opacity-50"
                          title="Reintentar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDiscard(dl.id)}
                          disabled={isPending && actionId === dl.id}
                          className="rounded bg-gray-600 p-1 text-white hover:bg-gray-700 disabled:opacity-50"
                          title="Descartar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        setExpandedPayload(expandedPayload === dl.id ? null : dl.id)
                      }
                      className="rounded bg-muted p-1 hover:bg-muted/80"
                      title="Ver payload"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {expandedPayload && (
              <tr>
                <td colSpan={8} className="border-t bg-muted p-4">
                  <pre className="max-h-64 overflow-auto text-xs">
                    {JSON.stringify(
                      deadLetters.find((dl) => dl.id === expandedPayload),
                      null,
                      2
                    )}
                  </pre>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {deadLetters.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No hay dead letters pendientes
        </div>
      )}
    </div>
  )
}
