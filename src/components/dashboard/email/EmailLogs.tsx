'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Send,
  MailOpen
} from 'lucide-react'
import { getEmailLogs } from '@/actions/email/getEmailLogs'

const COLORS = {
  primary: '#0F4C5C',
  primaryHover: '#0C3E4A',
  primaryLight: '#E6F1F4',
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  surface: '#FFFFFF',
  surfaceSubtle: '#FAFAF9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
}

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

const statusLabels: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  sent: { 
    label: 'Enviado', 
    color: COLORS.success, 
    bg: COLORS.successLight,
    icon: <Send className="w-3 h-3" />
  },
  failed: { 
    label: 'Fallido', 
    color: COLORS.error, 
    bg: COLORS.errorLight,
    icon: <XCircle className="w-3 h-3" />
  },
  pending: { 
    label: 'Pendiente', 
    color: COLORS.warning, 
    bg: COLORS.warningLight,
    icon: <Clock className="w-3 h-3" />
  },
}

export function EmailLogs({ organizationId }: EmailLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const limit = 15

  useEffect(() => {
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

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <div 
          className="inline-flex gap-1 p-1 rounded-xl"
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
                boxShadow: statusFilter === btn.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'Plus Jakarta Sans, sans-serif'
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
          className="mb-4 p-4 rounded-xl flex items-center gap-3"
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
              fontFamily: 'Plus Jakarta Sans, sans-serif' 
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
          backgroundColor: COLORS.surface, 
          borderColor: COLORS.border,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}
      >
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 
              className="w-8 h-8 mx-auto animate-spin mb-4"
              style={{ color: COLORS.primary }} 
            />
            <p style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Cargando historial...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <Mail className="w-8 h-8" style={{ color: COLORS.textMuted }} />
            </div>
            <h3 
              className="font-semibold mb-2"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              No hay emails enviados
            </h3>
            <p style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Los emails aparecerán aquí cuando se envíen
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: COLORS.surfaceSubtle }}>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Destinatario
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Tipo
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Asunto
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Estado
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody style={{ borderColor: COLORS.border }}>
              {logs.map((log) => {
                const status = statusLabels[log.status] || { 
                  label: log.status, 
                  color: COLORS.textSecondary, 
                  bg: COLORS.surfaceSubtle,
                  icon: <Clock className="w-3 h-3" />
                }
                return (
                  <tr 
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.primaryLight }}
                        >
                          <MailOpen className="w-4 h-4" style={{ color: COLORS.primary }} />
                        </div>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {log.to_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm"
                        style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {emailTypeLabels[log.email_type] || log.email_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm block max-w-xs truncate"
                        style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
                          fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm"
                        style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                      >
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p 
            className="text-sm"
            style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {page + 1} / {totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
