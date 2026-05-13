'use client'

import { useState, useCallback } from 'react'
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { StatusBadge } from './StatusBadge'
import { AlertBanner } from './AlertBanner'
import { getQueueItems, retryQueueItem, cancelQueueItem, type QueueStats } from '@/actions/notifications/queue'
import type { NotificationQueueItem, QueueItemStatus } from '@/types/notifications'

const STATUS_FILTERS: { value: QueueItemStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'sent', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'failed', label: 'Fallido' },
  { value: 'failed_permanently', label: 'Fallido perm.' },
]

interface TabQueueProps {
  organizationId: string
}

export function TabQueue({ organizationId }: TabQueueProps) {
  const COLORS = useThemeColors()
  const [items, setItems] = useState<NotificationQueueItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState<QueueItemStatus | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const limit = 20

  const loadItems = useCallback(async (pageNum: number, status: QueueItemStatus | 'all') => {
    setLoading(true)
    const result = await getQueueItems(organizationId, {
      page: pageNum,
      limit,
      status: status === 'all' ? undefined : status,
    })

    if (result.success && result.data) {
      setItems(result.data.items)
      setTotal(result.data.total)
      setTotalPages(result.data.totalPages)
      setPage(pageNum)
    }
    setLoading(false)
  }, [organizationId])

  const handleStatusChange = (status: QueueItemStatus | 'all') => {
    setStatusFilter(status)
    setPage(1)
    loadItems(1, status)
  }

  const handleRetry = async (itemId: string) => {
    setActionLoading(itemId)
    const result = await retryQueueItem(itemId)
    setActionLoading(null)

    if (result.success) {
      setToast({ type: 'success', message: 'Mensaje reintentado' })
      loadItems(page, statusFilter)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al reintentar' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const handleCancel = async (itemId: string) => {
    setActionLoading(itemId)
    const result = await cancelQueueItem(itemId)
    setActionLoading(null)

    if (result.success) {
      setToast({ type: 'success', message: 'Mensaje cancelado' })
      loadItems(page, statusFilter)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al cancelar' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const maskAddress = (address: string) => {
    if (address.includes('@')) {
      const [user, domain] = address.split('@')
      return `${user.slice(0, 2)}***@${domain}`
    }
    const phone = address.replace(/\D/g, '')
    return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} *** ${phone.slice(-4)}`
  }

  const templateTypeMap: Record<string, string> = {
    appointment_confirmation: 'Confirmación',
    appointment_reminder: 'Recordatorio',
    appointment_cancelled: 'Cancelación',
    appointment_completed: 'Completado',
    confirmation_requested: 'Solicitud confirmación',
  }

  return (
    <div className="space-y-4">
      {toast && (
        <AlertBanner
          type={toast.type}
          message={toast.message}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleStatusChange(filter.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: statusFilter === filter.value ? COLORS.primaryGradient : COLORS.surfaceSubtle,
              color: statusFilter === filter.value ? '#FFFFFF' : COLORS.textSecondary,
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: COLORS.textMuted }} />
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              No se encontraron mensajes
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: COLORS.surfaceSubtle }}>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Destinatario
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Tipo
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Estado
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Intentos
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Error
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Fecha
                    </th>
                    <th
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide"
                      style={{ color: COLORS.textMuted }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors"
                      style={{ backgroundColor: COLORS.surface }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-medium"
                          style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {maskAddress(item.toAddress)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                          {templateTypeMap[item.variables?.templateType as string] || item.templateId?.slice(0, 8) || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                          {item.attempts}/{item.maxAttempts}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {item.lastError ? (
                          <span
                            className="text-xs truncate block"
                            style={{ color: COLORS.error }}
                            title={item.lastError}
                          >
                            {item.lastError.length > 40 ? `${item.lastError.slice(0, 40)}...` : item.lastError}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                          {formatDate(item.scheduledAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(item.id)}
                              disabled={actionLoading === item.id}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: COLORS.primary }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                              title="Reintentar"
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(item.id)}
                              disabled={actionLoading === item.id}
                              className="p-1.5 rounded-lg transition-colors"
                              style={{ color: COLORS.error }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.errorLight }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                              title="Cancelar"
                            >
                              {actionLoading === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3 border-t"
                style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
              >
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {total} mensajes en total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadItems(page - 1, statusFilter)}
                    disabled={page <= 1}
                    className="p-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ color: COLORS.primary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => loadItems(page + 1, statusFilter)}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ color: COLORS.primary }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.primarySubtle }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}