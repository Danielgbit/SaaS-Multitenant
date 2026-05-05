'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useThemeColors } from '@/hooks/useThemeColors'

function useColors() {
  return useThemeColors()
}
}

interface PurgeModalProps {
  organizationId: string
  initialTab?: 'selection' | 'days'
  onClose: () => void
  onSuccess?: (deletedCount: number) => void
}

export function PurgeModal({ organizationId, initialTab = 'selection', onClose, onSuccess }: PurgeModalProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'selection' | 'days'>(initialTab)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'completed' | 'cancelled' | 'no_show' | 'all'>('all')
  const [appointmentsList, setAppointmentsList] = useState<PurgeCandidate[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [listLoading, setListLoading] = useState(false)

  const [purgePreviewDays, setPurgePreviewDays] = useState('')
  const [purgePreview, setPurgePreview] = useState<{
    count: number
    oldestDate: string | null
    candidates: PurgeCandidate[]
  } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const [confirmText, setConfirmText] = useState('')
  const [purging, setPurging] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadAppointments = useCallback(async () => {
    setListLoading(true)
    try {
      const results = await getAppointmentsByFilters(organizationId, {
        search: searchQuery,
        status: statusFilter,
        limit: 200,
      })
      setAppointmentsList(results)
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar citas' })
    }
    setListLoading(false)
  }, [organizationId, searchQuery, statusFilter])

  useEffect(() => {
    if (activeTab === 'selection') {
      loadAppointments()
    }
  }, [activeTab, loadAppointments])

  useEffect(() => {
    if (!searchQuery) return
    const timer = setTimeout(() => {
      loadAppointments()
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, loadAppointments])

  function handleStatusFilterChange(status: typeof statusFilter) {
    setStatusFilter(status)
  }

  function toggleAppointment(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === appointmentsList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(appointmentsList.map(a => a.id)))
    }
  }

  function handleClearSelection() {
    setSelectedIds(new Set())
  }

  async function handlePreviewPurge() {
    const days = parseInt(purgePreviewDays, 10)
    if (isNaN(days) || days < 1 || days > 365) {
      setMessage({ type: 'error', text: 'Ingresa un número válido de días (1-365)' })
      return
    }

    setPreviewLoading(true)
    const result = await purgeAppointments(organizationId, days, true)

    if (result.success) {
      setPurgePreview({
        count: result.count || 0,
        oldestDate: result.oldestDate ?? null,
        candidates: (result.candidates || []) as any,
      })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al previsualizar' })
    }

    setPreviewLoading(false)
  }

  async function handleDeleteSelected() {
    if (confirmText !== 'ELIMINAR') {
      setMessage({ type: 'error', text: 'Escribe ELIMINAR para confirmar' })
      return
    }

    setPurging(true)
    setMessage(null)

    const result = await deleteAppointmentsByIds(organizationId, [...selectedIds])

    if (result.success) {
      setMessage({
        type: 'success',
        text: `${result.deletedCount || 0} citas eliminadas correctamente`
      })
      onSuccess?.(result.deletedCount || 0)
      setTimeout(() => onClose(), 1500)
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al eliminar' })
    }

    setPurging(false)
  }

  async function handleExecutePurge() {
    if (confirmText !== 'ELIMINAR') {
      setMessage({ type: 'error', text: 'Escribe ELIMINAR para confirmar' })
      return
    }

    const days = parseInt(purgePreviewDays, 10)
    setPurging(true)
    setMessage(null)

    const result = await purgeAppointments(organizationId, days, false)

    if (result.success) {
      setMessage({
        type: 'success',
        text: `${result.deletedCount || 0} citas eliminadas correctamente`
      })
      onSuccess?.(result.deletedCount || 0)
      setTimeout(() => onClose(), 1500)
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al purgar' })
    }

    setPurging(false)
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistió',
    }
    return labels[status] || status
  }

  function getStatusColor(status: string): { bg: string; text: string } {
    const colors: Record<string, { bg: string; text: string }> = {
      completed: { bg: COLORS.success + '20', text: COLORS.success },
      cancelled: { bg: COLORS.error + '20', text: COLORS.error },
      no_show: { bg: COLORS.warning + '20', text: COLORS.warning },
    }
    return colors[status] || { bg: COLORS.textMuted + '20', text: COLORS.textMuted }
  }

  if (!mounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.overlay }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.warning + '15' }}
            >
              <Trash2 className="w-5 h-5" style={{ color: COLORS.warning }} />
            </div>
            <h3
              className="text-xl font-semibold"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: COLORS.textPrimary
              }}
            >
              Limpiar citas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
            style={{ color: COLORS.textMuted }}
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          <button
            onClick={() => setActiveTab('selection')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: activeTab === 'selection' ? COLORS.primary : COLORS.surfaceSubtle,
              color: activeTab === 'selection' ? '#FFFFFF' : COLORS.textSecondary,
            }}
          >
            <Check className="w-4 h-4" />
            Por selección
            {appointmentsList.length > 0 && (
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: activeTab === 'selection' ? 'rgba(255,255,255,0.2)' : COLORS.primary + '20',
                  color: activeTab === 'selection' ? '#FFFFFF' : COLORS.primary,
                }}
              >
                {appointmentsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: activeTab === 'days' ? COLORS.primary : COLORS.surfaceSubtle,
              color: activeTab === 'days' ? '#FFFFFF' : COLORS.textSecondary,
            }}
          >
            <Calendar className="w-4 h-4" />
            Por fecha
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'selection' ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: COLORS.textMuted }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre de cliente o empleado..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                  </button>
                )}
              </div>

              {/* Status Filters */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'completed', label: 'Completadas' },
                  { value: 'cancelled', label: 'Canceladas' },
                  { value: 'no_show', label: 'No asistió' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusFilterChange(option.value as typeof statusFilter)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      backgroundColor: statusFilter === option.value ? COLORS.primary : 'transparent',
                      color: statusFilter === option.value ? '#FFFFFF' : COLORS.textSecondary,
                      border: `1px solid ${statusFilter === option.value ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* List */}
              {listLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.primary }} />
                </div>
              ) : appointmentsList.length === 0 ? (
                <div
                  className="text-center py-8 rounded-xl"
                  style={{ backgroundColor: COLORS.surfaceSubtle }}
                >
                  <p style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    No hay citas para limpiar
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: COLORS.border }}
                >
                  {appointmentsList.map((apt, idx) => {
                    const isSelected = selectedIds.has(apt.id)
                    const statusColors = getStatusColor(apt.status)
                    return (
                      <div
                        key={apt.id}
                        onClick={() => toggleAppointment(apt.id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors duration-200 ${
                          idx !== appointmentsList.length - 1 ? 'border-b' : ''
                        }`}
                        style={{
                          borderColor: COLORS.border,
                          backgroundColor: isSelected ? COLORS.primary + '10' : 'transparent',
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={{
                            borderColor: isSelected ? COLORS.primary : COLORS.border,
                            backgroundColor: isSelected ? COLORS.primary : 'transparent',
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: COLORS.textPrimary }}>
                            {apt.client_name || 'Cliente'}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            {apt.employee_name && `${apt.employee_name} · `}
                            {formatDate(apt.end_time)}
                          </p>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                          style={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                          }}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Eliminar citas anteriores a (días):
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={purgePreviewDays}
                    onChange={(e) => {
                      setPurgePreviewDays(e.target.value)
                      setPurgePreview(null)
                    }}
                    placeholder="Ej: 90"
                    className="flex-1 px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  />
                  <button
                    onClick={handlePreviewPurge}
                    disabled={!purgePreviewDays || previewLoading}
                    className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      backgroundColor: COLORS.surfaceSubtle,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Previsualizar'}
                  </button>
                </div>
              </div>

              {purgePreview && (
                <div
                  className="space-y-4 p-4 rounded-xl"
                  style={{ backgroundColor: COLORS.surfaceSubtle }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium"
                      style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Citas a eliminar:
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: COLORS.warning, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {purgePreview.count}
                    </span>
                  </div>
                  {purgePreview.oldestDate && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.textMuted }}>
                      <Calendar className="w-4 h-4" />
                      <span>Más antigua: {formatDate(purgePreview.oldestDate)}</span>
                    </div>
                  )}

                  {purgePreview.candidates.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {purgePreview.candidates.map((apt) => {
                        const statusColors = getStatusColor(apt.status)
                        return (
                          <div
                            key={apt.id}
                            className="flex items-center justify-between p-2 rounded-lg text-sm"
                            style={{ backgroundColor: COLORS.surface }}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate" style={{ color: COLORS.textPrimary }}>
                                {apt.client_name || 'Cliente'}
                              </p>
                              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                {formatDate(apt.end_time)}
                              </p>
                            </div>
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.text,
                              }}
                            >
                              {getStatusLabel(apt.status)}
                            </span>
                          </div>
                        )
                      })}
                      {purgePreview.count > purgePreview.candidates.length && (
                        <p className="text-xs text-center" style={{ color: COLORS.textMuted }}>
                          y {purgePreview.count - purgePreview.candidates.length} más...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selection Actions (only for selection tab) */}
        {activeTab === 'selection' && (
          <div
            className="flex items-center justify-between px-6 py-3 border-t"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{ color: COLORS.primary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {selectedIds.size === appointmentsList.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-sm font-medium transition-colors duration-200 cursor-pointer"
                  style={{ color: COLORS.textMuted, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Limpiar
                </button>
              )}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Confirmation Input */}
        {((selectedIds.size > 0 && activeTab === 'selection') || (purgePreview && activeTab === 'days')) && confirmText !== 'ELIMINAR' && (
          <div
            className="px-6 py-4 border-t space-y-3"
            style={{ borderColor: COLORS.border }}
          >
            <p
              className="text-sm"
              style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {activeTab === 'selection' ? (
                <>Escribe <strong>ELIMINAR</strong> para confirmar la eliminación de {selectedIds.size} cita{selectedIds.size !== 1 ? 's' : ''}:</>
              ) : (
                <>Escribe <strong>ELIMINAR</strong> para confirmar:</>
              )}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="ELIMINAR"
              className="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4 border-t"
          style={{ borderColor: COLORS.border }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 font-medium rounded-xl transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textPrimary,
            }}
          >
            Cancelar
          </button>
          {activeTab === 'selection' ? (
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || confirmText !== 'ELIMINAR' || purging}
              className="flex-1 py-3 px-4 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                backgroundColor: confirmText === 'ELIMINAR' && selectedIds.size > 0 ? COLORS.error : COLORS.surfaceSubtle,
                color: confirmText === 'ELIMINAR' && selectedIds.size > 0 ? '#FFFFFF' : COLORS.textMuted,
              }}
            >
              {purging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              {selectedIds.size > 0 ? `Eliminar ${selectedIds.size}` : 'Eliminar'}
            </button>
          ) : (
            <button
              onClick={handleExecutePurge}
              disabled={confirmText !== 'ELIMINAR' || purging || !purgePreview}
              className="flex-1 py-3 px-4 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                backgroundColor: confirmText === 'ELIMINAR' ? COLORS.error : COLORS.surfaceSubtle,
                color: confirmText === 'ELIMINAR' ? '#FFFFFF' : COLORS.textMuted,
              }}
            >
              {purging ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

interface OpenPurgeModalOptions {
  organizationId: string
  initialTab?: 'selection' | 'days'
}

let openPurgeModalFn: ((options: OpenPurgeModalOptions) => void) | null = null

export function openPurgeModal(options: OpenPurgeModalOptions) {
  openPurgeModalFn?.(options)
}

export function registerPurgeModalHandler(handler: (options: OpenPurgeModalOptions) => void) {
  openPurgeModalFn = handler
}