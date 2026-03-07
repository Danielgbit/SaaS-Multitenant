'use client'

import { useState } from 'react'
import { Plus, Search, Scissors } from 'lucide-react'
import { CreateServiceModal } from './CreateServiceModal'
import { ServiceList } from './ServiceList'
import type { Service } from '@/types/services'

interface ServicesClientProps {
  services: Service[]
}

export function ServicesClient({ services }: ServicesClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  )

  const activeCount = services.filter((s) => s.active).length
  const inactiveCount = services.length - activeCount

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0F4C5C] dark:text-[#38BDF8] mb-1">
            Catálogo Comercial
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Servicios
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="
            group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-[#0F4C5C] hover:bg-[#0C3E4A] active:scale-[0.98]
            text-white text-sm font-semibold
            shadow-lg shadow-[#0F4C5C]/20 hover:shadow-xl hover:shadow-[#0F4C5C]/30
            transition-all duration-200 cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2
          "
        >
          <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
          Nuevo servicio
        </button>
      </div>

      {services.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total', value: services.length, color: 'text-slate-700 dark:text-slate-200' },
            { label: 'Activos', value: activeCount, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Inactivos', value: inactiveCount, color: 'text-slate-400 dark:text-slate-500' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 text-center"
            >
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {services.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tratamientos o servicios…"
            aria-label="Buscar servicios"
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl
              border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800/60
              text-sm text-slate-900 dark:text-slate-100
              placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/40 dark:focus:ring-[#38BDF8]/40 focus:border-transparent
              transition-all duration-150
            "
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
        {services.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Catálogo
              </span>
            </div>
            {query && (
              <span className="text-xs text-slate-400">
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
