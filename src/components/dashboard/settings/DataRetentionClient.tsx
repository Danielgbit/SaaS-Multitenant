'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  Database,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight
} from 'lucide-react'
import { updateRetentionSettings } from '@/actions/appointments/purgeAppointments'
import { PurgeModal } from '@/components/calendar/PurgeModal'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#DCFCE7',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

interface RetentionSettings {
  auto_retention_days: number
  auto_purge_enabled: boolean
}

interface DataRetentionClientProps {
  organizationId: string
  initialSettings?: RetentionSettings | null
}

export function DataRetentionClient({
  organizationId,
  initialSettings
}: DataRetentionClientProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [autoPurgeEnabled, setAutoPurgeEnabled] = useState(false)
  const [retentionDays, setRetentionDays] = useState(90)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialSettings && !hasInitialized) {
      setAutoPurgeEnabled(initialSettings.auto_purge_enabled ?? false)
      setRetentionDays(initialSettings.auto_retention_days ?? 90)
      setHasInitialized(true)
    }
  }, [initialSettings, hasInitialized])

  async function handleSaveSettings() {
    setSaving(true)
    setMessage(null)

    const result = await updateRetentionSettings(organizationId, {
      auto_purge_enabled: autoPurgeEnabled,
      auto_retention_days: retentionDays,
    })

    if (result.success) {
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al guardar' })
    }

    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Auto Purge Card */}
      <div
        className="rounded-2xl border p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: COLORS.primary + '15' }}
          >
            <Database className="w-6 h-6" style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h3
              className="text-lg font-semibold"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: COLORS.textPrimary
              }}
            >
              Purga Automática
            </h3>
            <p
              className="text-sm mt-1"
              style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Elimina automáticamente citas antiguas para mantener tu base de datos limpia
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ backgroundColor: COLORS.surfaceSubtle }}
        >
          <div>
            <p
              className="font-medium"
              style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Habilitar purga automática
            </p>
            <p
              className="text-sm"
              style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Ejecuta diariamente a las 3 AM
            </p>
          </div>
          <button
            onClick={() => setAutoPurgeEnabled(!autoPurgeEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
              autoPurgeEnabled ? '' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            style={{
              backgroundColor: autoPurgeEnabled ? COLORS.primary : undefined,
            }}
            aria-label={autoPurgeEnabled ? 'Deshabilitar purga automática' : 'Habilitar purga automática'}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              autoPurgeEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Retention Days Selector */}
        <div>
          <label
            className="block text-sm font-medium mb-3"
            style={{ color: COLORS.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Retener citas por:
          </label>
          <div className="flex gap-3">
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setRetentionDays(days)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                  retentionDays === days ? 'border-current' : 'border-transparent'
                }`}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backgroundColor: retentionDays === days ? COLORS.primary + '15' : COLORS.surfaceSubtle,
                  borderColor: retentionDays === days ? COLORS.primary : COLORS.border,
                  color: retentionDays === days ? COLORS.primary : COLORS.textSecondary,
                }}
              >
                {days} días
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ backgroundColor: COLORS.primary + '10' }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.primary }} />
          <p
            className="text-sm"
            style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Las citas completadas, canceladas o no-show se eliminarán después del período seleccionado.
            Las citas facturadas están protegidas y nunca se eliminarán automáticamente.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full py-3 px-4 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: COLORS.primaryGradient,
            color: '#FFFFFF',
          }}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          Guardar configuración
        </button>
      </div>

      {/* Manual Purge Card */}
      <div
        className="rounded-2xl border p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: COLORS.warning + '15' }}
          >
            <Trash2 className="w-6 h-6" style={{ color: COLORS.warning }} />
          </div>
          <div>
            <h3
              className="text-lg font-semibold"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: COLORS.textPrimary
              }}
            >
              Limpiar citas ahora
            </h3>
            <p
              className="text-sm mt-1"
              style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Elimina manualmente citas seleccionadas o por fecha específica
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPurgeModal(true)}
          className="w-full py-3 px-4 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            backgroundColor: COLORS.surfaceSubtle,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textPrimary,
          }}
        >
          <Trash2 className="w-5 h-5" />
          Limpiar citas ahora
          <ChevronRight className="w-4 h-4 ml-auto" />
        </button>
      </div>

      {/* Purge Modal */}
      {showPurgeModal && (
        <PurgeModal
          organizationId={organizationId}
          initialTab="selection"
          onClose={() => setShowPurgeModal(false)}
          onSuccess={(deletedCount) => {
            setMessage({
              type: 'success',
              text: `${deletedCount} citas eliminadas correctamente`
            })
            setTimeout(() => setMessage(null), 3000)
          }}
        />
      )}

      {/* Message Toast */}
      {message && (
        <div
          className="fixed top-4 right-4 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 z-50"
          style={{
            backgroundColor: message.type === 'success' ? COLORS.successLight : COLORS.errorLight,
            color: message.type === 'success' ? COLORS.success : COLORS.error,
          }}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{message.text}</span>
        </div>
      )}
    </div>
  )
}