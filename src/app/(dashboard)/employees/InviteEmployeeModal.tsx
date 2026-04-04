'use client'

import { useState, useTransition } from 'react'
import { X, Mail, Copy, Check, Loader2, UserPlus, Shield, Send } from 'lucide-react'
import { createInvitation } from '@/actions/invitations/createInvitation'
import type { Employee } from '@/types/employees'
import type { MemberRole } from '@/types/invitations'
import { SecurityConfirmationModal } from '@/components/dashboard/SecurityConfirmationModal'

function RoleOption({ 
  value, 
  label, 
  description, 
  icon, 
  selected, 
  onSelect 
}: { 
  value: MemberRole
  label: string
  description: string
  icon: React.ReactNode
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
        {icon}
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

interface InviteEmployeeModalProps {
  isOpen: boolean
  employee: Employee
  onClose: () => void
}

export function InviteEmployeeModal({ isOpen, employee, onClose }: InviteEmployeeModalProps) {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('staff')
  const [sendEmail, setSendEmail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSecurityConfirm, setShowSecurityConfirm] = useState(false)
  const [pendingRole, setPendingRole] = useState<MemberRole | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  if (!isOpen) return null

  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const canSubmit = !sendEmail || (email.length > 0 && isValidEmail(email))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (sendEmail && !isValidEmail(email.trim())) {
      setEmailError('Ingresa un correo válido para enviar la invitación')
      return
    }

    if (role === 'staff' || role === 'admin') {
      setPendingRole(role)
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
        return
      }

      if (result.invitationUrl) {
        setInvitationUrl(result.invitationUrl)
        setEmailSent(result.emailSent || false)
        setSuccess(true)
      }
    })
  }

  function handleConfirmSecurity() {
    submitInvitation()
    setShowSecurityConfirm(false)
    setPendingRole(null)
  }

  function handleCancelSecurity() {
    setShowSecurityConfirm(false)
    setPendingRole(null)
  }

  function handleCopyLink() {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleClose() {
    setEmail('')
    setRole('staff')
    setSendEmail(false)
    setError(null)
    setSuccess(false)
    setInvitationUrl(null)
    setEmailSent(false)
    setCopied(false)
    setShowSecurityConfirm(false)
    setPendingRole(null)
    setEmailError(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-employee-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center text-[#0F4C5C] dark:text-[#38BDF8]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="invite-employee-title"
                className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif"
              >
                Invitar a {employee.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparte el link o envía por email
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 flex items-start gap-3 animate-in slide-in-from-top-2">
              <span className="text-red-600 dark:text-red-400 mt-0.5">⚠️</span>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {emailSent ? 'Invitación enviada exitosamente' : 'Invitación creada'}
                </p>
              </div>

              {emailSent && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Se envió un correo a <strong>{email}</strong> con el enlace de invitación.
                </p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Link para compartir
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={invitationUrl || ''}
                    className="
                      flex-1 px-4 py-2.5 rounded-xl
                      border border-slate-200 dark:border-slate-700
                      bg-slate-50 dark:bg-slate-900
                      text-sm text-slate-900 dark:text-slate-100
                      focus:outline-none
                    "
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="
                      px-4 py-2.5 rounded-xl
                      bg-[#0F4C5C] hover:bg-[#0C3E4A]
                      text-white
                      transition-colors duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]
                    "
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comparte este link por WhatsApp, SMS o cualquier otra vía
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="invite-email"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
                >
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 group-focus-within:text-[#0F4C5C] dark:group-focus-within:text-[#38BDF8] transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="invite-email"
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
                      w-full pl-12 pr-4 min-h-[48px] rounded-xl
                      border
                      ${emailError 
                        ? 'border-red-400 dark:border-red-500 focus:ring-red-300' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]'
                      }
                      bg-white dark:bg-slate-900
                      text-slate-900 dark:text-slate-100
                      placeholder-slate-400
                      focus:outline-none focus:ring-2
                      focus:border-transparent
                      transition-all duration-200
                      shadow-sm
                    `}
                  />
                </div>
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
                    Enviar invitación por correo electrónico
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sendEmail ? 'Se enviará inmediatamente al crear' : 'Solo genera el link para compartir'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Rol del empleado
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <RoleOption
                    value="empleado"
                    label="Empleado"
                    description="Agenda, confirmaciones y su nómina"
                    icon={<Shield className="w-4 h-4" />}
                    selected={role === 'empleado'}
                    onSelect={() => setRole('empleado')}
                  />
                  <RoleOption
                    value="staff"
                    label="Asistente"
                    description="Agenda, confirmaciones e invitaciones"
                    icon={<Shield className="w-4 h-4" />}
                    selected={role === 'staff'}
                    onSelect={() => setRole('staff')}
                  />
                  <RoleOption
                    value="admin"
                    label="Administrador"
                    description="Acceso completo al sistema"
                    icon={<Shield className="w-4 h-4" />}
                    selected={role === 'admin'}
                    onSelect={() => setRole('admin')}
                  />
                </div>
                <input type="hidden" name="role" value={role} />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/40">
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {success ? 'Cerrar' : 'Cancelar'}
            </button>
            {!success && (
              <button
                type="submit"
                disabled={isPending || !canSubmit}
                className="w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Crear invitación
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {showSecurityConfirm && pendingRole && (pendingRole === 'staff' || pendingRole === 'admin') && (
        <SecurityConfirmationModal
          isOpen={showSecurityConfirm}
          role={pendingRole}
          employeeName={employee.name}
          previousRole={null}
          onConfirm={handleConfirmSecurity}
          onCancel={handleCancelSecurity}
        />
      )}
    </div>
  )
}
