'use client'

import { useState, useTransition } from 'react'
import { Pencil, ToggleLeft, ToggleRight, Loader2, Scissors, Clock, DollarSign, Sparkles } from 'lucide-react'
import { toggleServiceStatus } from '@/actions/services/toggleServiceStatus'
import { formatCurrencyCOP } from '@/lib/billing/utils'
import { formatDuration } from '@/lib/utils/formatTime'
import { EditServiceModal } from './EditServiceModal'
import type { Service } from '@/types/services'

interface Colors {
  primary: string
  primaryLight: string
  primaryGradient: string
  surface: string
  surfaceSubtle: string
  surfaceGlass: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  successLight: string
  error: string
  errorLight: string
  isDark: boolean
}

type FilterState = 'all' | 'active' | 'inactive'

interface ServiceListProps {
  services: Service[]
  allEmpty: boolean
  filter?: FilterState
  COLORS: Colors
}

function ScissorsIllustration({ color }: { color: string }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-6"
    >
      <circle cx="40" cy="40" r="38" fill={color} fillOpacity="0.1" />
      <circle cx="40" cy="40" r="28" fill={color} fillOpacity="0.15" />
      <g transform="translate(20, 20)">
        <path
          d="M20 8L20 8C22.2091 8 24 9.79086 24 12L24 28C24 30.2091 22.2091 32 20 32L20 32C17.7909 32 16 30.2091 16 28L16 12C16 9.79086 17.7909 8 20 8Z"
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 8L12 8C14.2091 8 16 9.79086 16 12L16 28C16 30.2091 14.2091 32 12 32L12 32C9.79086 32 8 30.2091 8 28L8 12C8 9.79086 9.79086 8 12 8Z"
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 8C22.2091 8 24 9.79086 24 12L24 28C24 30.2091 22.2091 32 20 32"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 8C9.79086 8 8 9.79086 8 12L8 28C8 30.2091 9.79086 32 12 32"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="4" fill={color} />
        <circle cx="12" cy="20" r="4" fill={color} />
        <path d="M16 20H16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </g>
      <Sparkles
        className="absolute"
        style={{
          top: '12px',
          right: '12px',
          width: '16px',
          height: '16px',
          color: color,
        }}
      />
    </svg>
  )
}

export function ServiceList({ services, allEmpty, filter = 'all', COLORS }: ServiceListProps) {
  const [editTarget, setEditTarget] = useState<Service | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

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
          backgroundColor: COLORS.surface,
        }}
      >
        <div
          className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '15' }}
        >
          <ScissorsIllustration color={COLORS.primary} />
        </div>
        <p
          className="text-xl font-semibold mb-3"
          style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
        >
          Sin catálogo de servicios
        </p>
        <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: COLORS.textSecondary }}>
          Los servicios que ofreces aparecerán aquí. Comienza creando el primero para usarlos en el calendario de reservas.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: COLORS.textMuted }}>
          <Sparkles className="w-4 h-4" />
          <span>Tip: Usa nombres descriptivos y precios claros</span>
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div
        className="text-center py-12 px-8 animate-in fade-in duration-300"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '10' }}
        >
          <Scissors className="w-6 h-6" style={{ color: COLORS.primary }} />
        </div>
        <p className="text-sm font-medium" style={{ color: COLORS.textSecondary }}>
          Ningún servicio coincide con los filtros seleccionados
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          Prueba cambiando los filtros o la búsqueda
        </p>
      </div>
    )
  }

  const hoverBg = COLORS.isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(15, 76, 92, 0.03)'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .service-row-hover {
          transition: background-color 200ms ease;
        }
        .service-row-hover:hover {
          background-color: ${hoverBg};
        }
        @media (prefers-reduced-motion: reduce) {
          .service-row-hover {
            transition: none;
          }
        }
      `}} />

      <ul role="list" className="divide-y" style={{ borderColor: COLORS.border }}>
        {services.map((service, index) => (
          <li
            key={service.id}
            className="service-row-hover flex items-center gap-4 px-6 py-4 cursor-default"
            style={{
              backgroundColor: COLORS.surface,
              animationDelay: `${index * 30}ms`,
            }}
          >
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                transition-transform duration-200 group-hover:scale-110
                ${service.active ? '' : 'opacity-50 grayscale'}
              `}
              style={{
                background: service.active ? COLORS.primaryGradient : `linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textMuted} 100%)`,
                boxShadow: service.active ? '0 4px 12px rgba(15, 76, 92, 0.25)' : 'none',
              }}
              aria-hidden="true"
            >
              <Scissors className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold truncate ${service.active ? '' : 'line-through decoration-1 opacity-60'}`}
                  style={{ color: service.active ? COLORS.textPrimary : COLORS.textMuted }}
                >
                  {service.name}
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs flex items-center gap-1.5" style={{ color: COLORS.textSecondary }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} aria-hidden="true" />
                    <span>{formatDuration(service.duration)}</span>
                  </p>
                  <p
                    className="text-xs flex items-center gap-1.5 border-l pl-4"
                    style={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
                  >
                    <DollarSign className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} aria-hidden="true" />
                    <span className="font-medium" style={{ color: COLORS.textPrimary }}>
                      {formatCurrencyCOP(service.price)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className="hidden sm:inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full mr-2 transition-all duration-200"
                style={{
                  backgroundColor: service.active ? COLORS.successLight : COLORS.surfaceSubtle,
                  color: service.active ? COLORS.success : COLORS.textMuted,
                  border: `1px solid ${service.active ? COLORS.success + '30' : COLORS.border}`,
                }}
                aria-label={`Estado: ${service.active ? 'Activo' : 'Inactivo'}`}
              >
                {service.active ? 'Activo' : 'Inactivo'}
              </span>

              <button
                type="button"
                onClick={() => setEditTarget(service)}
                aria-label={`Editar servicio ${service.name}`}
                className={`p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${COLORS.isDark ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-[#0F4C5C]'}`}
                style={{
                  color: COLORS.textSecondary,
                  backgroundColor: COLORS.surfaceSubtle,
                }}
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleToggle(service)}
                disabled={loadingId === service.id}
                aria-label={service.active ? `Desactivar ${service.name}` : `Activar ${service.name}`}
                aria-pressed={service.active}
                className={`p-2.5 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${COLORS.isDark ? 'focus-visible:ring-sky-400' : 'focus-visible:ring-[#0F4C5C]'}`}
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

      <EditServiceModal service={editTarget} onClose={() => setEditTarget(null)} />
    </>
  )
}
