'use client'

import { UserCircle, Phone, Mail, Calendar, Pencil, Trash2 } from 'lucide-react'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

// Generar iniciales del nombre
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Design system tokens (light mode only)
const DS = {
  primary: '#0F4C5C',
  primaryLight: '#E6F1F4',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  success: '#16A34A',
  error: '#DC2626',
  radius: {
    lg: '16px',
    md: '10px',
  },
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const initials = getInitials(client.name)

  return (
    <div
      style={{
        backgroundColor: DS.surface,
        borderRadius: DS.radius.lg,
        border: `1px solid ${DS.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      className="p-5 hover:shadow-md transition-shadow duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar con iniciales */}
          <div
            style={{
              backgroundColor: DS.primaryLight,
              color: DS.primary,
            }}
            className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm"
          >
            {initials}
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.textPrimary,
              }}
              className="font-semibold text-base"
            >
              {client.name}
            </h3>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.textSecondary,
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(client)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            style={{ color: DS.textSecondary }}
            title="Editar cliente"
            aria-label="Editar cliente"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(client)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            style={{ color: DS.error }}
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
            <Phone className="w-4 h-4" style={{ color: DS.textSecondary }} />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.textSecondary,
              }}
              className="text-sm"
            >
              {client.phone}
            </span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" style={{ color: DS.textSecondary }} />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.textSecondary,
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
              color: DS.textSecondary,
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
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: DS.textSecondary,
          }}
          className="text-sm bg-slate-50 rounded-lg p-3 mb-4"
        >
          {client.notes}
        </div>
      )}

      {/* Footer con badge y acciones rápidas */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: DS.border }}>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
        >
          Activo
        </span>
        <button
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: DS.primary,
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
          Ver citas
        </button>
      </div>
    </div>
  )
}
