'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  MessageCircle, 
  Webhook, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  History,
  TestTube,
  HelpCircle,
  ChevronDown,
  Send,
  XCircle,
  Bell,
  Zap,
  TrendingUp,
  CheckSquare,
  Square
} from 'lucide-react'
import { getWhatsAppSettings } from '@/actions/whatsapp/getWhatsAppSettings'
import { updateWhatsAppSettings } from '@/actions/whatsapp/updateWhatsAppSettings'
import { testWhatsAppWebhook } from '@/actions/whatsapp/testWhatsAppWebhook'
import { getWhatsAppLogs } from '@/actions/whatsapp/getWhatsAppLogs'
import { WhatsAppLogs } from './WhatsAppLogs'

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
    whatsapp: '#25D366',
    whatsappLight: isDark ? '#052e16' : '#DCFCE7',
    isDark,
  }
}

interface WhatsAppSettings {
  id: string
  organization_id: string
  webhook_url: string | null
  api_key: string | null
  enabled: boolean
  reminder_hours_before: number
}

interface WhatsAppStats {
  total: number
  sent: number
  failed: number
  pending: number
  deliveryRate: number
}

interface WhatsAppSettingsClientProps {
  organizationId: string
}

const tooltipContent = {
  webhookUrl: 'URL de tu workflow en N8N que recibe webhooks HTTP POST. N8N procesará los datos y enviará el mensaje por WhatsApp.',
  apiKey: 'Tu API key de WhatsApp Business (opcional). Necesaria si tu workflow requiere autenticación.',
  enabled: 'Activa el envío automático de recordatorios por WhatsApp a tus clientes antes de cada cita.',
  reminderHours: 'Selecciona cuántas horas antes de la cita se enviará el recordatorio automático.',
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

function AccordionSection({ 
  title, 
  icon, 
  defaultOpen = false,
  COLORS,
  children 
}: { 
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  COLORS: ReturnType<typeof useColors>
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div 
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{ 
        backgroundColor: COLORS.surfaceGlass,
        backdropFilter: 'blur(12px)',
        borderColor: isOpen ? COLORS.primary : COLORS.border,
        boxShadow: isOpen ? '0 4px 24px rgba(15, 76, 92, 0.12)' : '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: COLORS.primarySubtle }}
          >
            <div style={{ color: COLORS.primary }}>{icon}</div>
          </div>
          <h2 
            className="font-semibold text-lg"
            style={{ color: COLORS.textPrimary }}
          >
            {title}
          </h2>
        </div>
        <ChevronDown 
          className="w-5 h-5 transition-transform duration-300"
          style={{ 
            color: COLORS.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>
      <div 
        className="overflow-hidden transition-all duration-300"
        style={{ 
          maxHeight: isOpen ? '1000px' : '0',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="p-5 pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}

export function WhatsAppSettingsClient({ organizationId }: WhatsAppSettingsClientProps) {
  const COLORS = useColors()
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState<WhatsAppStats>({ total: 0, sent: 0, failed: 0, pending: 0, deliveryRate: 0 })
  const [mounted, setMounted] = useState(false)

  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [reminderHours, setReminderHours] = useState(24)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [organizationId])

  const loadSettings = async () => {
    setLoading(true)
    const result = await getWhatsAppSettings(organizationId)
    
    const logsResult = await getWhatsAppLogs({
      organizationId,
      status: 'all',
      limit: 1000,
      offset: 0,
    })
    
    if (logsResult.success && logsResult.data) {
      const logs = logsResult.data
      const sent = logs.filter(l => l.status === 'sent').length
      const failed = logs.filter(l => l.status === 'failed').length
      const pending = logs.filter(l => l.status === 'pending').length
      const total = logs.length
      const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 0
      
      setStats({
        total,
        sent,
        failed,
        pending,
        deliveryRate
      })
    }
    
    if (result.success && result.data) {
      const data = result.data as unknown as WhatsAppSettings
      setSettings(data)
      setWebhookUrl(data.webhook_url || '')
      setApiKey(data.api_key || '')
      setEnabled(data.enabled || false)
      setReminderHours(data.reminder_hours_before || 24)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const result = await updateWhatsAppSettings({
      organizationId,
      webhookUrl: webhookUrl || undefined,
      apiKey: apiKey || undefined,
      enabled,
      reminderHoursBefore: reminderHours,
    })

    if (result.success) {
      setMessage({ type: 'success', text: '¡Configuración guardada correctamente!' })
      loadSettings()
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al guardar' })
    }
    setSaving(false)
  }

  const handleTest = async () => {
    if (!webhookUrl) {
      setMessage({ type: 'error', text: 'Introduce una URL de webhook primero' })
      return
    }

    setTesting(true)
    setMessage(null)

    const result = await testWhatsAppWebhook({
      webhookUrl,
      apiKey: apiKey || undefined,
    })

    if (result.success) {
      setMessage({ type: 'success', text: '¡Conexión exitosa! El webhook responde correctamente.' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al conectar con el webhook' })
    }
    setTesting(false)
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
        style={{ 
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
        }}
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
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Automatizaciones</p>
              <h1 
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                WhatsApp Business
              </h1>
              <p className="text-sm mt-1 text-white/80">Configura recordatorios automáticos por WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { icon: MessageCircle, label: 'Total', value: stats.total, iconBg: COLORS.whatsappLight, iconColor: COLORS.whatsapp },
          { icon: Send, label: 'Enviados', value: stats.sent, iconBg: COLORS.successLight, iconColor: COLORS.success },
          { icon: XCircle, label: 'Fallidos', value: stats.failed, iconBg: COLORS.errorLight, iconColor: COLORS.error },
          { icon: Clock, label: 'Pendientes', value: stats.pending, iconBg: COLORS.warningLight, iconColor: COLORS.warning },
          { icon: TrendingUp, label: 'Tasa éxito', value: `${stats.deliveryRate}%`, iconBg: COLORS.whatsappLight, iconColor: COLORS.whatsapp },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="group p-4 rounded-2xl border transition-all duration-300 cursor-default"
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
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: stat.iconBg }}>
                <stat.icon className="w-3 h-3" style={{ color: stat.iconColor }} />
              </div>
              <span className="text-xs" style={{ color: COLORS.textMuted }}>{stat.label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>{stat.value}</p>
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
              borderColor: enabled ? COLORS.whatsapp : COLORS.border,
              boxShadow: '0 4px 24px rgba(15, 76, 92, 0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-xl transition-all duration-300"
                  style={{ 
                    background: enabled 
                      ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                      : COLORS.surfaceSubtle 
                  }}
                >
                  {enabled ? (
                    <MessageCircle className="w-6 h-6 text-white" />
                  ) : (
                    <MessageCircle className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                  )}
                </div>
                <div>
                  <h2 
                    className="font-semibold text-lg flex items-center gap-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {enabled ? 'WhatsApp Activado' : 'WhatsApp Desactivado'}
                    <Tooltip content={tooltipContent.enabled} />
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: COLORS.textSecondary }}
                  >
                    {enabled 
                      ? 'Tus clientes recibirán recordatorios automáticos por WhatsApp'
                      : 'Activa los recordatorios para enviar comunicaciones automáticas'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className="relative w-14 h-8 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: enabled ? COLORS.whatsapp : COLORS.border,
                }}
              >
                <span
                  className="absolute top-1 left-1 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center"
                  style={{
                    backgroundColor: '#fff',
                    transform: enabled ? 'translateX(24px)' : 'translateX(0)',
                  }}
                >
                  {enabled && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: COLORS.whatsapp }} />}
                </span>
              </button>
            </div>
          </div>

          {/* Webhook Section - Accordion */}
          <AccordionSection 
            title="Configuración del Webhook" 
            icon={<Webhook className="w-5 h-5" />}
            COLORS={COLORS}
            defaultOpen={true}
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Webhook URL
                  </label>
                  <Tooltip content={tooltipContent.webhookUrl} />
                </div>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://tu-n8n.com/webhook/..."
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.surface,
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    API Key (opcional)
                  </label>
                  <Tooltip content={tooltipContent.apiKey} />
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Tu API key para autenticar"
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.surface,
                  }}
                />
              </div>

              <button
                onClick={handleTest}
                disabled={testing || !webhookUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200"
                style={{ 
                  backgroundColor: COLORS.surfaceSubtle,
                  color: COLORS.primary,
                  border: `1px solid ${COLORS.border}`,
                  opacity: testing || !webhookUrl ? 0.5 : 1,
                  cursor: testing || !webhookUrl ? 'not-allowed' : 'pointer'
                }}
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Probar conexión
              </button>
            </div>
          </AccordionSection>

          {/* Reminder Section - Accordion */}
          <AccordionSection 
            title="Configuración de Recordatorios" 
            icon={<Bell className="w-5 h-5" />}
            COLORS={COLORS}
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Recordatorio antes de la cita
                  </label>
                  <Tooltip content={tooltipContent.reminderHours} />
                </div>
                <select
                  value={reminderHours}
                  onChange={(e) => setReminderHours(Number(e.target.value))}
                  disabled={!enabled}
                  className="w-full md:w-72 px-4 py-3 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50"
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

              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: COLORS.whatsappLight }}
                  >
                    <MessageCircle className="w-5 h-5" style={{ color: COLORS.whatsapp }} />
                  </div>
                  <div>
                    <p 
                      className="font-medium"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Recordatorio automático
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: COLORS.textSecondary }}
                    >
                      Se enviará {reminderHours} hora{reminderHours !== 1 ? 's' : ''} antes de cada cita
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AccordionSection>

          {/* Help Section - Accordion */}
          <AccordionSection 
            title="Cómo configurar N8N" 
            icon={<HelpCircle className="w-5 h-5" />}
            COLORS={COLORS}
          >
            <div className="space-y-4">
              <p 
                className="text-sm"
                style={{ color: COLORS.textSecondary }}
              >
                Sigue estos pasos para configurar el envío de recordatorios por WhatsApp:
              </p>
              <ol className="space-y-3">
                {[
                  'Crea un nuevo workflow en N8N',
                  'Añade un nodo "Webhook" que reciba HTTP POST',
                  'Copia la URL del webhook y pégala arriba',
                  'Configura el envío de mensaje de WhatsApp en tu workflow',
                  'Activa el webhook y guarda la configuración'
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      style={{ backgroundColor: COLORS.primarySubtle, color: COLORS.primary }}
                    >
                      {index + 1}
                    </div>
                    <span 
                      className="text-sm"
                      style={{ color: COLORS.textPrimary }}
                    >
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.primarySubtle }}
              >
                <p 
                  className="text-sm"
                  style={{ color: COLORS.primary }}
                >
                  <strong>Nota:</strong> El scheduler de recordatorios ejecutará <code className="px-2 py-0.5 rounded bg-white/50 text-xs">POST /api/whatsapp/scheduler</code> cada hora para enviar los recordatorios pendientes.
                </p>
              </div>
            </div>
          </AccordionSection>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: COLORS.primary,
                boxShadow: '0 4px 12px rgba(15, 76, 92, 0.3)'
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

      {activeTab === 'logs' && <WhatsAppLogs organizationId={organizationId} />}
    </div>
  )
}
