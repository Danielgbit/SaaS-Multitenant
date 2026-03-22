'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
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

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryHover: isDark ? '#0EA5E9' : '#0C3E4A',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' 
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    primarySubtle: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 76, 92, 0.08)',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    isDark,
  }
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
  const COLORS = useColors()
  
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <HelpCircle className="w-4 h-4" style={{ color: COLORS.textMuted }} />
      </button>
      {show && (
        <div 
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg backdrop-blur-sm"
          style={{ 
            backgroundColor: COLORS.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)', 
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
              borderColor: `${COLORS.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)'} transparent transparent transparent`
            }}
          />
        </div>
      )}
    </div>
  )
}

export function EmailSettingsClient({ organizationId }: EmailSettingsClientProps) {
  const COLORS = useColors()
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState<EmailStats>({ total: 0, sent: 0, failed: 0, pending: 0 })
  const [mounted, setMounted] = useState(false)

  const [enabled, setEnabled] = useState(false)
  const [reminderHours, setReminderHours] = useState(24)
  const [sendConfirmation, setSendConfirmation] = useState(true)
  const [sendReminders, setSendReminders] = useState(true)
  const [sendPostAppointment, setSendPostAppointment] = useState(false)

  useEffect(() => {
    setMounted(true)
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Premium Header with Gradient */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
        style={{ background: COLORS.primaryGradient }}
      >
        {/* Decorations */}
        <div 
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ 
            background: 'rgba(255,255,255,0.2)',
            transform: 'translate(30%, -30%)' 
          }} 
        />
        <div 
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
          style={{ 
            background: 'rgba(255,255,255,0.15)',
            transform: 'translate(-30%, 30%)' 
          }} 
        />
        
        {/* Content */}
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Automatizaciones</p>
              <h1 
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Email Marketing
              </h1>
              <p className="text-sm mt-1 text-white/80">Configura confirmaciones y recordatorios automáticos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Mail, label: 'Total', value: stats.total, iconBg: COLORS.primarySubtle, iconColor: COLORS.primary },
          { icon: Send, label: 'Enviados', value: stats.sent, iconBg: COLORS.successLight, iconColor: COLORS.success },
          { icon: XCircle, label: 'Fallidos', value: stats.failed, iconBg: COLORS.errorLight, iconColor: COLORS.error },
          { icon: Clock, label: 'Pendientes', value: stats.pending, iconBg: COLORS.warningLight, iconColor: COLORS.warning },
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
            style={{ 
              backgroundColor: COLORS.surfaceGlass,
              backdropFilter: 'blur(12px)',
              borderColor: COLORS.border,
              boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 76, 92, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(15, 76, 92, 0.08)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: stat.iconBg }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
              </div>
              <span className="text-xs font-medium" style={{ color: COLORS.textMuted }}>{stat.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div 
          className="inline-flex gap-1 p-1.5 rounded-xl"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'settings' ? 'shadow-md' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'settings' ? COLORS.surface : 'transparent',
              color: activeTab === 'settings' ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            <Zap className="w-4 h-4" />
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'logs' ? 'shadow-md' : ''
            }`}
            style={{ 
              backgroundColor: activeTab === 'logs' ? COLORS.surface : 'transparent',
              color: activeTab === 'logs' ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
        </div>
      </div>

      {message && (
        <div 
          className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
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

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Main Toggle Card */}
          <div 
            className="p-6 rounded-2xl border transition-all duration-300"
            style={{ 
              backgroundColor: COLORS.surfaceGlass,
              backdropFilter: 'blur(12px)',
              borderColor: enabled ? COLORS.primary : COLORS.border,
              boxShadow: '0 4px 24px rgba(15, 76, 92, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl transition-all duration-300"
                  style={{ 
                    background: enabled 
                      ? COLORS.primaryGradient
                      : COLORS.surfaceSubtle 
                  }}
                >
                  {enabled ? (
                    <Mail className="w-6 h-6 text-white" />
                  ) : (
                    <Mail className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                  )}
                </div>
                <div>
                  <h2 
                    className="font-semibold text-lg flex items-center gap-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {enabled ? 'Emails Activados' : 'Emails Desactivados'}
                    <Tooltip content="Activa los emails para enviar comunicaciones automáticas" />
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: COLORS.textSecondary }}
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
              className="p-6 rounded-2xl border transition-all duration-300"
              style={{ 
                backgroundColor: COLORS.surfaceGlass,
                backdropFilter: 'blur(12px)',
                borderColor: COLORS.border,
                boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
              }}
            >
              <h2 
                className="font-semibold text-lg mb-6 flex items-center gap-3"
                style={{ color: COLORS.textPrimary }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS.primarySubtle }}>
                  <Bell className="w-5 h-5" style={{ color: COLORS.primary }} />
                </div>
                Configuración de Notificaciones
              </h2>

              {/* Reminder Timing */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
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
                    backgroundColor: COLORS.surface,
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
                  COLORS={COLORS}
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
                  COLORS={COLORS}
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
                  COLORS={COLORS}
                  icon={<TrendingUp className="w-5 h-5" />}
                  iconBg={COLORS.isDark ? '#312E81' : '#E0E7FF'}
                  iconColor={COLORS.isDark ? '#818CF8' : '#4F46E5'}
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
              backgroundColor: COLORS.primarySubtle, 
              borderColor: COLORS.border,
            }}
          >
            <h3 
              className="font-semibold mb-4 flex items-center gap-2"
              style={{ color: COLORS.primary }}
            >
              <HelpCircle className="w-5 h-5" />
              Cómo configurar el scheduler
            </h3>
            <ol 
              className="space-y-2 text-sm"
              style={{ color: COLORS.textSecondary }}
            >
              <li className="flex items-start gap-2">
                <span className="font-semibold" style={{ color: COLORS.primary }}>1.</span>
                Configura N8N para ejecutar el endpoint <code className="px-2 py-0.5 rounded bg-white/50 text-xs" style={{ color: COLORS.primary }}>POST /api/email/scheduler</code> cada hora
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold" style={{ color: COLORS.primary }}>2.</span>
                Añade el header <code className="px-2 py-0.5 rounded bg-white/50 text-xs" style={{ color: COLORS.primary }}>Authorization: Bearer TU_CRON_SECRET</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold" style={{ color: COLORS.primary }}>3.</span>
                Los recordatorios se enviarán automáticamente según la configuración
              </li>
            </ol>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>
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
  COLORS,
  icon, 
  iconBg, 
  iconColor, 
  label, 
  description, 
  checked, 
  onChange,
  tooltip 
}: { 
  COLORS: ReturnType<typeof useColors>
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
      className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer group"
      style={{ 
        backgroundColor: checked ? COLORS.surfaceSubtle : COLORS.surface,
        borderColor: checked ? COLORS.primary : COLORS.border,
      }}
      onClick={() => onChange(!checked)}
      onMouseEnter={(e) => {
        if (!checked) {
          e.currentTarget.style.borderColor = COLORS.primary
        }
      }}
      onMouseLeave={(e) => {
        if (!checked) {
          e.currentTarget.style.borderColor = COLORS.border
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div 
          className="p-2.5 rounded-lg transition-colors duration-200"
          style={{ backgroundColor: iconBg }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
        <div>
          <p className="font-medium" style={{ color: COLORS.textPrimary }}>
            {label}
          </p>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
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
