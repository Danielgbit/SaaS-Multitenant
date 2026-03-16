'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  History,
  Send,
  Bell,
  BellOff,
  CheckSquare,
  Square,
  HelpCircle,
  TrendingUp,
  MailOpen,
  XCircle,
  Zap
} from 'lucide-react'
import { getEmailSettings } from '@/actions/email/getEmailSettings'
import { updateEmailSettings } from '@/actions/email/updateEmailSettings'
import { getEmailLogs } from '@/actions/email/getEmailLogs'
import { EmailLogs } from './EmailLogs'

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

interface EmailSettings {
  id: string
  organization_id: string
  enabled: boolean
  reminder_hours_before: number
  send_confirmation: boolean
  send_reminders: boolean
  send_post_appointment: boolean
}

interface EmailStats {
  total: number
  sent: number
  failed: number
  pending: number
}

interface EmailSettingsClientProps {
  organizationId: string
}

const tooltipContent = {
  confirmation: 'Recibe un email automático cuando se cree una nueva cita, tanto desde el panel como desde la página pública de reservas.',
  reminders: 'Envía un recordatorio automático X horas antes de la cita para reducir ausencias.',
  postAppointment: 'Email de seguimiento después de que la cita se marque como completada. Ideal para solicitar feedback.',
  scheduler: 'El scheduler debe ejecutarse cada hora desde N8N. Llama al endpoint /api/email/scheduler para enviar recordatorios pendientes.',
}

function Tooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false)
  
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="p-1 rounded-full hover:bg-slate-100 transition-colors"
      >
        <HelpCircle className="w-4 h-4" style={{ color: COLORS.textMuted }} />
      </button>
      {show && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
          style={{ 
            backgroundColor: COLORS.textPrimary, 
            color: '#fff',
            maxWidth: '280px'
          }}
        >
          {content}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-1"
            style={{ 
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: `${COLORS.textPrimary} transparent transparent transparent`
            }}
          />
        </div>
      )}
    </div>
  )
}

export function EmailSettingsClient({ organizationId }: EmailSettingsClientProps) {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState<EmailStats>({ total: 0, sent: 0, failed: 0, pending: 0 })

  const [enabled, setEnabled] = useState(false)
  const [reminderHours, setReminderHours] = useState(24)
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [sendReminders, setSendReminders] = useState(true)
  const [sendPostAppointment, setSendPostAppointment] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [organizationId])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getEmailSettings(organizationId)
    
    const statsResult = await getEmailLogs({
      organizationId,
      limit: 1000,
      offset: 0,
    })
    
    if (statsResult.success && statsResult.data) {
      const logs = statsResult.data
      setStats({
        total: logs.length,
        sent: logs.filter(l => l.status === 'sent').length,
        failed: logs.filter(l => l.status === 'failed').length,
        pending: logs.filter(l => l.status === 'pending').length,
      })
    }
    
    if (result.success && result.data) {
      const data = result.data as unknown as EmailSettings
      setSettings(data)
      setEnabled(data.enabled || false)
      setReminderHours(data.reminder_hours_before || 24)
      setSendConfirmation(data.send_confirmation ?? true)
      setSendReminders(data.send_reminders ?? true)
      setSendPostAppointment(data.send_post_appointment ?? false)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const result = await updateEmailSettings({
      organizationId,
      enabled,
      reminderHoursBefore: reminderHours,
      sendConfirmation,
      sendReminders,
      sendPostAppointment,
    })

    if (result.success) {
      setMessage({ type: 'success', text: '¡Configuración guardada correctamente!' })
      loadSettings()
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al guardar' })
    }
    setSaving(false)
  }

  const reminderOptions = [
    { value: 1, label: '1 hora antes' },
    { value: 2, label: '2 horas antes' },
    { value: 4, label: '4 horas antes' },
    { value: 12, label: '12 horas antes' },
    { value: 24, label: '24 horas antes (1 día)' },
    { value: 48, label: '48 horas antes (2 días)' },
    { value: 72, label: '72 horas antes (3 días)' },
    { value: 168, label: '168 horas antes (1 semana)' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl font-semibold mb-2" 
          style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
        >
          Automatización de Emails
        </h1>
        <p 
          style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Configura confirmaciones y recordatorios automáticos para mejorar la experiencia de tus clientes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div 
          className="p-5 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primaryLight }}>
              <Mail className="w-4 h-4" style={{ color: COLORS.primary }} />
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Total</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.total}</p>
        </div>
        
        <div 
          className="p-5 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.successLight }}>
              <Send className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Enviados</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: COLORS.success, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.sent}</p>
        </div>
        
        <div 
          className="p-5 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.errorLight }}>
              <XCircle className="w-4 h-4" style={{ color: COLORS.error }} />
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Fallidos</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: COLORS.error, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.failed}</p>
        </div>
        
        <div 
          className="p-5 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.warningLight }}>
              <Clock className="w-4 h-4" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-sm" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Pendientes</span>
          </div>
          <p className="text-2xl font-semibold" style={{ color: COLORS.warning, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.pending}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div 
          className="inline-flex gap-1 p-1 rounded-xl"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'settings' ? 'shadow-sm' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'settings' ? COLORS.surface : 'transparent',
              color: activeTab === 'settings' ? COLORS.primary : COLORS.textSecondary,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            <Zap className="w-4 h-4" />
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'logs' ? 'shadow-sm' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'logs' ? COLORS.surface : 'transparent',
              color: activeTab === 'logs' ? COLORS.primary : COLORS.textSecondary,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
        </div>
      </div>

      {message && (
        <div 
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
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

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Main Toggle Card */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: COLORS.surface, 
              borderColor: COLORS.border,
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl"
                  style={{ 
                    background: enabled 
                      ? 'linear-gradient(135deg, #0F4C5C 0%, #1a6b7d 100%)' 
                      : COLORS.surfaceSubtle 
                  }}
                >
                  {enabled ? (
                    <Mail className="w-6 h-6" style={{ color: '#fff' }} />
                  ) : (
                    <Mail className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                  )}
                </div>
                <div>
                  <h2 
                    className="font-semibold text-lg"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {enabled ? 'Emails Activados' : 'Emails Desactivados'}
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {enabled 
                      ? 'Tus clientes recibirán confirmaciones y recordatorios automáticos'
                      : 'Activa los emails para enviar comunicaciones automáticas'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className="relative w-14 h-8 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: enabled ? COLORS.success : COLORS.border,
                }}
              >
                <span
                  className="absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center"
                  style={{
                    backgroundColor: '#fff',
                    transform: enabled ? 'translateX(24px)' : 'translateX(0)',
                  }}
                >
                  {enabled && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: COLORS.success }} />}
                </span>
              </button>
            </div>
          </div>

          {/* Settings Options */}
          {enabled && (
            <div 
              className="p-6 rounded-2xl border"
              style={{ 
                backgroundColor: COLORS.surface, 
                borderColor: COLORS.border,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
              }}
            >
              <h2 
                className="font-semibold text-lg mb-6 flex items-center gap-3"
                style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primaryLight }}>
                  <Bell className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                Configuración de Notificaciones
              </h2>

              {/* Reminder Timing */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Recordatorio antes de la cita
                  </label>
                  <Tooltip content={tooltipContent.reminders} />
                </div>
                <select
                  value={reminderHours}
                  onChange={(e) => setReminderHours(Number(e.target.value))}
                  className="w-full md:w-72 px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {reminderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                <OptionToggle
                  icon={<CheckSquare className="w-5 h-5" />}
                  iconBg={COLORS.successLight}
                  iconColor={COLORS.success}
                  label="Confirmación de cita"
                  description="Email automático al crear una nueva cita"
                  checked={sendConfirmation}
                  onChange={setSendConfirmation}
                  tooltip={tooltipContent.confirmation}
                />
                
                <OptionToggle
                  icon={<Bell className="w-5 h-5" />}
                  iconBg={COLORS.warningLight}
                  iconColor={COLORS.warning}
                  label="Recordatorio antes de cita"
                  description={`${reminderHours} horas antes de la cita programada`}
                  checked={sendReminders}
                  onChange={setSendReminders}
                  tooltip={tooltipContent.reminders}
                />
                
                <OptionToggle
                  icon={<TrendingUp className="w-5 h-5" />}
                  iconBg="#E0E7FF"
                  iconColor="#4F46E5"
                  label="Seguimiento post-cit@"
                  description="Email de seguimiento después de completar la cita"
                  checked={sendPostAppointment}
                  onChange={setSendPostAppointment}
                  tooltip={tooltipContent.postAppointment}
                />
              </div>
            </div>
          )}

          {/* Help Section */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: COLORS.primaryLight, 
              borderColor: COLORS.primary,
            }}
          >
            <h3 
              className="font-semibold mb-4 flex items-center gap-2"
              style={{ color: COLORS.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              <HelpCircle className="w-5 h-5" />
              Cómo configurar el scheduler
            </h3>
            <ol 
              className="space-y-2 text-sm"
              style={{ color: COLORS.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold">1.</span>
                Configura N8N para ejecutar el endpoint <code className="px-2 py-0.5 rounded bg-white/50 text-xs">POST /api/email/scheduler</code> cada hora
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">2.</span>
                Añade el header <code className="px-2 py-0.5 rounded bg-white/50 text-xs">Authorization: Bearer TU_CRON_SECRET</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold">3.</span>
                Los recordatorios se enviarán automáticamente según la configuración
              </li>
            </ol>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2 hover:shadow-lg"
              style={{ 
                backgroundColor: saving ? COLORS.textMuted : COLORS.primary,
                boxShadow: saving ? 'none' : '0 4px 12px rgba(15, 76, 92, 0.3)'
              }}
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'logs' && <EmailLogs organizationId={organizationId} />}
    </div>
  )
}

function OptionToggle({ 
  icon, 
  iconBg, 
  iconColor, 
  label, 
  description, 
  checked, 
  onChange,
  tooltip 
}: { 
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  tooltip?: string
}) {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer"
      style={{ 
        backgroundColor: checked ? COLORS.surfaceSubtle : COLORS.surface,
        borderColor: checked ? COLORS.primary : COLORS.border,
      }}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-4">
        <div 
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: iconBg }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
        <div>
          <p 
            className="font-medium"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {label}
          </p>
          <p 
            className="text-sm"
            style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {tooltip && <Tooltip content={tooltip} />}
        <button
          className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
          style={{ 
            borderColor: checked ? COLORS.primary : COLORS.border,
            backgroundColor: checked ? COLORS.primary : 'transparent'
          }}
        >
          {checked && <CheckCircle2 className="w-4 h-4" style={{ color: '#fff' }} />}
        </button>
      </div>
    </div>
  )
}
