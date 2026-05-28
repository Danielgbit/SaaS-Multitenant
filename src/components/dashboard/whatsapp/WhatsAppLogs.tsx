'use client'

import { useState, useEffect, useCallback } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { MessageCircle, Send, XCircle, Clock, CheckCircle2, AlertCircle, Phone, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { getWhatsAppLogs } from '@/actions/whatsapp/getWhatsAppLogs'
import { resendWhatsAppReminder } from '@/actions/whatsapp/resendWhatsAppReminder'

interface LogEntry {
  id: string
  phone_number: string
  message_type: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
  appointment_id: string | null
  clients: { name: string } | null
  appointments: { start_time: string; services: { name: string } | null } | null
}

interface WhatsAppLogsProps {
  organizationId: string
}

const messageTypeLabels: Record<string, string> = {
  appointment_confirmation: 'Confirmación',
  appointment_reminder: 'Recordatorio',
  appointment_cancelled: 'Cancelación',
  appointment_completed: 'Completado',
}

export function WhatsAppLogs({ organizationId }: WhatsAppLogsProps) {
  const COLORS = useThemeColors()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  const limit = 15

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    const result = await getWhatsAppLogs({
      organizationId,
      status: statusFilter,
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
  }, [organizationId, statusFilter, page, limit])

  useEffect(() => {
    setMounted(true)
    loadLogs()
  }, [loadLogs])

  const handleResend = async (logId: string) => {
    setResendingId(logId)
    setMessage(null)

    const result = await resendWhatsAppReminder({ logId })

    if (result.success) {
      setMessage({ type: 'success', text: 'Mensaje reenviado correctamente' })
      loadLogs()
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al reenviar' })
    }
    setResendingId(null)
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
    { key: 'all', label: 'Todos', icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { key: 'sent', label: 'Enviados', icon: <Send className="w-3.5 h-3.5" /> },
    { key: 'failed', label: 'Fallidos', icon: <XCircle className="w-3.5 h-3.5" /> },
    { key: 'pending', label: 'Pendientes', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success" size="sm"><Send className="w-3 h-3" />Enviado</Badge>
      case 'failed':
        return <Badge variant="error" size="sm"><XCircle className="w-3 h-3" />Fallido</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm"><Clock className="w-3 h-3" />Pendiente</Badge>
      default:
        return <Badge variant="neutral" size="sm"><Clock className="w-3 h-3" />{status}</Badge>
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
          <EmptyState
            icon={<MessageCircle className="w-8 h-8" style={{ color: COLORS.whatsapp }} />}
            title="No hay mensajes enviados"
            description="Los mensajes de WhatsApp aparecerán aquí cuando se envíen"
          />
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
                  Estado
                </th>
                <th 
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Fecha
                </th>
                <th 
                  className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                return (
                  <tr 
                    key={log.id}
                    className="transition-colors group hover:bg-slate-100 dark:hover:bg-slate-800"
                    style={{ borderBottom: `1px solid ${COLORS.border}` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: COLORS.whatsappLight }}
                        >
                          <Phone className="w-4 h-4" style={{ color: COLORS.whatsapp }} />
                        </div>
                        <div>
                          <span 
                            className="text-sm font-medium block"
                            style={{ color: COLORS.textPrimary }}
                          >
                            {log.clients?.name || 'Cliente'}
                          </span>
                          <span 
                            className="text-xs"
                            style={{ color: COLORS.textMuted }}
                          >
                            {log.phone_number}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm"
                        style={{ color: COLORS.textSecondary }}
                      >
                        {messageTypeLabels[log.message_type] || log.message_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-5 py-4">
                      <span 
                        className="text-sm"
                        style={{ color: COLORS.textMuted }}
                      >
                        {formatDate(log.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleResend(log.id)}
                          disabled={resendingId === log.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md"
                          style={{ 
                            backgroundColor: COLORS.surfaceSubtle,
                            color: COLORS.primary,
                            border: `1px solid ${COLORS.border}`,
                            cursor: resendingId === log.id ? 'not-allowed' : 'pointer',
                            opacity: resendingId === log.id ? 0.5 : 1,
                          }}
                        >
                          {resendingId === log.id ? (
                            <Spinner size="sm" className="w-3 h-3" />
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 inline mr-1" />
                              Reenviar
                            </>
                          )}
                        </button>
                      )}
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
