'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, TestTube, Eye, EyeOff, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { AlertBanner } from './AlertBanner'
import { getProvider, upsertProvider, testProviderConnection } from '@/actions/notifications/providers'
import type { NotificationProvider } from '@/types/notifications'

interface TabSettingsProps {
  organizationId: string
}

export function TabSettings({ organizationId }: TabSettingsProps) {
  const COLORS = useThemeColors()
  const [provider, setProvider] = useState<NotificationProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [rateLimitPerMin, setRateLimitPerMin] = useState(30)
  const [rateLimitPerDay, setRateLimitPerDay] = useState(500)

  useEffect(() => {
    loadProvider()
  }, [organizationId])

  const loadProvider = async () => {
    setLoading(true)
    const result = await getProvider(organizationId, 'whatsapp')
    if (result.success && result.data) {
      setProvider(result.data)
      setWebhookUrl((result.data.config?.webhook_url as string) || '')
      setApiKey((result.data.config?.api_key as string) || '')
      setEnabled(result.data.isEnabled)
      setRateLimitPerMin(result.data.rateLimitPerMin)
      setRateLimitPerDay(result.data.rateLimitPerDay || 500)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await upsertProvider({
      organizationId,
      channel: 'whatsapp',
      provider: 'n8n',
      config: {
        webhook_url: webhookUrl || undefined,
        api_key: apiKey || undefined,
      },
      rateLimitPerMin,
      rateLimitPerDay,
      isEnabled: enabled,
    })

    if (result.success) {
      setToast({ type: 'success', message: 'Configuración guardada correctamente' })
      loadProvider()
    } else {
      setToast({ type: 'error', message: result.error || 'Error al guardar' })
    }
    setSaving(false)
    setTimeout(() => setToast(null), 3000)
  }

  const handleTest = async () => {
    if (!provider?.id) return

    if (!webhookUrl) {
      setToast({ type: 'error', message: 'Introduce una URL de webhook primero' })
      setTimeout(() => setToast(null), 3000)
      return
    }

    setTesting(true)
    const result = await testProviderConnection(provider.id)
    setTesting(false)

    if (result.success) {
      setToast({ type: 'success', message: '¡Conexión exitosa! El webhook responde correctamente.' })
    } else {
      setToast({ type: 'error', message: result.error || 'Error al conectar con el webhook' })
    }
    setTimeout(() => setToast(null), 4000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <AlertBanner type={toast.type} message={toast.message} />
      )}

      <div
        className="rounded-2xl border p-6 space-y-5"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h3
          className="text-lg font-semibold"
          style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Configuración del proveedor
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Webhook URL de N8N
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://tu-n8n.com/webhook/..."
              className="w-full px-4 py-3 rounded-xl border transition-colors outline-none"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              API Key (opcional)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API key de WhatsApp Business"
                className="w-full px-4 py-3 pr-12 rounded-xl border transition-colors outline-none"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textPrimary,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors"
                style={{ color: COLORS.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                WhatsApp habilitado
              </span>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{ backgroundColor: enabled ? COLORS.success : COLORS.border }}
              role="switch"
              aria-checked={enabled}
            >
              <span
                className="absolute top-1 w-5 h-5 rounded-full transition-transform"
                style={{
                  backgroundColor: '#FFFFFF',
                  left: enabled ? '20px' : '2px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 space-y-5"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h3
          className="text-lg font-semibold"
          style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Límites de tasa
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Por minuto
            </label>
            <input
              type="number"
              value={rateLimitPerMin}
              onChange={(e) => setRateLimitPerMin(parseInt(e.target.value) || 30)}
              min={1}
              max={1000}
              className="w-full px-4 py-3 rounded-xl border transition-colors outline-none"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: COLORS.textSecondary }}
            >
              Por día
            </label>
            <input
              type="number"
              value={rateLimitPerDay}
              onChange={(e) => setRateLimitPerDay(parseInt(e.target.value) || 500)}
              min={1}
              max={100000}
              className="w-full px-4 py-3 rounded-xl border transition-colors outline-none"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.borderFocus }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !webhookUrl}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium border transition-all"
          style={{
            borderColor: COLORS.primary,
            color: COLORS.primary,
            opacity: testing || !webhookUrl ? 0.5 : 1,
            cursor: testing || !webhookUrl ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!testing && webhookUrl) {
              e.currentTarget.style.backgroundColor = COLORS.primarySubtle
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          {testing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <TestTube className="w-5 h-5" />
          )}
          <span>Probar conexión</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all"
          style={{
            backgroundColor: COLORS.primary,
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 76, 92, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{saving ? 'Guardando...' : 'Guardar configuración'}</span>
        </button>
      </div>

      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: COLORS.primarySubtle,
          borderColor: COLORS.primary + '30',
        }}
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" style={{ color: COLORS.primary }} />
          <h3
            className="text-lg font-semibold"
            style={{ color: COLORS.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Cómo configurar N8N
          </h3>
        </div>
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
                style={{ backgroundColor: COLORS.primary, color: '#FFFFFF' }}
              >
                {index + 1}
              </div>
              <span className="text-sm" style={{ color: COLORS.textPrimary }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: COLORS.surface }}
        >
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            El procesador de cola ejecutará el envío cada 5 minutos automáticamente.
          </p>
        </div>
      </div>
    </div>
  )
}