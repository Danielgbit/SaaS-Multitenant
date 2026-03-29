'use client'

import { useState } from 'react'
import { Plus, Users, Search } from 'lucide-react'
import { CreateEmployeeModal } from './CreateEmployeeModal'
import { EmployeeList } from './EmployeeList'
import { InviteEmployeeModal } from './InviteEmployeeModal'
import type { Employee } from '@/types/employees'
import type { AvailabilitySummary } from '@/services/availability/getAvailability'
import type { Invitation } from '@/types/invitations'

interface EmployeesClientProps {
  employees: Employee[]
  availabilityMap: Map<string, AvailabilitySummary>
  invitationMap: Map<string, Invitation>
  organizationId: string
  userRole: string
}

export function EmployeesClient({ 
  employees, 
  availabilityMap, 
  invitationMap,
  organizationId,
  userRole
}: EmployeesClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [inviteTarget, setInviteTarget] = useState<Employee | null>(null)
  const [query, setQuery] = useState('')

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    (e.phone ?? '').includes(query)
  )

  const activeCount = employees.filter((e) => e.active).length
  const inactiveCount = employees.length - activeCount

  return (
    <>
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F4C5C]/8 via-[#0F4C5C]/4 to-transparent dark:from-[#38BDF8]/10 dark:via-[#38BDF8]/5 rounded-2xl -m-4" />
        <div className="relative px-2 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#0F4C5C] dark:text-[#38BDF8] mb-1">
                Gestión de equipo
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Empleados
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4d] hover:from-[#0C3E4A] hover:to-[#083242] active:scale-[0.98] text-white text-sm font-semibold shadow-xl shadow-[#0F4C5C]/25 hover:shadow-2xl hover:shadow-[#0F4C5C]/30 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
              <span className="relative">Nuevo empleado</span>
            </button>
          </div>
        </div>
      </div>

      {employees.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: employees.length, icon: Users, color: 'from-slate-500 to-slate-600', text: 'text-slate-600 dark:text-slate-300' },
            { label: 'Activos', value: activeCount, icon: Users, color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Inactivos', value: inactiveCount, icon: Users, color: 'from-slate-400 to-slate-500', text: 'text-slate-500 dark:text-slate-400' },
          ].map(({ label, value, icon: Icon, color, text }, index) => (
            <div
              key={label}
              className="group relative overflow-hidden bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`} />
              <div className="relative">
                <p className={`text-3xl sm:text-4xl font-bold tabular-nums ${text}`}>
                  {value}
                </p>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {employees.length > 0 && (
        <div className="relative mb-6 group">
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <div className="pl-4">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors duration-200" />
            </div>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            aria-label="Buscar empleados"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-md shadow-slate-200/30 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]/30 dark:focus:ring-[#38BDF8]/30 focus:border-[#0F4C5C]/50 dark:focus:border-[#38BDF8]/50 focus:shadow-xl focus:shadow-[#0F4C5C]/10 transition-all duration-200"
          />
        </div>
      )}

      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {employees.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Equipo de trabajo
              </span>
            </div>
            {query && (
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <EmployeeList 
          employees={filtered} 
          allEmpty={employees.length === 0} 
          availabilityMap={availabilityMap} 
          invitationMap={invitationMap}
          organizationId={organizationId}
          userRole={userRole}
          onInvite={(employee) => setInviteTarget(employee)}
        />
      </div>

      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {inviteTarget && (
        <InviteEmployeeModal
          isOpen={!!inviteTarget}
          employee={inviteTarget}
          onClose={() => setInviteTarget(null)}
        />
      )}
    </>
  )
}
