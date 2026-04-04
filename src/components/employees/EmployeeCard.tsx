'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  Calendar, 
  Scissors, 
  MoreVertical, 
  Loader2, 
  UserX,
  Check,
  AlertCircle,
  Mail,
  ExternalLink,
  RotateCcw,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { toggleEmployeeStatus } from '@/actions/employees/toggleEmployeeStatus'
import { resendInvitation } from '@/actions/invitations/resendInvitation'
import { cancelInvitation } from '@/actions/invitations/cancelInvitation'
import { EmployeeActionMenu } from '@/components/employees/EmployeeActionMenu'
import type { Employee } from '@/types/employees'
import type { AvailabilitySummary } from '@/services/availability/getAvailability'
import type { Invitation } from '@/types/invitations'
import type { EmployeeServiceInfo } from '@/services/employees/getEmployeeServicesForOrganization'

interface EmployeeCardProps {
  employee: Employee
  availability: AvailabilitySummary | undefined
  services: EmployeeServiceInfo[]
  invitation: Invitation | undefined
  organizationId: string
  userRole: string
  onInvite: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  onHardDelete: (employee: Employee) => void
  onShowInvitationLink: (employee: Employee, invitation: Invitation) => void
  onResendInvite: (invitationId: string) => void
  animationDelay?: number
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatPhone(phone: string): string {
  if (phone.length === 10) {
    return `+54 9 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`
  }
  return phone
}

export function EmployeeCard({
  employee,
  availability,
  services,
  invitation,
  organizationId,
  userRole,
  onInvite,
  onDelete,
  onHardDelete,
  onShowInvitationLink,
  onResendInvite,
  animationDelay = 0
}: EmployeeCardProps) {
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<DOMRect | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [, startTransition] = useTransition()

  const hasAccess = !!employee.user_id
  const hasPendingInvite = invitation?.status === 'pending'
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  const avatarClassName = employee.active
    ? 'bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] text-white shadow-lg shadow-[#0F4C5C]/25'
    : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 text-slate-500 dark:text-slate-400'

  const cardClassName = employee.active
    ? 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-slate-300/60 dark:hover:border-slate-600/60'
    : 'bg-slate-50/80 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/30 opacity-75'

  function handleOpenMenu() {
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      setMenuPosition(rect)
    }
    setMenuOpen(true)
  }

  function handleCloseMenu() {
    setMenuOpen(false)
    setMenuPosition(null)
  }

  function handleToggle() {
    setLoading(true)
    startTransition(async () => {
      await toggleEmployeeStatus(employee.id, !employee.active)
      setLoading(false)
    })
  }

  function handleResendInvitation() {
    if (!invitation) return
    setLoading(true)
    startTransition(async () => {
      await resendInvitation({ invitationId: invitation.id })
      setLoading(false)
    })
  }

  function handleCancelInvitation() {
    if (!invitation) return
    setLoading(true)
    startTransition(async () => {
      const result = await cancelInvitation({ invitationId: invitation.id })
      setLoading(false)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invitación cancelada correctamente')
      }
    })
  }

  const serviceNames = services.slice(0, 3).map(s => s.name)
  const remainingServices = services.length - 3

  return (
    <>
      <article
        className={`
          relative rounded-2xl p-6 lg:p-8 transition-all duration-300 ease-out
          ${cardClassName}
          animate-fade-in
        `}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {!employee.active && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 shadow-md">
            <UserX className="w-3 h-3" />
            Dado de baja
          </div>
        )}

        <div className="flex items-start gap-5 mb-6">
          <div className={`
            relative w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-bold transition-all duration-300
            ${avatarClassName}
          `}>
            {employee.name.charAt(0).toUpperCase()}
            {hasAccess && employee.active && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-md" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={`/employees/${employee.id}`}
              className={`
                group flex items-center gap-1.5 w-fit
                ${employee.active 
                  ? 'text-slate-900 dark:text-slate-100 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8]' 
                  : 'text-slate-400 dark:text-slate-500 line-through decoration-2'
                }
              `}
            >
              <h3 className="text-lg font-bold truncate transition-colors duration-150">
                {employee.name}
              </h3>
              <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
            </Link>
            
            {employee.phone ? (
              <a 
                href={`tel:${employee.phone}`}
                className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatPhone(employee.phone)}</span>
              </a>
            ) : (
              <p className="text-sm text-slate-300 dark:text-slate-600 mt-0.5 italic">
                Sin teléfono registrado
              </p>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Alta: {formatDate(employee.created_at)}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {services.length > 0 && (
            <div className="flex items-start gap-3">
              <Scissors className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Servicios
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {serviceNames.map(name => (
                    <span 
                      key={name}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      {name}
                    </span>
                  ))}
                  {remainingServices > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-xs font-medium text-slate-500 dark:text-slate-400">
                      +{remainingServices}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Disponibilidad
              </p>
              {availability && availability.count > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {DAY_LABELS.map((day, index) => {
                    const isAvailable = availability.days.includes(index)
                    return (
                      <span
                        key={day}
                        className={`
                          w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200
                          ${isAvailable 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-slate-100 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500'
                          }
                        `}
                      >
                        {day.charAt(0)}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sin horarios configurados</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100/60 dark:border-slate-700/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {employee.active && hasAccess && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                  Activo
                </span>
              )}
              
              {employee.active && !hasAccess && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pendiente
                </span>
              )}

              {!employee.active && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 shadow-sm">
                  <UserX className="w-3.5 h-3.5" />
                  Inactivo
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasAccess ? (
                <Link
                  href={`/employees/${employee.id}`}
                  className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#0F4C5C]/20 dark:hover:shadow-[#38BDF8]/20 transition-all duration-200 whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver perfil</span>
                </Link>
              ) : hasPendingInvite ? (
                <>
                  <button
                    type="button"
                    onClick={() => onShowInvitationLink(employee, invitation)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 shadow-sm transition-all duration-200"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResendInvitation}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8] hover:bg-[#0F4C5C]/20 dark:hover:bg-[#38BDF8]/20 shadow-sm transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Reenviar</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onInvite(employee)}
                  className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] text-white hover:shadow-lg hover:shadow-[#0F4C5C]/20 dark:hover:shadow-[#38BDF8]/20 transition-all duration-200 whitespace-nowrap"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Invitar</span>
                </button>
              )}

              <button
                ref={menuButtonRef}
                type="button"
                onClick={handleOpenMenu}
                aria-label="Más acciones"
                className={`
                  min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg
                  transition-all duration-200 cursor-pointer flex-shrink-0
                  ${menuOpen 
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </article>

      <EmployeeActionMenu
        employee={employee}
        isOpen={menuOpen}
        position={menuPosition}
        onClose={handleCloseMenu}
        onEdit={() => {}}
        onDelete={onDelete}
        onHardDelete={onHardDelete}
        onToggle={handleToggle}
        onResendInvitation={handleResendInvitation}
        onCancelInvitation={handleCancelInvitation}
        invitation={invitation}
        hasAccess={hasAccess}
        hasPendingInvite={hasPendingInvite}
        isOwnerOrAdmin={isOwnerOrAdmin}
        isLoading={loading}
      />
    </>
  )
}