'use client'

import { useState, useTransition } from 'react'
import { Pencil, ToggleLeft, ToggleRight, Loader2, Scissors, Clock, DollarSign } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toggleServiceStatus } from '@/actions/services/toggleServiceStatus'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { formatDuration } from '@/lib/utils/formatTime'
import { EditServiceModal } from './EditServiceModal'
import type { Service } from '@/types/services'

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
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    isDark,
  }
}

interface ServiceListProps {
  services: Service[]
  allEmpty: boolean
}

export function ServiceList({ services, allEmpty }: ServiceListProps) {
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const COLORS = useColors()

  function handleToggle(service: Service) {
    setLoadingId(service.id)
    startTransition(async () => {
      await toggleServiceStatus(service.id, !service.active)
      setLoadingId(null)
    })
  }

  if (allEmpty) {
    return (
      <div 
        className="text-center py-16 px-8 animate-in fade-in duration-300"
        style={{ 
          backgroundColor: COLORS.surfaceGlass,
          border: `1px solid ${COLORS.border}`,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
          <Scissors className="w-10 h-10" style={{ color: COLORS.primary }} />
        </div>
        <p className="font-semibold text-lg mb-2" style={{ color: COLORS.textPrimary }}>
          Sin catálogo de servicios
        </p>
        <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>
          Los servicios que ofreces aparecerán aquí. Comienza creando el primero para usarlos en el calendario.
        </p>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div 
        className="text-center py-12 px-8 animate-in fade-in duration-300"
        style={{ backgroundColor: COLORS.surface }}
      >
        <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
          Ningún servicio coincide con la búsqueda
        </p>
      </div>
    )
  }

  return (
    <>
      <ul role="list" className="divide-y" style={{ borderColor: COLORS.border }}>
        {services.map((service, index) => (
          <li
            key={service.id}
            className="
              flex items-center gap-4 px-6 py-4
              transition-all duration-300 group cursor-default
            "
            style={{ 
              backgroundColor: COLORS.surface,
              animationDelay: `${index * 40}ms`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(15, 76, 92, 0.03)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.surface
            }}
          >
            {/* Avatar con Gradiente */}
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                transition-transform duration-200 group-hover:scale-110
                ${service.active ? '' : 'opacity-50'}
              `}
              style={{
                background: service.active ? COLORS.primaryGradient : `linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textMuted} 100%)`,
                boxShadow: service.active ? '0 4px 12px rgba(15, 76, 92, 0.25)' : 'none'
              }}
              aria-hidden="true"
            >
              <Scissors className="w-5 h-5 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
              <div className="flex-1">
                <p className={`text-sm font-semibold truncate transition-colors duration-150 ${service.active ? '' : 'line-through decoration-1'}`}
                  style={{ 
                    color: service.active ? COLORS.textPrimary : COLORS.textMuted
                  }}
                >
                  {service.name}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textSecondary }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} aria-hidden="true" />
                    <span>{formatDuration(service.duration)}</span>
                  </p>
                  <p className="text-xs flex items-center gap-1.5 border-l pl-4" style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                    <DollarSign className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} aria-hidden="true" />
                    <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                      {formatCurrencyCOP(service.price)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`
                  hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full mr-2
                  transition-all duration-200
                `}
                style={{ 
                  backgroundColor: service.active ? COLORS.successLight : COLORS.surfaceSubtle,
                  color: service.active ? COLORS.success : COLORS.textMuted,
                  border: `1px solid ${service.active ? COLORS.success + '30' : COLORS.border}`
                }}
                aria-label={`Estado: ${service.active ? 'Activo' : 'Inactivo'}`}
              >
                {service.active ? 'Activo' : 'Inactivo'}
              </span>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setEditTarget(service)}
                aria-label={`Editar servicio ${service.name}`}
                className={`
                  p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center
                  opacity-0 group-hover:opacity-100
                  transition-all duration-200 cursor-pointer
                  focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  ${COLORS.isDark ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-[#0F4C5C]'}
                `}
                style={{ 
                  color: COLORS.textSecondary,
                  backgroundColor: COLORS.surfaceSubtle,
                }}
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Toggle button */}
              <button
                type="button"
                onClick={() => handleToggle(service)}
                disabled={loadingId === service.id}
                aria-label={service.active ? `Desactivar ${service.name}` : `Activar ${service.name}`}
                aria-pressed={service.active}
                className={`
                  p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center
                  transition-all duration-200 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  ${COLORS.isDark ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-[#0F4C5C]'}
                `}
                style={{ 
                  backgroundColor: COLORS.surfaceSubtle,
                }}
              >
                {loadingId === service.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: COLORS.textMuted }} />
                ) : service.active ? (
                  <ToggleRight className="w-5 h-5" style={{ color: COLORS.success }} />
                ) : (
                  <ToggleLeft className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                )}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <EditServiceModal
        service={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </>
  )
}
