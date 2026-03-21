'use client'

import { useState } from 'react'
import { Plus, Search, Scissors } from 'lucide-react'
import { useTheme } from 'next-themes'
import { CreateServiceModal } from './CreateServiceModal'
import { ServiceList } from './ServiceList'
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
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}

interface ServicesClientProps {
  services: Service[]
}

export function ServicesClient({ services }: ServicesClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const COLORS = useColors()

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  const activeCount = services.filter((s) => s.active).length
  const inactiveCount = services.length - activeCount

  return (
    <>
      {/* Header con gradiente */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
        style={{ background: COLORS.primaryGradient }}
      >
        {/* Decoraciones */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Catálogo Comercial</p>
              <h1 
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Servicios
              </h1>
              <p className="text-sm mt-1 text-white/80">{services.length} servicio{services.length !== 1 ? 's' : ''} configurado{services.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="
              group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-white/20 hover:bg-white/30 backdrop-blur-sm
              text-white text-sm font-semibold
              transition-all duration-200 cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F4C5C]
            "
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            Nuevo servicio
          </button>
        </div>
      </div>

      {/* Stats Cards - Glassmorphism */}
      {services.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total', value: services.length, icon: Scissors, color: COLORS.primary },
            { label: 'Activos', value: activeCount, icon: Scissors, color: '#16A34A' },
            { label: 'Inactivos', value: inactiveCount, icon: Scissors, color: COLORS.textMuted },
          ].map(({ label, value, icon: Icon, color }, index) => (
            <div
              key={label}
              className="group p-5 rounded-2xl border transition-all duration-300 cursor-default animate-in fade-in slide-in-from-bottom-4"
              style={{ 
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
                boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
                backdropFilter: 'blur(12px)',
                animationDelay: `${index * 50}ms`,
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
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>{value}</p>
              <p className="text-xs font-medium mt-1" style={{ color: COLORS.textSecondary }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search - Glassmorphism */}
      {services.length > 0 && (
        <div 
          className="p-4 rounded-2xl mb-6"
          style={{ 
            backgroundColor: COLORS.surfaceGlass,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${COLORS.border}`
          }}
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: COLORS.textMuted }} pointerEvents="none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar tratamientos o servicios…"
              aria-label="Buscar servicios"
              className="
                w-full pl-10 pr-4 py-2.5 rounded-xl
                border border-transparent
                bg-transparent
                text-sm
                placeholder:text-opacity-60
                focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all
              "
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '10px',
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
            />
          </div>
        </div>
      )}

      {/* Service List Container */}
      <div 
        className="rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ 
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {services.length > 0 && (
          <div 
            className="flex items-center justify-between px-6 py-3.5 border-b"
            style={{ 
              borderColor: COLORS.border,
              backgroundColor: COLORS.surfaceSubtle + '40'
            }}
          >
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                Catálogo
              </span>
            </div>
            {query && (
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <ServiceList services={filtered} allEmpty={services.length === 0} />
      </div>

      <CreateServiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
