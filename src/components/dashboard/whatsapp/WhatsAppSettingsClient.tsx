'use client'

import { useState, useEffect } from 'react'
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
  whatsapp: '#25D366',
  whatsappLight: '#DCFCE7',
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

function AccordionSection({ 
  title, 
  icon, 
  defaultOpen = false, 
  children 
}: { 
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div 
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{ 
        backgroundColor: COLORS.surface, 
        borderColor: isOpen ? COLORS.primary : COLORS.border,
        boxShadow: isOpen ? '0 4px 16px rgba(15, 76, 92, 0.1)' : '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: COLORS.primaryLight }}
          >
            <div style={{ color: COLORS.primary }}>{icon}</div>
          </div>
          <h2 
            className="font-semibold text-lg"
            style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState<WhatsAppStats>({ total: 0, sent: 0, failed: 0, pending: 0, deliveryRate: 0 })

  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [reminderHours, setReminderHours] = useState(24)

  useEffect(() => {
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 
          className="text-3xl font-semibold mb-2" 
          style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
        >
          Automatización de WhatsApp
        </h1>
        <p 
          style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Configura recordatorios automáticos por WhatsApp para mejorar la experiencia de tus clientes.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.primaryLight }}>
              <MessageCircle className="w-3 h-3" style={{ color: COLORS.whatsapp }} />
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Total</span>
          </div>
          <p className="text-xl font-semibold" style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.total}</p>
        </div>
        
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.successLight }}>
              <Send className="w-3 h-3" style={{ color: COLORS.success }} />
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Enviados</span>
          </div>
          <p className="text-xl font-semibold" style={{ color: COLORS.success, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.sent}</p>
        </div>
        
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.errorLight }}>
              <XCircle className="w-3 h-3" style={{ color: COLORS.error }} />
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Fallidos</span>
          </div>
          <p className="text-xl font-semibold" style={{ color: COLORS.error, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.failed}</p>
        </div>
        
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: COLORS.warningLight }}>
              <Clock className="w-3 h-3" style={{ color: COLORS.warning }} />
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Pendientes</span>
          </div>
          <p className="text-xl font-semibold" style={{ color: COLORS.warning, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.pending}</p>
        </div>

        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: COLORS.surface, 
            borderColor: COLORS.border,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8F5E9' }}>
              <TrendingUp className="w-3 h-3" style={{ color: COLORS.whatsapp }} />
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Tasa éxito</span>
          </div>
          <p className="text-xl font-semibold" style={{ color: COLORS.whatsapp, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stats.deliveryRate}%</p>
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
                      ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' 
                      : COLORS.surfaceSubtle 
                  }}
                >
                  {enabled ? (
                    <MessageCircle className="w-6 h-6" style={{ color: '#fff' }} />
                  ) : (
                    <MessageCircle className="w-6 h-6" style={{ color: COLORS.textMuted }} />
                  )}
                </div>
                <div>
                  <h2 
                    className="font-semibold text-lg flex items-center gap-2"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    {enabled ? 'WhatsApp Activado' : 'WhatsApp Desactivado'}
                    <Tooltip content={tooltipContent.enabled} />
                  </h2>
                  <p 
                    className="text-sm"
                    style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
            defaultOpen={true}
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
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
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label 
                    className="text-sm font-medium"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
                      style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      Recordatorio automático
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
          >
            <div className="space-y-4">
              <p 
                className="text-sm"
                style={{ color: COLORS.textSecondary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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
                      style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
                    >
                      {index + 1}
                    </div>
                    <span 
                      className="text-sm"
                      style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    >
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.primaryLight }}
              >
                <p 
                  className="text-sm"
                  style={{ color: COLORS.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
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

      {activeTab === 'logs' && <WhatsAppLogs organizationId={organizationId} />}
    </div>
  )
}
