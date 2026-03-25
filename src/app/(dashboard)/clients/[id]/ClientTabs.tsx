'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ArrowLeft, User, Calendar, FileText, Pencil, Trash2, Phone, Mail, MapPin, CalendarCheck2, Clock, CheckCircle2, XCircle, MessageCircle, BellOff } from 'lucide-react'
import type { Database } from '@/../types/supabase'
import { EditClientModal } from '../EditClientModal'
import { DeleteClientModal } from '../DeleteClientModal'

type Client = Database['public']['Tables']['clients']['Row']
type AppointmentRow = Database['public']['Tables']['appointments']['Row']

interface ClientTabsProps {
  client: Client
  appointments: AppointmentRow[]
  organizationId: string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getConfirmationMethodLabel(method: string | null): string {
  switch (method) {
    case 'whatsapp':
      return 'Por WhatsApp'
    case 'phone_call':
      return 'Confirmado por llamada'
    case 'in_person':
      return 'Confirmado en persona'
    case 'none':
      return 'No desea mensajes'
    default:
      return 'No especificado'
  }
}

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
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#D97706',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

type TabId = 'info' | 'appointments' | 'notes'

const tabs = [
  { id: 'info' as const, label: 'Información', icon: User },
  { id: 'appointments' as const, label: 'Citas', icon: Calendar },
  { id: 'notes' as const, label: 'Notas', icon: FileText },
]

function InfoTab({ client }: { client: Client }) {
  const COLORS = useColors()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div 
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 
            className="text-lg font-semibold"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: COLORS.textPrimary,
            }}
          >
            Información de contacto
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              style={{ color: COLORS.textSecondary }}
              title="Editar cliente"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleting(true)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
              style={{ color: COLORS.error }}
              title="Eliminar cliente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.primary + '15' }}
            >
              <User className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontSize: '12px' }}>
                Nombre
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary, fontWeight: '500' }}>
                {client.name}
              </p>
            </div>
          </div>

          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.primary + '15' }}
              >
                <Mail className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontSize: '12px' }}>
                  Correo electrónico
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.primary, fontWeight: '500' }}>
                  {client.email}
                </p>
              </div>
            </a>
          )}

          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.primary + '15' }}
              >
                <Phone className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontSize: '12px' }}>
                  Teléfono
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.primary, fontWeight: '500' }}>
                  {client.phone}
                </p>
              </div>
            </a>
          )}

          {!client.email && !client.phone && (
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontStyle: 'italic' }}>
              Sin información de contacto
            </p>
          )}
        </div>
      </div>

      <div 
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ 
            fontFamily: "'Cormorant Garamond', serif",
            color: COLORS.textPrimary,
          }}
        >
          Detalles
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.success + '15' }}
            >
              <CalendarCheck2 className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontSize: '12px' }}>
                Cliente desde
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary, fontWeight: '500' }}>
                {formatDate(client.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="p-5 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ 
            fontFamily: "'Cormorant Garamond', serif",
            color: COLORS.textPrimary,
          }}
        >
          Preferencias de Contacto
        </h3>

        <div className="space-y-3">
          {client.confirmations_enabled ? (
            <div 
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: COLORS.success + '10' }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.success + '20' }}
              >
                <MessageCircle className="w-5 h-5" style={{ color: COLORS.success }} />
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary, fontWeight: '500' }}>
                  WhatsApp activo
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, fontSize: '13px' }}>
                  {client.phone || 'Sin número'}
                </p>
              </div>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: COLORS.success + '20',
                  color: COLORS.success,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Activo
              </span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: COLORS.border }}
              >
                <BellOff className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              </div>
              <div className="flex-1">
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary, fontWeight: '500' }}>
                  Confirmaciones pausadas
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, fontSize: '13px' }}>
                  {getConfirmationMethodLabel(client.confirmation_method)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {client.notes && (
        <div 
          className="p-5 rounded-2xl border"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            borderColor: COLORS.border,
            backdropFilter: 'blur(12px)',
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: COLORS.textPrimary,
            }}
          >
            Notas
          </h3>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, lineHeight: '1.6' }}>
            {client.notes}
          </p>
        </div>
      )}

      {editing && (
        <EditClientModal
          client={client}
          organizationId={client.organization_id}
          isOpen={editing}
          onClose={() => setEditing(false)}
          onSuccess={handleSuccess}
        />
      )}

      {deleting && (
        <DeleteClientModal
          client={client}
          organizationId={client.organization_id}
          isOpen={deleting}
          onClose={() => setDeleting(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

function AppointmentsTab({ appointments }: { appointments: AppointmentRow[] }) {
  const COLORS = useColors()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: COLORS.successLight, text: COLORS.success, icon: CheckCircle2 }
      case 'cancelled':
        return { bg: COLORS.errorLight, text: COLORS.error, icon: XCircle }
      case 'pending':
        return { bg: COLORS.warningLight, text: COLORS.warning, icon: Clock }
      default:
        return { bg: COLORS.surfaceSubtle, text: COLORS.textSecondary, icon: Calendar }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada'
      case 'cancelled': return 'Cancelada'
      case 'pending': return 'Pendiente'
      case 'completed': return 'Completada'
      default: return status
    }
  }

  if (appointments.length === 0) {
    return (
      <div 
        className="text-center py-12 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div 
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '15' }}
        >
          <Calendar className="w-8 h-8" style={{ color: COLORS.primary }} />
        </div>
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ 
            fontFamily: "'Cormorant Garamond', serif",
            color: COLORS.textPrimary,
          }}
        >
          Sin citas
        </h3>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, fontSize: '14px' }}>
          Este cliente aún no tiene citas registradas
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment, index) => {
        const statusStyle = getStatusColor(appointment.status || 'pending')
        const StatusIcon = statusStyle.icon

        return (
          <div
            key={appointment.id}
            className="p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer"
            style={{
              backgroundColor: COLORS.surfaceGlass,
              borderColor: COLORS.border,
              backdropFilter: 'blur(12px)',
              animationDelay: `${index * 50}ms`,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: statusStyle.bg }}
                >
                  <StatusIcon className="w-5 h-5" style={{ color: statusStyle.text }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {getStatusLabel(appointment.status || 'pending')}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary, fontWeight: '500' }}>
                    {appointment.notes || 'Cita'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, fontSize: '13px' }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(appointment.start_time)}
                    </span>
                    <span className="flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, fontSize: '13px' }}>
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(appointment.start_time)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NotesTab({ client }: { client: Client }) {
  const COLORS = useColors()

  return (
    <div 
      className="p-6 rounded-2xl border"
      style={{
        backgroundColor: COLORS.surfaceGlass,
        borderColor: COLORS.border,
        backdropFilter: 'blur(12px)',
      }}
    >
      <h3 
        className="text-lg font-semibold mb-4"
        style={{ 
          fontFamily: "'Cormorant Garamond', serif",
          color: COLORS.textPrimary,
        }}
      >
        Notas del cliente
      </h3>
      
      {client.notes ? (
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary, lineHeight: '1.7' }}>
          {client.notes}
        </p>
      ) : (
        <div className="text-center py-8">
          <div 
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: COLORS.surfaceSubtle }}
          >
            <FileText className="w-6 h-6" style={{ color: COLORS.textMuted }} />
          </div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontSize: '14px' }}>
            Sin notas registradas
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textMuted, fontSize: '12px', marginTop: '4px' }}>
            Edita el cliente para añadir notas
          </p>
        </div>
      )}
    </div>
  )
}

export function ClientTabs({ client, appointments, organizationId }: ClientTabsProps) {
  const COLORS = useColors()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('info')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const initials = getInitials(client.name)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Volver
          </Link>
          
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
              style={{
                background: COLORS.primaryGradient,
                boxShadow: `0 8px 24px ${COLORS.primary}40`,
              }}
            >
              {initials}
            </div>
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  color: COLORS.textPrimary,
                }}
              >
                {client.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  <CalendarCheck2 className="w-3.5 h-3.5" />
                  {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: COLORS.textMuted }}>
                  Desde {formatDate(client.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: COLORS.surface,
              color: COLORS.primary,
              border: `1.5px solid ${COLORS.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => setDeleting(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: COLORS.surface,
              color: COLORS.error,
              border: `1.5px solid ${COLORS.border}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </header>

      <div 
        className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden"
      >
        <nav className="flex border-b border-slate-100/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/30 relative">
          <div 
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#0F4C5C] to-[#38BDF8] transition-all duration-300 ease-out"
            style={{
              width: `${100 / tabs.length}%`,
              left: `${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}%`
            }}
          />
          
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium
                  transition-all duration-200 relative z-10
                  ${isActive 
                    ? 'text-[#0F4C5C] dark:text-[#38BDF8] bg-white/50 dark:bg-slate-800/50' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/30 dark:hover:bg-slate-700/30'
                  }
                `}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-6 sm:p-8">
          <div className="animate-fade-in">
            {activeTab === 'info' && <InfoTab client={client} />}
            {activeTab === 'appointments' && <AppointmentsTab appointments={appointments} />}
            {activeTab === 'notes' && <NotesTab client={client} />}
          </div>
        </div>
      </div>

      {editing && (
        <EditClientModal
          client={client}
          organizationId={organizationId}
          isOpen={editing}
          onClose={() => setEditing(false)}
          onSuccess={handleSuccess}
        />
      )}

      {deleting && (
        <DeleteClientModal
          client={client}
          organizationId={organizationId}
          isOpen={deleting}
          onClose={() => setDeleting(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
