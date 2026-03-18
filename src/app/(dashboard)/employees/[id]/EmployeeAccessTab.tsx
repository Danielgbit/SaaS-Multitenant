'use client'

import { useState, useTransition } from 'react'
import { KeyRound, UserPlus, Mail, Copy, Check, RefreshCw, X, AlertTriangle, Shield, Loader2 } from 'lucide-react'
import { createInvitation } from '@/actions/invitations/createInvitation'
import { resendInvitation } from '@/actions/invitations/resendInvitation'
import { cancelInvitation } from '@/actions/invitations/cancelInvitation'
import { revokeAccess } from '@/actions/invitations/revokeAccess'
import { updateMemberRole } from '@/actions/invitations/updateMemberRole'
import type { Employee } from '@/types/employees'
import type { Invitation, MemberRole } from '@/types/invitations'

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
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOwner = currentUserRole === 'owner'
  const hasAccess = !!employee.user_id
  const hasPendingInvite = pendingInvitation?.status === 'pending'

  function handleCreateInvite() {
    setError(null)
    startTransition(async () => {
      const result = await createInvitation({
        employeeId: employee.id,
        email: email.trim() || undefined,
        role,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.invitationUrl) {
        setInvitationUrl(result.invitationUrl)
        setShowInviteModal(false)
      }
    })
  }

  function handleResend() {
    if (!pendingInvitation) return
    startTransition(async () => {
      await resendInvitation({ invitationId: pendingInvitation.id })
    })
  }

  function handleCancelInvite() {
    if (!pendingInvitation) return
    if (!confirm('¿Cancelar esta invitación?')) return
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

  function handleCopyLink() {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Acceso al sistema
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestiona el acceso de este empleado
          </p>
        </div>
      </div>

      {/* Access Status Card */}
      <div className={`
        p-6 rounded-xl border-2 
        ${hasAccess 
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
          : isLoading 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        }
      `}>
        <div className="flex items-center gap-4">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            ${hasAccess 
              ? 'bg-emerald-500' 
              : isLoading 
                ? 'bg-amber-500'
                : 'bg-slate-400'
            }
          `}>
            {hasAccess ? (
              <Check className="w-6 h-6 text-white" />
            ) : isLoading ? (
              <Mail className="w-6 h-6 text-white" />
            ) : (
              <KeyRound className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {hasAccess 
                ? 'Acceso activo' 
                : isLoading 
                  ? 'Invitación pendiente'
                  : 'Sin acceso al sistema'
              }
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {hasAccess 
                ? 'Este empleado puede acceder al sistema' 
                : isLoading 
                  ? 'Esperando que accepte la invitación'
                  : 'Este empleado no tiene cuenta en el sistema'
              }
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!hasAccess && !isLoading && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Invitar al sistema
            </button>
          )}

          {isLoading && (
            <>
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F4C5C]/10 hover:bg-[#0F4C5C]/20 text-[#0F4C5C] dark:text-[#38BDF8] text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Reenviar
              </button>
              <button
                onClick={handleCancelInvite}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </>
          )}

          {hasAccess && isOwner && (
            <button
              onClick={handleRevoke}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium"
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Invitar a {employee.name}
            </h3>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="empleado@ejemplo.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rol
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="staff">Staff (acceso básico)</option>
                  <option value="admin">Admin (acceso completo)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateInvite}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Enviar invitación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copied Link Card */}
      {invitationUrl && (
        <div className="p-4 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 border border-[#0F4C5C]/20 dark:border-[#38BDF8]/20">
          <p className="text-sm font-medium text-[#0F4C5C] dark:text-[#38BDF8] mb-2">
            Link para compartir
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={invitationUrl}
              className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-sm border border-slate-200 dark:border-slate-700"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-lg bg-[#0F4C5C] dark:bg-[#38BDF8] text-white"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
