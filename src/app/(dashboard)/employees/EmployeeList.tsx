'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Pencil, ToggleLeft, ToggleRight, Phone, UserCircle2, Loader2, Clock, Calendar, AlertCircle, RefreshCw, Plus, Search, MoreVertical, UserX, Trash2 } from 'lucide-react'
import { toggleEmployeeStatus } from '@/actions/employees/toggleEmployeeStatus'
import { EditEmployeeModal } from './EditEmployeeModal'
import { DeleteEmployeeModal } from './DeleteEmployeeModal'
import { PermanentDeleteModal } from './PermanentDeleteModal'
import { resendInvitation } from '@/actions/invitations/resendInvitation'
import { cancelInvitation } from '@/actions/invitations/cancelInvitation'
import type { Employee } from '@/types/employees'
import type { AvailabilitySummary } from '@/services/availability/getAvailability'
import type { Invitation } from '@/types/invitations'

interface EmployeeListProps {
  employees: Employee[]
  allEmpty: boolean
  availabilityMap: Map<string, AvailabilitySummary>
  invitationMap: Map<string, Invitation>
  organizationId: string
  userRole: string
  onInvite: (employee: Employee) => void
}

export function EmployeeList({
  employees,
  allEmpty,
  availabilityMap,
  invitationMap,
  organizationId,
  userRole,
  onInvite
}: EmployeeListProps) {
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<Employee | null>(null)
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleToggle(employee: Employee) {
    setLoadingId(employee.id)
    setOpenMenuId(null)
    startTransition(async () => {
      await toggleEmployeeStatus(employee.id, !employee.active)
      setLoadingId(null)
    })
  }

  function handleResendInvitation(invitationId: string) {
    setLoadingId(invitationId)
    setOpenMenuId(null)
    startTransition(async () => {
      await resendInvitation({ invitationId })
      setLoadingId(null)
    })
  }

  function handleCancelInvitation(invitationId: string) {
    setLoadingId(invitationId)
    setOpenMenuId(null)
    startTransition(async () => {
      await cancelInvitation({ invitationId })
      setLoadingId(null)
    })
  }

  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0F4C5C]/10 to-[#38BDF8]/10 dark:from-[#38BDF8]/10 dark:to-[#0F4C5C]/5 flex items-center justify-center">
            <UserCircle2 className="w-12 h-12 text-[#0F4C5C]/30 dark:text-[#38BDF8]/50" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
            <Plus className="w-3 h-3 text-[#0F4C5C]/40 dark:text-[#38BDF8]/40" />
          </div>
        </div>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Sin empleados registrados
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          Tu equipo aparecerá aquí. Comienza creando el primer empleado para gestionar tu negocio.
        </p>
      </div>
    )
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Ningún empleado coincide con la búsqueda
        </p>
      </div>
    )
  }

  return (
    <>
      <ul role="list" className="divide-y divide-slate-100/60 dark:divide-slate-700/40" ref={menuRef}>
        {employees.map((employee, index) => {
          const hasAccess = !!employee.user_id
          const hasPendingInvite = invitationMap.get(employee.id)?.status === 'pending'
          const invitation = invitationMap.get(employee.id)
          const isMenuOpen = openMenuId === employee.id
          const avail = availabilityMap.get(employee.id)

          const liClassName = employee.active
            ? 'hover:bg-slate-50/80 dark:hover:bg-slate-700/20'
            : 'bg-slate-50/30 dark:bg-slate-800/10 opacity-60 hover:opacity-80'

          const avatarClassName = employee.active
            ? 'bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] text-white shadow-lg shadow-[#0F4C5C]/25'
            : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 text-slate-500 dark:text-slate-400'

          const nameClassName = employee.active
            ? 'text-slate-900 dark:text-slate-100'
            : 'text-slate-400 dark:text-slate-500 line-through decoration-2'

          const availBadgeClassName = avail?.is_complete
            ? 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 ring-emerald-200/50 dark:ring-emerald-800/40'
            : 'bg-slate-100/80 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400 ring-slate-200/50 dark:ring-slate-600/40'

          return (
            <li
              key={employee.id}
              className={`relative flex items-center gap-4 px-6 py-5 transition-all duration-200 ease-out animate-fade-in ${liClassName}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {!employee.active && (
                <span className="absolute top-2 right-16 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-500 dark:bg-slate-700 dark:text-slate-400 flex items-center gap-1">
                  <UserX className="w-2.5 h-2.5" />
                  Dado de baja
                </span>
              )}

              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold transition-all duration-300 group-hover:scale-105 ${avatarClassName}`}>
                {employee.name.charAt(0).toUpperCase()}
                {hasAccess && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/employees/${employee.id}`}
                    className={`text-sm font-semibold truncate transition-colors duration-150 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] ${nameClassName}`}
                  >
                    {employee.name}
                  </Link>

                  {!avail || avail.count === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-800/40" title="Sin disponibilidad configurada">
                      <AlertCircle className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Sin config.</span>
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ${availBadgeClassName}`} title={avail.day_labels.join(', ')}>
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{avail.count}/7</span>
                    </span>
                  )}
                </div>
                {employee.phone ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                    <span>{employee.phone}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5 italic">Sin teléfono</p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {hasAccess ? (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full mr-2 bg-emerald-50/80 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/40">
                    Activo
                  </span>
                ) : hasPendingInvite ? (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full mr-2 bg-amber-50/80 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-800/40">
                    Invitado
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onInvite(employee)}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-full mr-2 bg-[#0F4C5C]/10 text-[#0F4C5C] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8] hover:bg-[#0F4C5C]/20 dark:hover:bg-[#38BDF8]/20 ring-1 ring-[#0F4C5C]/20 dark:ring-[#38BDF8]/20 transition-all duration-200 cursor-pointer"
                  >
                    Invitar
                  </button>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(isMenuOpen ? null : employee.id)
                    }}
                    aria-label="Más acciones"
                    aria-expanded={isMenuOpen}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/40"
                  >
                    {loadingId === employee.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MoreVertical className="w-4 h-4" />
                    )}
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 min-w-[220px]" onClick={(e) => e.stopPropagation()}>
                      {hasAccess && (
                        <>
                          <button
                            type="button"
                            onClick={() => { setEditTarget(employee); setOpenMenuId(null) }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                          >
                            <Pencil className="w-4 h-4 text-slate-400" />
                            Editar
                          </button>
                          <Link
                            href={`/employees/${employee.id}/availability`}
                            onClick={() => setOpenMenuId(null)}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            Disponibilidad
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggle(employee)}
                            disabled={loadingId === employee.id}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {employee.active ? (
                              <>
                                <ToggleLeft className="w-4 h-4 text-slate-400" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-4 h-4 text-emerald-500" />
                                Reactivar
                              </>
                            )}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                        </>
                      )}

                      {!hasAccess && hasPendingInvite && invitation && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleResendInvitation(invitation.id)}
                            disabled={loadingId === invitation.id}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className={`w-4 h-4 text-slate-400 ${loadingId === invitation.id ? 'animate-spin' : ''}`} />
                            Reenviar invitación
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            disabled={loadingId === invitation.id}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserX className="w-4 h-4" />
                            Cancelar invitación
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => { setDeleteTarget(employee); setOpenMenuId(null) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                      >
                        <UserX className="w-4 h-4" />
                        Archivar empleado
                      </button>

                      {isOwnerOrAdmin && (
                        <button
                          type="button"
                          onClick={() => { setHardDeleteTarget(employee); setOpenMenuId(null) }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 cursor-pointer transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar permanentemente
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <EditEmployeeModal
        employee={editTarget}
        onClose={() => setEditTarget(null)}
        onDelete={setDeleteTarget}
      />

      <DeleteEmployeeModal
        employee={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <PermanentDeleteModal
        employee={hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
      />
    </>
  )
}
