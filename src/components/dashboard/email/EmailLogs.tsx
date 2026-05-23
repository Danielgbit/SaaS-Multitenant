'use client'

import { useState, useEffect } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Mail, Send, XCircle, Clock, AlertCircle, CheckCircle2, MailOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { getEmailLogs } from '@/actions/email/getEmailLogs'

interface LogEntry {
  id: string
  to_email: string
  email_type: string
  subject: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
  appointment_id: string | null
}

interface EmailLogsProps {
  organizationId: string
}

const emailTypeLabels: Record<string, string> = {
  appointment_confirmation: 'Confirmación',
  appointment_reminder: 'Recordatorio',
  appointment_cancelled: 'Cancelación',
  appointment_completed: 'Completado',
  appointment_no_show: 'No asistencia',
}

export function EmailLogs({ organizationId }: EmailLogsProps) {
  const COLORS = useThemeColors()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  const limit = 15

  useEffect(() => {
    setMounted(true)
    loadLogs()
  }, [organizationId, page])

  const loadLogs = async () => {
    setLoading(true)
    setMessage(null)

    const result = await getEmailLogs({
      organizationId,
      limit: 1000,
      offset: 0,
    })

    if (result.success && result.data) {
      let filteredLogs = result.data
      if (statusFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.status === statusFilter)
      }
      setLogs(filteredLogs.slice(page * limit, (page + 1) * limit))
      setTotal(filteredLogs.length)
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(total / limit)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filterButtons = [
    { key: 'all', label: 'Todos', icon: <Mail className="w-3.5 h-3.5" /> },
    { key: 'sent', label: 'Enviados', icon: <Send className="w-3.5 h-3.5" /> },
    { key: 'failed', label: 'Fallidos', icon: <XCircle className="w-3.5 h-3.5" /> },
    { key: 'pending', label: 'Pendientes', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'sent':
        return { label: 'Enviado', color: COLORS.success, bg: COLORS.successLight, icon: <Send className="w-3 h-3" /> }
      case 'failed':
        return { label: 'Fallido', color: COLORS.error, bg: COLORS.errorLight, icon: <XCircle className="w-3 h-3" /> }
      case 'pending':
        return { label: 'Pendiente', color: COLORS.warning, bg: COLORS.warningLight, icon: <Clock className="w-3 h-3" /> }
      default:
        return { label: status, color: COLORS.textSecondary, bg: COLORS.surfaceSubtle, icon: <Clock className="w-3 h-3" /> }
    }
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <div 
          className="inline-flex gap-1 p-1.5 rounded-xl"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => {
                setStatusFilter(btn.key as typeof statusFilter)
                setPage(0)
                loadLogs()
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
              style={{ 
                backgroundColor: statusFilter === btn.key ? COLORS.surface : 'transparent',
                color: statusFilter === btn.key ? COLORS.primary : COLORS.textSecondary,
                boxShadow: statusFilter === btn.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div 
          className="mb-4 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ 
            backgroundColor: message.type === 'success' ? COLORS.successLight : COLORS.errorLight 
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
          ) : (
            <AlertCircle className="w-5 h-5" style={{ color: COLORS.error }} />
          )}
          <span 
            style={{ 
              color: message.type === 'success' ? COLORS.success : COLORS.error, 
            }}
          >
            {message.text}
          </span>
        </div>
      )}

      {/* Table Card */}
      <div 
        className="rounded-2xl border overflow-hidden"
        style={{ 
          backgroundColor: COLORS.surfaceGlass,
          backdropFilter: 'blur(12px)',
          borderColor: COLORS.border,
          boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)'
        }}
      >
        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" className="mx-auto mb-4" style={{ color: COLORS.primary }} />
            <p style={{ color: COLORS.textMuted }}>Cargando historial...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <div 
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: COLORS.primarySubtle }}
            >
              <Mail className="w-8 h-8" style={{ color: COLORS.primary }} />
            </div>
            <h3 
              className="font-semibold text-lg mb-2"
              style={{ color: COLORS.textPrimary }}
            >
              No hay emails enviados
            </h3>
            <p style={{ color: COLORS.textMuted }}>
              Los emails aparecerán aquí cuando se envíen
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] whitespace-nowrap">
            <thead>
              <tr style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Destinatario
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Tipo
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Asunto
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Estado
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const status = getStatusStyle(log.status)
                return (
                  <tr 
                    key={log.id}
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${COLORS.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.primarySubtle }}
                        >
                          <MailOpen className="w-4 h-4" style={{ color: COLORS.primary }} />
                        </div>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: COLORS.textPrimary }}
                        >
                          {log.to_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {emailTypeLabels[log.email_type] || log.email_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm block max-w-xs truncate"
                        style={{ color: COLORS.textSecondary }}
                        title={log.subject}
                      >
                        {log.subject}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: status.bg, 
                          color: status.color,
                        }}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm"
                        style={{ color: COLORS.textMuted }}
                      >
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p 
            className="text-sm"
            style={{ color: COLORS.textMuted }}
          >
            Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
                color: page === 0 ? COLORS.textMuted : COLORS.textPrimary
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div 
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <span 
                className="text-sm font-medium"
                style={{ color: COLORS.textPrimary }}
              >
                {page + 1} / {totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
                color: page >= totalPages - 1 ? COLORS.textMuted : COLORS.textPrimary
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
