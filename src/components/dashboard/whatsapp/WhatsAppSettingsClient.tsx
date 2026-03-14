'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Webhook, Clock, CheckCircle2, AlertCircle, Loader2, Send, Save, TestTube } from 'lucide-react'
import { getWhatsAppSettings } from '@/actions/whatsapp/getWhatsAppSettings'
import { updateWhatsAppSettings } from '@/actions/whatsapp/updateWhatsAppSettings'
import { testWhatsAppWebhook } from '@/actions/whatsapp/testWhatsAppWebhook'

const COLORS = {
  primary: '#0F4C5C',
  primaryLight: '#1A6B7C',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFB',
  border: '#E8ECEE',
  textPrimary: '#1A2B32',
  textSecondary: '#5A6B70',
  textMuted: '#8A9A9E',
}

interface WhatsAppSettings {
  id: string
  organization_id: string
  webhook_url: string | null
  api_key: string | null
  enabled: boolean
  reminder_hours_before: number
}

interface WhatsAppSettingsClientProps {
  organizationId: string
}

export function WhatsAppSettingsClient({ organizationId }: WhatsAppSettingsClientProps) {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>
          Integración WhatsApp
        </h1>
        <p style={{ color: COLORS.textSecondary }}>
          Configura N8N para enviar recordatorios automáticos de citas a tus clientes.
        </p>
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
          <span style={{ color: message.type === 'success' ? COLORS.success : COLORS.error }}>
            {message.text}
          </span>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F5E9' }}>
              <Webhook className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: COLORS.textPrimary }}>Webhook N8N</h2>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>URL de tu workflow en N8N</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://tu-n8n.com/webhook/..."
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                API Key (opcional)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Tu API key para autenticar"
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              />
            </div>

            <button
              onClick={handleTest}
              disabled={testing || !webhookUrl}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ 
                backgroundColor: COLORS.surfaceSubtle,
                color: COLORS.primary,
                border: `1px solid ${COLORS.border}`
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
        </div>

        <div className="bg-white rounded-2xl p-6" style={{ border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF3E0' }}>
              <Clock className="w-5 h-5" style={{ color: COLORS.warning }} />
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: COLORS.textPrimary }}>Configuración de Recordatorios</h2>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>Cuándo enviar los recordatorios</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" style={{ color: COLORS.primary }} />
                <span style={{ color: COLORS.textPrimary }}>Recordatorios habilitados</span>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                Enviar recordatorio
              </label>
              <select
                value={reminderHours}
                onChange={(e) => setReminderHours(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
                style={{ 
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                }}
              >
                <option value={1}>1 hora antes</option>
                <option value={2}>2 horas antes</option>
                <option value={4}>4 horas antes</option>
                <option value={12}>12 horas antes</option>
                <option value={24}>24 horas antes (1 día)</option>
                <option value={48}>48 horas antes (2 días)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium disabled:opacity-50"
            style={{ 
              backgroundColor: COLORS.primary,
              color: 'white',
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar configuración
          </button>
        </div>

        <div className="bg-blue-50 rounded-xl p-4" style={{ backgroundColor: '#EFF6FF' }}>
          <h3 className="font-medium mb-2" style={{ color: COLORS.primary }}>¿Cómo funciona?</h3>
          <ol className="text-sm space-y-2" style={{ color: COLORS.textSecondary }}>
            <li>1. Crea un workflow en N8N que reciba webhooks HTTP</li>
            <li>2. Copia la URL del webhook y pégala arriba</li>
            <li>3. N8N recibirá los datos y enviará el mensaje por WhatsApp</li>
            <li>4. Los recordatorios se enviarán automáticamente un día antes de cada cita</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
