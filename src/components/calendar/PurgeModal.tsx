'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X, Check, Calendar, Search } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { PurgeCandidate } from '@/lib/cleanup-helpers'
import { getAppointmentsByFilters } from '@/lib/cleanup-helpers'
import { purgeAppointments, deleteAppointmentsByIds } from '@/actions/appointments/purgeAppointments'

interface PurgeModalProps {
  organizationId: string
  initialTab?: 'selection' | 'days'
  onClose: () => void
  onSuccess?: (deletedCount: number) => void
}

export function PurgeModal({ organizationId, initialTab = 'selection', onClose, onSuccess }: PurgeModalProps) {
  const COLORS = useThemeColors()
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: COLORS.surface,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* ── Header with gradient ── */}
        <div
          className="px-5 sm:px-6 py-4 sm:py-5 relative overflow-hidden flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
            color: '#FFF',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3
                    className="text-xl font-semibold font-heading"
                  >
                    Limpiar citas
                  </h3>
                  <p className="text-xs text-white/70">
                    Elimina citas completadas, canceladas o no asistidas
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex px-5 sm:px-6 pt-4 sm:pt-5 gap-2 border-b" style={{ borderColor: COLORS.border }}>
          <button
            onClick={() => setActiveTab('selection')}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              color: activeTab === 'selection' ? COLORS.primary : COLORS.textMuted,
              borderBottom: activeTab === 'selection' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <Check className="w-4 h-4" />
            Por selección
            {appointmentsList.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: activeTab === 'selection' ? COLORS.primary + '15' : COLORS.surfaceSubtle,
                  color: activeTab === 'selection' ? COLORS.primary : COLORS.textMuted,
                }}
              >
                {appointmentsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('days')}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              color: activeTab === 'days' ? COLORS.primary : COLORS.textMuted,
              borderBottom: activeTab === 'days' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            <Calendar className="w-4 h-4" />
            Por fecha
          </button>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 sm:p-6 space-y-4">
            {activeTab === 'selection' ? (
              <>
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: COLORS.textMuted }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nombre de cliente o empleado..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-all duration-200 focus:outline-none"
                    style={{
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.surface,
                      color: COLORS.textPrimary,
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-black/5 transition-colors"
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
                        backgroundColor: statusFilter === option.value ? COLORS.primary : COLORS.surfaceSubtle,
                        color: statusFilter === option.value ? '#FFF' : COLORS.textSecondary,
                        border: `1px solid ${statusFilter === option.value ? COLORS.primary : 'transparent'}`,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Appointment List */}
                {listLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner size="md" style={{ color: COLORS.primary }} />
                  </div>
                ) : appointmentsList.length === 0 ? (
                  <div className="text-center py-10">
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: COLORS.surfaceSubtle }}
                    >
                      <Trash2 className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                      No hay citas para limpiar
                    </p>
                    <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                      Las citas completadas, canceladas o no asistidas aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {appointmentsList.map((apt, idx) => {
                      const isSelected = selectedIds.has(apt.id)
                      const statusColors = getStatusColor(apt.status)
                      const initial = (apt.client_name || 'C').charAt(0).toUpperCase()
                      return (
                        <div
                          key={apt.id}
                          onClick={() => toggleAppointment(apt.id)}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
                          style={{
                            backgroundColor: isSelected ? COLORS.primary + '08' : 'transparent',
                            border: `1px solid ${isSelected ? COLORS.primary + '20' : 'transparent'}`,
                          }}
                        >
                          {/* Custom Checkbox */}
                          <div
                            className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={{
                              borderColor: isSelected ? COLORS.primary : COLORS.border,
                              backgroundColor: isSelected ? COLORS.primary : 'transparent',
                            }}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                            style={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.text,
                            }}
                          >
                            {initial}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate" style={{ color: COLORS.textPrimary }}>
                              {apt.client_name || 'Cliente'}
                            </p>
                            <p className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                              {apt.employee_name && <>{apt.employee_name} · </>}
                              {formatDate(apt.end_time)}
                            </p>
                          </div>

                          {/* Status badge */}
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium flex-shrink-0"
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
              </>
            ) : (
              /* ── By Days Tab ── */
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Eliminar citas anteriores a (días):
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Calendar
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: COLORS.textMuted }}
                      />
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
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-all duration-200 focus:outline-none"
                        style={{
                          borderColor: COLORS.border,
                          backgroundColor: COLORS.surface,
                          color: COLORS.textPrimary,
                        }}
                      />
                    </div>
                    <button
                      onClick={handlePreviewPurge}
                      disabled={!purgePreviewDays || previewLoading}
                      className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                      style={{
                        backgroundColor: COLORS.primary,
                        color: '#FFF',
                        boxShadow: `0 4px 12px ${COLORS.primary}30`,
                      }}
                    >
                      {previewLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      {previewLoading ? 'Buscando...' : 'Previsualizar'}
                    </button>
                  </div>
                </div>

                {purgePreview && (
                  <div
                    className="rounded-xl border-2 p-4 space-y-3 animate-in fade-in duration-200"
                    style={{
                      borderColor: COLORS.warning + '30',
                      backgroundColor: COLORS.warningLight,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                        Citas a eliminar
                      </span>
                      <span
                        className="text-xl font-bold"
                        style={{ color: COLORS.warning }}
                      >
                        {purgePreview.count}
                      </span>
                    </div>

                    {purgePreview.oldestDate && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.textSecondary }}>
                        <Calendar className="w-4 h-4" />
                        <span>Más antigua: {formatDate(purgePreview.oldestDate)}</span>
                      </div>
                    )}

                    {purgePreview.candidates.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 mt-2">
                        {purgePreview.candidates.map((apt) => {
                          const statusColors = getStatusColor(apt.status)
                          return (
                            <div
                              key={apt.id}
                              className="flex items-center justify-between p-2.5 rounded-lg text-sm"
                              style={{ backgroundColor: COLORS.surface }}
                            >
                              <div className="min-w-0 flex-1 flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: statusColors.text }}
                                />
                                <div>
                                  <p className="font-medium truncate text-sm" style={{ color: COLORS.textPrimary }}>
                                    {apt.client_name || 'Cliente'}
                                  </p>
                                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                                    {formatDate(apt.end_time)}
                                  </p>
                                </div>
                              </div>
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ml-2"
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
                          <p className="text-xs text-center pt-1" style={{ color: COLORS.textMuted }}>
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
        </div>

        {/* ── Selection Actions (selection tab only) ── */}
        {activeTab === 'selection' && (
          <div
            className="flex items-center justify-between px-5 sm:px-6 py-3 border-t flex-shrink-0"
            style={{
              borderColor: COLORS.border,
              backgroundColor: COLORS.surfaceSubtle,
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-sm font-medium transition-colors duration-200 cursor-pointer hover:opacity-70"
                style={{ color: COLORS.primary }}
              >
                {selectedIds.size === appointmentsList.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-sm transition-colors duration-200 cursor-pointer hover:opacity-70"
                  style={{ color: COLORS.textMuted }}
                >
                  Limpiar selección
                </button>
              )}
            </div>
            <span className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
              {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* ── Confirmation Input ── */}
        {((selectedIds.size > 0 && activeTab === 'selection') || (purgePreview && activeTab === 'days')) && confirmText !== 'ELIMINAR' && (
          <div
            className="px-5 sm:px-6 py-4 border-t space-y-3 flex-shrink-0"
            style={{ borderColor: COLORS.border }}
          >
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              {activeTab === 'selection' ? (
                <>Escribe <strong className="font-bold" style={{ color: COLORS.error }}>ELIMINAR</strong> para confirmar la eliminación de {selectedIds.size} cita{selectedIds.size !== 1 ? 's' : ''}:</>
              ) : (
                <>Escribe <strong className="font-bold" style={{ color: COLORS.error }}>ELIMINAR</strong> para confirmar:</>
              )}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="ELIMINAR"
              className="w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium tracking-widest text-center transition-all duration-200 focus:outline-none"
              style={{
                borderColor: confirmText === 'ELIMINAR' ? COLORS.success : COLORS.border,
                backgroundColor: COLORS.surface,
                color: confirmText === 'ELIMINAR' ? COLORS.success : COLORS.textPrimary,
                boxShadow: confirmText === 'ELIMINAR' ? `0 0 0 3px ${COLORS.success}20` : 'none',
              }}
            />
          </div>
        )}

        {/* ── Footer Actions ── */}
        <div
          className="flex gap-3 px-5 sm:px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: COLORS.border, backgroundColor: COLORS.surfaceSubtle }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
            }}
          >
            Cancelar
          </button>
          {activeTab === 'selection' ? (
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || confirmText !== 'ELIMINAR' || purging}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: confirmText === 'ELIMINAR' && selectedIds.size > 0 ? COLORS.error : COLORS.surface,
                color: confirmText === 'ELIMINAR' && selectedIds.size > 0 ? '#FFF' : COLORS.textMuted,
                border: confirmText !== 'ELIMINAR' || selectedIds.size === 0 ? `1px solid ${COLORS.border}` : 'none',
                boxShadow: confirmText === 'ELIMINAR' && selectedIds.size > 0 ? `0 4px 12px ${COLORS.error}40` : 'none',
              }}
            >
              {purging ? (
                <Spinner size="sm" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {purging ? 'Eliminando...' : selectedIds.size > 0 ? `Eliminar ${selectedIds.size}` : 'Eliminar'}
            </button>
          ) : (
            <button
              onClick={handleExecutePurge}
              disabled={confirmText !== 'ELIMINAR' || purging || !purgePreview}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                backgroundColor: confirmText === 'ELIMINAR' ? COLORS.error : COLORS.surface,
                color: confirmText === 'ELIMINAR' ? '#FFF' : COLORS.textMuted,
                border: confirmText !== 'ELIMINAR' ? `1px solid ${COLORS.border}` : 'none',
                boxShadow: confirmText === 'ELIMINAR' ? `0 4px 12px ${COLORS.error}40` : 'none',
              }}
            >
              {purging ? (
                <Spinner size="sm" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {purging ? 'Eliminando...' : 'Eliminar'}
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