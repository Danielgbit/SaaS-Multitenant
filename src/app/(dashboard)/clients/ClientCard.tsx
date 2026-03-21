'use client'

import { useTheme } from 'next-themes'
import { UserCircle, Phone, Mail, Calendar, Pencil, Trash2, Sparkles } from 'lucide-react'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #1A6B7C 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const COLORS = useColors()
  const initials = getInitials(client.name)

  return (
    <div
      className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
      style={{
        backgroundColor: COLORS.surfaceGlass,
        borderColor: COLORS.border,
        boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
        backdropFilter: 'blur(12px)',
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
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar con gradiente */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm text-white transition-transform duration-200 group-hover:scale-110"
            style={{
              background: COLORS.primaryGradient,
              boxShadow: '0 4px 12px rgba(15, 76, 92, 0.25)'
            }}
          >
            {initials}
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textPrimary,
              }}
              className="font-semibold text-base"
            >
              {client.name}
            </h3>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textMuted,
              }}
              className="text-xs"
            >
              Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(client)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            style={{ color: COLORS.textSecondary }}
            title="Editar cliente"
            aria-label="Editar cliente"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(client)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            style={{ color: COLORS.error }}
            title="Eliminar cliente"
            aria-label="Eliminar cliente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="space-y-2 mb-4">
        {client.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.textMuted }} />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textSecondary,
              }}
              className="text-sm"
            >
              {client.phone}
            </span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.textMuted }} />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: COLORS.textSecondary,
              }}
              className="text-sm truncate"
            >
              {client.email}
            </span>
          </div>
        )}
        {!client.phone && !client.email && (
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textMuted,
            }}
            className="text-sm italic"
          >
            Sin información de contacto
          </span>
        )}
      </div>

      {/* Notas */}
      {client.notes && (
        <div
          className="text-sm rounded-xl p-3 mb-4"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: COLORS.textSecondary,
            backgroundColor: COLORS.surfaceSubtle,
          }}
        >
          {client.notes}
        </div>
      )}

      {/* Footer con badge y acciones rápidas */}
      <div 
        className="flex items-center justify-between pt-3 border-t"
        style={{ borderColor: COLORS.border }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            backgroundColor: COLORS.successLight, 
            color: COLORS.success 
          }}
        >
          <Sparkles className="w-3 h-3" />
          Activo
        </span>
        <button
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80 cursor-pointer"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: COLORS.primary,
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
          Ver citas
        </button>
      </div>
    </div>
  )
}
