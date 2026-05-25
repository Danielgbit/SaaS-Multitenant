'use client'

import { useState } from 'react'
import { Bell, Settings, Check, AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'
import { updateBookingSettings } from '@/actions/settings/updateBookingSettings'
import { updateOrganization } from '@/actions/settings/updateOrganization'
import { DataRetentionClient } from '@/components/dashboard/settings/DataRetentionClient'
import { TIMEZONES, TABS, defaultBookingSettings } from './settingsConstants'
import type { BookingSettings, OrganizationSettings } from './settingsConstants'
import { SettingsHeader } from './SettingsHeader'

export default function SettingsClient({ 
  organization, 
  organizationId,
  initialBookingSettings 
}: { 
  organization: OrganizationSettings | null
  organizationId: string
  initialBookingSettings?: BookingSettings | null
}) {
  const [activeTab, setActiveTab] = useState('general')
  const [loading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const COLORS = useThemeColors()
  
  const [bookingSettings, setBookingSettings] = useState<Required<BookingSettings>>(
    {
      slot_interval: initialBookingSettings?.slot_interval ?? 30,
      buffer_minutes: initialBookingSettings?.buffer_minutes ?? 0,
      max_days_ahead: initialBookingSettings?.max_days_ahead ?? 60,
      min_notice_hours: initialBookingSettings?.min_notice_hours ?? 24,
      timezone: initialBookingSettings?.timezone ?? 'Europe/Madrid',
      online_booking_enabled: initialBookingSettings?.online_booking_enabled ?? true,
      spa_opening_time: initialBookingSettings?.spa_opening_time ?? '09:00',
      spa_closing_time: initialBookingSettings?.spa_closing_time ?? '20:00',
      auto_retention_days: initialBookingSettings?.auto_retention_days ?? 90,
      auto_purge_enabled: initialBookingSettings?.auto_purge_enabled ?? false,
    }
  )

  const [orgSettings, setOrgSettings] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
  })

  async function handleSaveGeneral() {
    setSaving(true)
    setMessage(null)
    
    const result = await updateBookingSettings(organizationId, bookingSettings as any)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al guardar' })
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleSaveOrganization() {
    setSaving(true)
    setMessage(null)
    
    const result = await updateOrganization(organizationId, orgSettings)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Organización actualizada correctamente' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al guardar' })
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SettingsHeader />

      {/* Message */}
      {message && (
        <div 
          className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2"
          style={{ 
            backgroundColor: message.type === 'success' ? COLORS.successLight : COLORS.errorLight,
            color: message.type === 'success' ? COLORS.success : COLORS.error,
          }}
        >
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span style={{}}>{message.text}</span>
        </div>
      )}

      {/* Tabs con glassmorphism */}
      <div 
        className="border-b mb-8 rounded-t-2xl"
        style={{ 
          borderColor: COLORS.border,
          backgroundColor: COLORS.surfaceGlass,
          backdropFilter: 'blur(12px)',
        }}
      >
        <nav className="flex gap-1 -mb-px px-4" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200
                  ${isActive
                    ? 'border-current'
                    : 'border-transparent'
                  }
                `}
                style={{ 
                  color: isActive ? COLORS.primary : COLORS.textSecondary,
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" style={{ color: COLORS.primary }} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div 
              className="rounded-2xl border p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ 
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div>
                <h3 
                  className="text-lg font-semibold mb-1 font-heading"
                  style={{ 
                    color: COLORS.textPrimary 
                  }}
                >
                  Configuración de reservas
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  Ajusta cómo funcionan las reservas online
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Intervalo de cita (minutos)
                  </label>
                  <select
                    value={bookingSettings.slot_interval}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, slot_interval: Number(e.target.value) })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{ 
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {[15, 20, 30, 45, 60, 90, 120].map((min) => (
                      <option key={min} value={min}>{min} minutos</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Tiempo entre citas (minutos)
                  </label>
                  <select
                    value={bookingSettings.buffer_minutes}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, buffer_minutes: Number(e.target.value) })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{ 
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {[0, 5, 10, 15, 20, 30, 45, 60].map((min) => (
                      <option key={min} value={min}>{min} minutos</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Reservas con máximo (días)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={bookingSettings.max_days_ahead}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, max_days_ahead: Number(e.target.value) })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{ 
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Anticipación mínima (horas)
                  </label>
                  <select
                    value={bookingSettings.min_notice_hours}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, min_notice_hours: Number(e.target.value) })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{ 
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {[0, 1, 2, 4, 12, 24, 48, 72].map((h) => (
                      <option key={h} value={h}>{h === 0 ? 'Sin límite' : `${h} horas`}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Hora apertura spa
                  </label>
                  <input
                    type="time"
                    value={bookingSettings.spa_opening_time || '09:00'}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, spa_opening_time: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Hora cierre spa
                  </label>
                  <input
                    type="time"
                    value={bookingSettings.spa_closing_time || '20:00'}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, spa_closing_time: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between pt-4 border-t"
                style={{ borderColor: COLORS.border }}
              >
                <div>
                  <p
                    className="font-medium"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Reservas online
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Permite a clientes reservar desde la web
                  </p>
                </div>
                <button
                  onClick={() => setBookingSettings({ ...bookingSettings, online_booking_enabled: !bookingSettings.online_booking_enabled })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    bookingSettings.online_booking_enabled 
                      ? '' 
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  style={{ 
                    backgroundColor: bookingSettings.online_booking_enabled ? COLORS.primary : undefined,
                  }}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    bookingSettings.online_booking_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="w-full py-3 px-4 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ 
                  background: COLORS.primaryGradient,
                  color: '#FFFFFF',
                }}
              >
                {saving ? <Spinner size="sm" className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                Guardar cambios
              </button>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === 'organization' && (
            <div 
              className="rounded-2xl border p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ 
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div>
                <h3 
                  className="text-lg font-semibold mb-1 font-heading"
                  style={{ 
                    color: COLORS.textPrimary 
                  }}
                >
                  Información de la organización
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  Datos públicos de tu negocio
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    value={orgSettings.name}
                    onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                    style={{ 
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium mb-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    Slug (URL pública)
                  </label>
                  <div className="flex">
                    <span 
                      className="inline-flex items-center px-4 rounded-l-xl border border-r-0 text-sm"
                      style={{ 
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.surfaceSubtle,
                        color: COLORS.textMuted,
                      }}
                    >
                      pruegressy.com/reservar/
                    </span>
                    <input
                      type="text"
                      value={orgSettings.slug}
                      onChange={(e) => setOrgSettings({ ...orgSettings, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className={`flex-1 px-4 py-2.5 rounded-r-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                      style={{ 
                        borderColor: COLORS.border,
                        color: COLORS.textPrimary,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.surfaceSubtle }}
              >
                <p 
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  <strong style={{ color: COLORS.textPrimary }}>URL de reservas:</strong>{' '}
                  <a 
                    href={`/reservar/${orgSettings.slug}`} 
                    className="hover:underline transition-colors"
                    style={{ color: COLORS.primary }}
                  >
                    pruegressy.com/reservar/{orgSettings.slug}
                  </a>
                </p>
              </div>

              <button
                onClick={handleSaveOrganization}
                disabled={saving}
                className="w-full py-3 px-4 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ 
                  background: COLORS.primaryGradient,
                  color: '#FFFFFF',
                }}
              >
                {saving ? <Spinner size="sm" className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                Guardar cambios
              </button>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div 
              className="rounded-2xl border p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ 
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div>
                <h3 
                  className="text-lg font-semibold mb-1 font-heading"
                  style={{ 
                    color: COLORS.textPrimary 
                  }}
                >
                  Zona horaria
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  Configura la zona horaria para las citas
                </p>
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  Zona horaria
                </label>
                <select
                  value={bookingSettings.timezone}
                  onChange={(e) => setBookingSettings({ ...bookingSettings, timezone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                  style={{ 
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                  }}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="w-full py-3 px-4 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ 
                  background: COLORS.primaryGradient,
                  color: '#FFFFFF',
                }}
              >
                {saving ? <Spinner size="sm" className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                Guardar cambios
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div 
              className="rounded-2xl border p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ 
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div>
                <h3 
                  className="text-lg font-semibold mb-1 font-heading"
                  style={{ 
                    color: COLORS.textPrimary 
                  }}
                >
                  Notificaciones
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.textSecondary }}
                >
                  Configura cómo recibes actualizaciones
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="/whatsapp"
                  className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer"
                  style={{ 
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#DCFCE7' }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#16A34A">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div>
                      <p 
                        className="font-medium"
                        style={{ color: COLORS.textPrimary }}
                      >
                        WhatsApp
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: COLORS.textSecondary }}
                      >
                        Configura recordatorios por WhatsApp
                      </p>
                    </div>
                  </div>
                  <span style={{ color: COLORS.textMuted }}>→</span>
                </a>

                <a
                  href="/email"
                  className="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer"
                  style={{ 
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#DBEAFE' }}
                    >
                      <Bell className="w-5 h-5" style={{ color: '#2563EB' }} />
                    </div>
                    <div>
                      <p 
                        className="font-medium"
                        style={{ color: COLORS.textPrimary }}
                      >
                        Email
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: COLORS.textSecondary }}
                      >
                        Configura recordatorios por email
                      </p>
                    </div>
                  </div>
                  <span style={{ color: COLORS.textMuted }}>→</span>
                </a>
              </div>
            </div>
          )}

          {/* Data Retention Tab */}
          {activeTab === 'data-retention' && (
            <DataRetentionClient
              organizationId={organizationId}
            />
          )}
        </div>
      )}
    </div>
  )
}
