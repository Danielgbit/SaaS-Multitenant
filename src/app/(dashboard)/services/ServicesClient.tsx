'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Scissors, X, ChevronDown, Layers, Zap, Clock, DollarSign } from 'lucide-react'
import { useTheme } from 'next-themes'
import { CreateServiceModal } from './CreateServiceModal'
import { ServiceList } from './ServiceList'
import type { Service } from '@/types/services'

type FilterState = 'all' | 'active' | 'inactive'
type SortOption = 'name' | 'price' | 'duration'

function useColors() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? theme === 'dark' : false

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
    mounted,
  }
}

interface ServicesClientProps {
  services: Service[]
}

const STAT_ICONS = {
  total: Layers,
  active: Zap,
  inactive: Clock,
} as const

export function ServicesClient({ services }: ServicesClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterState>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOpen, setSortOpen] = useState(false)
  const COLORS = useColors()

  const activeCount = services.filter((s) => s.active).length
  const inactiveCount = services.length - activeCount

  const filtered = services
    .filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(query.toLowerCase())
      if (filter === 'active') return matchesSearch && s.active
      if (filter === 'inactive') return matchesSearch && !s.active
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price') return a.price - b.price
      if (sortBy === 'duration') return a.duration - b.duration
      return 0
    })

  const statCards = [
    { label: 'Total', value: services.length, icon: STAT_ICONS.total, color: COLORS.primary },
    { label: 'Activos', value: activeCount, icon: STAT_ICONS.active, color: COLORS.success },
    { label: 'Inactivos', value: inactiveCount, icon: STAT_ICONS.inactive, color: COLORS.textMuted },
  ]

  const sortOptions: { value: SortOption; label: string; icon: typeof DollarSign }[] = [
    { value: 'name', label: 'Nombre A-Z', icon: Scissors },
    { value: 'price', label: 'Precio', icon: DollarSign },
    { value: 'duration', label: 'Duración', icon: Clock },
  ]

  const cardHoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(15, 76, 92, 0.12)',
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .services-card-hover {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .services-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15, 76, 92, 0.12);
        }
        .services-filter-tab {
          transition: all 150ms ease;
        }
        .services-filter-tab.active {
          background-color: ${COLORS.primary}15;
          color: ${COLORS.primary};
          border-color: ${COLORS.primary}40;
        }
        .services-sort-option {
          transition: background-color 150ms ease;
        }
        .services-sort-option:hover {
          background-color: ${COLORS.surfaceSubtle};
        }
        @media (prefers-reduced-motion: reduce) {
          .services-card-hover,
          .services-filter-tab,
          .services-sort-option {
            transition: none;
          }
        }
      `}} />

      <div
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
        style={{ background: COLORS.primaryGradient }}
      >
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
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F4C5C]"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            Nuevo servicio
          </button>
        </div>
      </div>

      {services.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, color }, index) => (
            <div
              key={label}
              className="services-card-hover p-5 rounded-2xl border cursor-default animate-in fade-in slide-in-from-bottom-4"
              style={{
                backgroundColor: COLORS.surfaceGlass,
                borderColor: COLORS.border,
                boxShadow: '0 4px 24px rgba(15, 76, 92, 0.08)',
                backdropFilter: 'blur(12px)',
                animationDelay: `${index * 50}ms`,
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

      {services.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            {(['all', 'active', 'inactive'] as FilterState[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`services-filter-tab px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border border-transparent ${filter === f ? 'active' : ''}`}
                style={{
                  color: filter === f ? COLORS.primary : COLORS.textSecondary,
                  backgroundColor: filter === f ? COLORS.primary + '15' : 'transparent',
                  borderColor: filter === f ? COLORS.primary + '40' : 'transparent',
                }}
              >
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
              </button>
            ))}

            <div className="ml-auto relative">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  color: COLORS.textSecondary,
                }}
              >
                {sortOptions.find((o) => o.value === sortBy)?.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${sortOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortOpen && (
                <div
                  className="absolute right-0 top-full mt-2 py-2 rounded-xl border shadow-lg z-20 min-w-[160px]"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                  }}
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(option.value)
                        setSortOpen(false)
                      }}
                      className={`services-sort-option w-full flex items-center gap-3 px-4 py-2.5 text-left ${sortBy === option.value ? 'font-semibold' : ''}`}
                      style={{ color: sortBy === option.value ? COLORS.primary : COLORS.textPrimary }}
                    >
                      <option.icon className="w-4 h-4" style={{ color: sortBy === option.value ? COLORS.primary : COLORS.textMuted }} />
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: COLORS.surfaceGlass,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: COLORS.textMuted }} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tratamientos o servicios…"
                aria-label="Buscar servicios"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border border-transparent bg-transparent placeholder:text-opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: COLORS.textPrimary,
                  backgroundColor: COLORS.surface,
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer"
                  style={{ color: COLORS.textMuted }}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
              backgroundColor: COLORS.surfaceSubtle + '40',
            }}
          >
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                Catálogo
              </span>
            </div>
            {(query || filter !== 'all') && (
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <ServiceList
          services={filtered}
          allEmpty={services.length === 0}
          filter={filter}
          COLORS={COLORS}
        />
      </div>

      <CreateServiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
