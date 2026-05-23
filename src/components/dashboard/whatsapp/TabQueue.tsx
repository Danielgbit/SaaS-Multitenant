'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, RefreshCw, X, ChevronLeft, ChevronRight, Inbox, CheckSquare, Square, AlertCircle, RotateCcw, Ban } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from './StatusBadge'
import { AlertBanner } from './AlertBanner'
import { getQueueItems, getQueueStats, retryQueueItem, cancelQueueItem, retryMultipleQueueItems, cancelMultipleQueueItems, type QueueStats } from '@/actions/notifications/queue'
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

function SkeletonRow() {
  return (
    <tr>
      <td className="px-4 py-3"><Skeleton variant="circular" width="w-4" height="h-4" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" width="w-32" height="h-4" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" width="w-20" height="h-4" /></td>
      <td className="px-4 py-3"><Skeleton variant="rectangular" width="w-16" height="h-5" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" width="w-12" height="h-4" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" width="w-28" height="h-4" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" width="w-20" height="h-4" /></td>
      <td className="px-4 py-3"><Skeleton variant="text" width="w-16" height="h-4" /></td>
    </tr>
  )
}

export function TabQueue({ organizationId }: TabQueueProps) {
  const COLORS = useThemeColors()
  const [items, setItems] = useState<NotificationQueueItem[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState<QueueItemStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const limit = 20

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const loadItems = useCallback(async (pageNum: number, status: QueueItemStatus | 'all') => {
    setLoading(true)
    const [itemsResult, statsResult] = await Promise.all([
      getQueueItems(organizationId, {
        page: pageNum,
        limit,
        status: status === 'all' ? undefined : status,
      }),
      getQueueStats(organizationId),
    ])

    if (itemsResult.success && itemsResult.data) {
      setItems(itemsResult.data.items)
      setTotal(itemsResult.data.total)
      setTotalPages(itemsResult.data.totalPages)
      setPage(pageNum)
      setLastUpdated(new Date())
    }
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data)
    }
    setLoading(false)
  }, [organizationId])

  const handleStatusChange = (status: QueueItemStatus | 'all') => {
    setStatusFilter(status)
    setPage(1)
    setSelectedIds(new Set())
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

  const handleBulkRetry = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    const result = await retryMultipleQueueItems(Array.from(selectedIds))
    setBulkLoading(false)

    if (result.success) {
      setToast({ type: 'success', message: `${selectedIds.size} mensaje(s) reintentado(s)` })
      setSelectedIds(new Set())
      loadItems(page, statusFilter)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al reintentar' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const handleBulkCancel = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    const result = await cancelMultipleQueueItems(Array.from(selectedIds))
    setBulkLoading(false)

    if (result.success) {
      setToast({ type: 'success', message: `${selectedIds.size} mensaje(s) cancelado(s)` })
      setSelectedIds(new Set())
      loadItems(page, statusFilter)
    } else {
      setToast({ type: 'error', message: result.error || 'Error al cancelar' })
    }
    setTimeout(() => setToast(null), 3000)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const getFilteredItems = () => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter((item) => {
      const masked = maskAddress(item.toAddress).toLowerCase()
      const template = templateTypeMap[item.variables?.templateType as string] || ''
      return masked.includes(q) || template.toLowerCase().includes(q)
    })
  }

  const filteredItems = getFilteredItems()

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

  const formatLastUpdated = (date: Date, now: number) => {
    const diffSec = Math.floor((now - date.getTime()) / 1000)
    if (diffSec < 10) return 'Ahora mismo'
    if (diffSec < 60) return `Hace ${diffSec}s`
    return `Hace ${Math.floor(diffSec / 60)}m`
  }

  return (
    <div className="space-y-4">
      {toast && (
        <AlertBanner type={toast.type} message={toast.message} />
      )}

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: COLORS.border }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{ backgroundColor: COLORS.surfaceSubtle, borderBottom: `1px solid ${COLORS.border}` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleStatusChange(filter.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: statusFilter === filter.value ? COLORS.primaryGradient : COLORS.surface,
                  color: statusFilter === filter.value ? '#FFFFFF' : COLORS.textSecondary,
                  border: `1px solid ${statusFilter === filter.value ? 'transparent' : COLORS.border}`,
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs" style={{ color: COLORS.textMuted }}>
                Actualizado {formatLastUpdated(lastUpdated, now)}
              </span>
            )}
            <button
              onClick={() => loadItems(page, statusFilter)}
              className="p-2 rounded-lg transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/20"
              style={{ color: COLORS.primary }}
              aria-label="Actualizar cola"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="px-4 py-2.5 flex items-center gap-3" style={{ backgroundColor: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar destinatario..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border outline-none transition-colors"
              style={{
                backgroundColor: COLORS.surfaceSubtle,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
            />
          </div>
          {stats && (
            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: COLORS.textMuted }}>
                <span className="font-semibold" style={{ color: COLORS.textSecondary }}>{total}</span> total
              </span>
              <span style={{ color: COLORS.textMuted }}>
                <span className="font-semibold" style={{ color: COLORS.warning }}>{stats.pending}</span> pendientes
              </span>
              <span style={{ color: COLORS.textMuted }}>
                <span className="font-semibold" style={{ color: COLORS.error }}>{stats.failedToday}</span> fallidos
              </span>
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ backgroundColor: COLORS.primarySubtle, borderColor: COLORS.border }}
          >
            <span className="text-sm font-medium" style={{ color: COLORS.primary }}>
              {selectedIds.size} seleccionado(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkRetry}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: COLORS.primary, color: '#FFFFFF' }}
              >
                {bulkLoading ? <Spinner size="sm" className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                Reintentar
              </button>
              <button
                onClick={handleBulkCancel}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: COLORS.error, color: '#FFFFFF' }}
              >
                {bulkLoading ? <Spinner size="sm" className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                Cancelar
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: COLORS.textMuted }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <th className="px-4 py-2.5 text-left w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    style={{ color: COLORS.textMuted }}
                  >
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-4 h-4" style={{ color: COLORS.primary }} />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Destinatario
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Tipo
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Estado
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Intentos
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Error
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Fecha
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: COLORS.border }}>
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
                </>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <EmptyState
                      icon={
                        statusFilter === 'failed' ? (
                          <AlertCircle className="w-7 h-7" style={{ color: COLORS.error }} />
                        ) : statusFilter === 'pending' ? (
                          <Inbox className="w-7 h-7" style={{ color: COLORS.warning }} />
                        ) : searchQuery ? (
                          <Search className="w-7 h-7" style={{ color: COLORS.textMuted }} />
                        ) : (
                          <Inbox className="w-7 h-7" style={{ color: COLORS.textMuted }} />
                        )
                      }
                      title={searchQuery ? 'Sin resultados' : 'La cola está vacía'}
                      description={
                        searchQuery
                          ? `No hay mensajes que coincidan con "${searchQuery}"`
                          : statusFilter !== 'all'
                          ? `No hay mensajes con estado "${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}"`
                          : 'Los mensajes enviados aparecerán aquí'
                      }
                      action={
                        searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-xs font-medium"
                            style={{ color: COLORS.primary }}
                          >
                            Limpiar búsqueda
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id)
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors"
                      style={{ backgroundColor: isSelected ? COLORS.primarySubtle : COLORS.surface }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = COLORS.surface }}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelectOne(item.id)}
                          className="p-1 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" style={{ color: COLORS.primary }} />
                          ) : (
                            <Square className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-medium"
                          style={{ color: COLORS.textPrimary }}
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
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-medium ${item.attempts >= item.maxAttempts ? 'opacity-50' : ''}`}
                            style={{ color: item.attempts >= item.maxAttempts ? COLORS.error : COLORS.textSecondary }}
                          >
                            {item.attempts}/{item.maxAttempts}
                          </span>
                          {item.attempts >= item.maxAttempts && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.error }} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {item.lastError ? (
                          <span
                            className="text-xs truncate block"
                            style={{ color: COLORS.error }}
                            title={item.lastError}
                          >
                            {item.lastError.length > 35 ? `${item.lastError.slice(0, 35)}...` : item.lastError}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: COLORS.textMuted }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                            {formatDate(item.scheduledAt)}
                          </span>
                          {item.status === 'processing' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: COLORS.info }} />
                              <span className="text-xs" style={{ color: COLORS.info }}>Procesando...</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(item.id)}
                              disabled={actionLoading === item.id}
                              className="p-1.5 rounded-lg transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/20"
                              style={{ color: COLORS.primary }}
                              aria-label="Reintentar mensaje"
                            >
                              {actionLoading === item.id ? (
                                <Spinner size="sm" className="w-3.5 h-3.5" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(item.id)}
                              disabled={actionLoading === item.id}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/20"
                              style={{ color: COLORS.error }}
                              aria-label="Cancelar mensaje"
                            >
                              {actionLoading === item.id ? (
                                <Spinner size="sm" className="w-3.5 h-3.5" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
          >
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {total} mensajes en total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadItems(page - 1, statusFilter)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-sky-100 dark:hover:bg-sky-900/20"
                style={{ color: COLORS.primary }}
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadItems(page + 1, statusFilter)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-sky-100 dark:hover:bg-sky-900/20"
                style={{ color: COLORS.primary }}
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}