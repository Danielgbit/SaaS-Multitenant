'use client'

import { useState, useTransition } from 'react'
import { KeyRound, UserPlus, Mail, Copy, Check, RefreshCw, X, AlertTriangle, Loader2, Link2, Send, Shield } from 'lucide-react'
import { createInvitation } from '@/actions/invitations/createInvitation'
import { resendInvitation } from '@/actions/invitations/resendInvitation'
import { cancelInvitation } from '@/actions/invitations/cancelInvitation'
import { revokeAccess } from '@/actions/invitations/revokeAccess'
import { SecurityConfirmationModal } from '@/components/dashboard/SecurityConfirmationModal'
import type { Employee } from '@/types/employees'
import type { Invitation, MemberRole } from '@/types/invitations'

function RoleOption({
  value,
  label,
  description,
  selected,
  onSelect
}: {
  value: MemberRole
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200
        ${selected
          ? 'border-[#0F4C5C] dark:border-[#38BDF8] bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
        }
      `}
    >
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center
        ${selected
          ? 'bg-[#0F4C5C] dark:bg-[#38BDF8] text-white'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
        }
      `}>
        <Shield className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${selected ? 'text-[#0F4C5C] dark:text-[#38BDF8]' : 'text-slate-900 dark:text-slate-100'}`}>
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {description}
        </p>
      </div>
      <div className={`
        w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${selected
          ? 'border-[#0F4C5C] dark:border-[#38BDF8] bg-[#0F4C5C] dark:bg-[#38BDF8]'
          : 'border-slate-300 dark:border-slate-600'
        }
      `}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  )
}

interface EmployeeAccessTabProps {
  employee: Employee
  pendingInvitation: Invitation | null | undefined
  currentUserRole: string
}

export function EmployeeAccessTab({ 
  employee, 
  pendingInvitation,
  currentUserRole 
}: EmployeeAccessTabProps) {
  const [isLoading, startTransition] = useTransition()
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('staff')
  const [sendEmail, setSendEmail] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false)
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    newRole: 'staff' | 'admin'
    previousRole: string
  } | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const isOwner = currentUserRole === 'owner'
  const hasAccess = !!employee.user_id
  const hasPendingInvite = pendingInvitation?.status === 'pending'

  const pendingInviteUrl = pendingInvitation 
    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${pendingInvitation.token}`
    : null

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const canSubmit = !sendEmail || (email.length > 0 && isValidEmail(email))

  function handleCreateInvite() {
    setError(null)

    if (sendEmail && !isValidEmail(email.trim())) {
      setEmailError('Ingresa un correo válido para enviar la invitación')
      return
    }

    if (role === 'staff' || role === 'admin') {
      setPendingRoleChange({
        newRole: role,
        previousRole: 'empleado',
      })
      setShowSecurityConfirm(true)
      return
    }

    submitInvitation()
  }

  function submitInvitation() {
    startTransition(async () => {
      const result = await createInvitation({
        employeeId: employee.id,
        email: email.trim() || undefined,
        role,
        sendEmail,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.invitationUrl) {
        setInvitationUrl(result.invitationUrl)
        setShowInviteModal(false)
      }
    })
  }

  function handleConfirmSecurity() {
    submitInvitation()
    setShowSecurityConfirm(false)
    setPendingRoleChange(null)
  }

  function handleCancelSecurity() {
    setShowSecurityConfirm(false)
    setPendingRoleChange(null)
  }

  function handleResend() {
    if (!pendingInvitation) return
    startTransition(async () => {
      await resendInvitation({ invitationId: pendingInvitation.id })
    })
  }

  function handleCancelInvite() {
    if (!pendingInvitation) return
    if (!confirm('¿Cancelar esta invitación? El link dejará de funcionar.')) return
    startTransition(async () => {
      await cancelInvitation({ invitationId: pendingInvitation.id })
    })
  }

  function handleRevoke() {
    if (!confirm('¿Revocar el acceso de este empleado? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await revokeAccess({ employeeId: employee.id })
    })
  }

  function handleCopyLink(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCloseModal() {
    setEmail('')
    setRole('staff')
    setSendEmail(false)
    setError(null)
    setShowInviteModal(false)
    setShowSecurityConfirm(false)
    setPendingRoleChange(null)
    setEmailError(null)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F4C5C] to-[#0a3d4d] dark:from-[#38BDF8] dark:to-[#0ea5e9] flex items-center justify-center shadow-lg shadow-[#0F4C5C]/25">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Acceso al sistema
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona el acceso de este empleado
          </p>
        </div>
      </div>

      {/* Access Status Card */}
      <div className={`
        p-6 rounded-2xl border-2 
        ${hasAccess 
          ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30' 
          : hasPendingInvite 
            ? 'bg-amber-50/60 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30'
            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-700/40'
        }
      `}>
        <div className="flex items-center gap-4">
          <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            ${hasAccess 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : hasPendingInvite 
                ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                : 'bg-gradient-to-br from-slate-400 to-slate-500'
            }
            shadow-lg
          `}>
            {hasAccess ? (
              <Check className="w-7 h-7 text-white" />
            ) : hasPendingInvite ? (
              <Mail className="w-7 h-7 text-white" />
            ) : (
              <KeyRound className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
              {hasAccess 
                ? 'Acceso activo' 
                : hasPendingInvite 
                  ? 'Invitación pendiente'
                  : 'Sin acceso al sistema'
              }
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {hasAccess 
                ? 'Este empleado puede acceder al sistema' 
                : hasPendingInvite 
                  ? 'Esperando que acepte la invitación'
                  : 'Este empleado no tiene cuenta en el sistema'
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!hasAccess && !hasPendingInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="
                group flex items-center gap-2 px-5 py-2.5 rounded-xl 
                bg-gradient-to-r from-[#0F4C5C] to-[#0a3d4d] hover:from-[#0C3E4A] hover:to-[#083242]
                text-white text-sm font-medium
                shadow-lg shadow-[#0F4C5C]/20 hover:shadow-xl hover:shadow-[#0F4C5C]/30
                transition-all duration-200
              "
            >
              <UserPlus className="w-4 h-4" />
              Invitar al sistema
            </button>
          )}

          {hasPendingInvite && (
            <>
              <button
                onClick={handleResend}
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-xl 
                  bg-[#0F4C5C]/10 hover:bg-[#0F4C5C]/20 dark:bg-[#38BDF8]/10 dark:hover:bg-[#38BDF8]/20 
                  text-[#0F4C5C] dark:text-[#38BDF8] text-sm font-medium
                  transition-colors
                "
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Reenviar
              </button>
              <button
                onClick={handleCancelInvite}
                className="
                  flex items-center gap-2 px-4 py-2.5 rounded-xl 
                  bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 
                  text-red-600 dark:text-red-400 text-sm font-medium
                  transition-colors
                "
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </>
          )}

          {hasAccess && isOwner && (
            <button
              onClick={handleRevoke}
              className="
                flex items-center gap-2 px-4 py-2.5 rounded-xl 
                bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 
                text-red-600 dark:text-red-400 text-sm font-medium
                transition-colors
              "
            >
              <AlertTriangle className="w-4 h-4" />
              Revocar acceso
            </button>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Invitar a {employee.name}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(null)
                  }}
                  onBlur={() => {
                    if (sendEmail && email.length > 0 && !isValidEmail(email)) {
                      setEmailError('Ingresa un correo válido')
                    }
                  }}
                  placeholder="empleado@ejemplo.com"
                  className={`
                    w-full px-4 py-3 rounded-xl 
                    bg-white/80 dark:bg-slate-800/60
                    border
                    ${emailError 
                      ? 'border-red-400 dark:border-red-500 focus:ring-red-300' 
                      : 'border-slate-200/60 dark:border-slate-700/60 focus:ring-[#0F4C5C]/30'
                    }
                    text-slate-900 dark:text-slate-100
                    shadow-md shadow-slate-200/20
                    focus:outline-none focus:ring-2
                    transition-all duration-200
                  `}
                />
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {emailError}
                  </p>
                )}
                {sendEmail && email.length === 0 && !emailError && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ingresa un correo o desactiva el envío para generar solo el link
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center h-5">
                  <input
                    id="send-email-checkbox"
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0F4C5C] focus:ring-[#0F4C5C] cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="send-email-checkbox" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Enviar invitación por correo
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sendEmail ? 'Se enviará inmediatamente' : 'Solo genera el link'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <RoleOption
                    value="empleado"
                    label="Empleado"
                    description="Agenda, confirmaciones y su nómina"
                    selected={role === 'empleado'}
                    onSelect={() => setRole('empleado')}
                  />
                  <RoleOption
                    value="staff"
                    label="Asistente"
                    description="Agenda, confirmaciones e invitaciones"
                    selected={role === 'staff'}
                    onSelect={() => setRole('staff')}
                  />
                  <RoleOption
                    value="admin"
                    label="Administrador"
                    description="Acceso completo al sistema"
                    selected={role === 'admin'}
                    onSelect={() => setRole('admin')}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateInvite}
                disabled={isLoading || !canSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white font-medium shadow-lg shadow-[#0F4C5C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Crear invitación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invitation Link Card */}
      {hasPendingInvite && pendingInviteUrl && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Link de invitación activo
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={pendingInviteUrl}
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm border border-amber-200 dark:border-amber-700/50 text-slate-700 dark:text-slate-300"
            />
            <button
              onClick={() => handleCopyLink(pendingInviteUrl)}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Comparte este link por WhatsApp, SMS o cualquier otra vía
          </p>
        </div>
      )}

      {/* Newly Created Invitation Link Card */}
      {invitationUrl && !hasPendingInvite && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-[#0F4C5C]/10 to-[#38BDF8]/10 dark:from-[#38BDF8]/10 dark:to-[#0F4C5C]/5 border border-[#0F4C5C]/20 dark:border-[#38BDF8]/20">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Invitación creada
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={invitationUrl}
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm border border-slate-200/50 dark:border-slate-700/50"
            />
            <button
              onClick={() => handleCopyLink(invitationUrl)}
              className="px-4 py-2 rounded-lg bg-[#0F4C5C] dark:bg-[#38BDF8] text-white"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {showSecurityConfirm && pendingRoleChange && (
        <SecurityConfirmationModal
          isOpen={showSecurityConfirm}
          role={pendingRoleChange.newRole}
          employeeName={employee.name}
          previousRole={pendingRoleChange.previousRole}
          onConfirm={handleConfirmSecurity}
          onCancel={handleCancelSecurity}
        />
      )}
    </div>
  )
}
