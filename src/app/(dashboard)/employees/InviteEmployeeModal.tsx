'use client'

import { useState, useTransition } from 'react'
import { Mail, Copy, Check, UserPlus, Shield, Send } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { createInvitation } from '@/actions/invitations/createInvitation'
import type { Employee } from '@/types/employees'
import type { MemberRole } from '@/types/invitations'
import { getRoleLabel } from '@/lib/rbac'
import { SecurityConfirmationModal } from '@/components/dashboard/SecurityConfirmationModal'

function RoleOption({ value, label, description, icon, selected, onSelect }: {
  value: MemberRole; label: string; description: string; icon: React.ReactNode; selected: boolean; onSelect: () => void
}) {
  return (
    <button type="button" onClick={onSelect}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
        selected ? 'border-[#0F4C5C] dark:border-[#38BDF8] bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
      }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-[#0F4C5C] dark:bg-[#38BDF8] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${selected ? 'text-[#0F4C5C] dark:text-[#38BDF8]' : 'text-slate-900 dark:text-slate-100'}`}>{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-[#0F4C5C] dark:border-[#38BDF8] bg-[#0F4C5C] dark:bg-[#38BDF8]' : 'border-slate-300 dark:border-slate-600'}`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  )
}

interface InviteEmployeeModalProps {
  isOpen: boolean
  employee: Employee
  organizationName: string
  onClose: () => void
}

function getAccessDescription(role: string): string {
  const m: Record<string, string> = {
    owner: 'Propietario, acceso total',
    admin: 'Acceso completo, gestión del negocio',
    staff: 'Gestiona agenda, confirma citas, invita miembros',
    empleado: 'Accede a su agenda, confirma citas',
  }
  return m[role] || 'Acceso básico'
}

function EmailPreviewCard({ email, role, businessName, employeeName, sendEmail }: {
  email: string; role: MemberRole; businessName: string; employeeName: string; sendEmail: boolean
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Vista previa del email</span>
        </div>
        <p className="text-xs text-slate-500"><span className="font-medium">Para:</span> {email || 'empleado@ejemplo.com'}</p>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-[#0F4C5C] dark:text-[#38BDF8] mb-1">Prügressy</p>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
          Hola {employeeName}, <strong>{businessName}</strong> te ha invitado.
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8] font-semibold rounded">{getRoleLabel(role)}</span>
          <span className="text-slate-400">{sendEmail ? '• Recibirás enlace' : '• Link expira en 7 días'}</span>
        </div>
      </div>
    </div>
  )
}

export function InviteEmployeeModal({ isOpen, employee, organizationName, onClose }: InviteEmployeeModalProps) {
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
    e.preventDefault(); setError(null); setSuccess(false)
    if (sendEmail && !isValidEmail(email.trim())) { setEmailError('Ingresa un correo válido'); return }
    if (role === 'staff' || role === 'admin') { setPendingRole(role); setShowSecurityConfirm(true); return }
    submitInvitation()
  }

  function submitInvitation() {
    startTransition(async () => {
      const result = await createInvitation({ employeeId: employee.id, email: email.trim() || undefined, role, sendEmail })
      if (result.error) { setError(result.error); return }
      if (result.invitationUrl) { setInvitationUrl(result.invitationUrl); setEmailSent(result.emailSent || false); setSuccess(true) }
    })
  }

  function handleConfirmSecurity() { submitInvitation(); setShowSecurityConfirm(false); setPendingRole(null) }
  function handleCancelSecurity() { setShowSecurityConfirm(false); setPendingRole(null) }

  function handleCopyLink() {
    if (invitationUrl) { navigator.clipboard.writeText(invitationUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  function handleClose() {
    setEmail(''); setRole('staff'); setSendEmail(false); setError(null); setSuccess(false)
    setInvitationUrl(null); setEmailSent(false); setCopied(false); setShowSecurityConfirm(false)
    setPendingRole(null); setEmailError(null); onClose()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={`Invitar a ${employee.name}`} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
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
              {emailSent && <p className="text-sm text-slate-600 dark:text-slate-400">Se envió un correo a <strong>{email}</strong>.</p>}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Link para compartir</label>
                <div className="flex gap-2 mt-1">
                  <input type="text" readOnly value={invitationUrl || ''}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm" />
                  <Button variant="primary" size="sm" onClick={handleCopyLink} icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}>
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rol del empleado</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { value: 'empleado', label: 'Empleado' },
                    { value: 'staff', label: 'Asistente' },
                    { value: 'admin', label: 'Administrador' },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setRole(opt.value as MemberRole)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        role === opt.value ? 'bg-[#0F4C5C] dark:bg-[#38BDF8] text-white border-[#0F4C5C] dark:border-[#38BDF8]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="invite-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo electrónico</label>
                <input id="invite-email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null) }}
                  placeholder="empleado@ejemplo.com"
                  className={`w-full mt-1 px-4 min-h-[48px] rounded-xl border text-base focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ${
                    emailError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'
                  }`} />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                <button type="button" onClick={() => setSendEmail(!sendEmail)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sendEmail ? 'bg-[#0F4C5C] dark:bg-[#38BDF8]' : 'bg-slate-300 dark:bg-slate-600'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${sendEmail ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{sendEmail ? 'Enviar por email' : 'Solo generar link'}</p>
                  <p className="text-xs text-slate-500">{sendEmail ? 'Se enviará inmediatamente' : 'Copia el link manualmente'}</p>
                </div>
              </div>

              {sendEmail && <EmailPreviewCard email={email} role={role} businessName={organizationName} employeeName={employee.name} sendEmail={sendEmail} />}
            </div>
          )}

          {/* Footer condicional dentro de children */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" onClick={handleClose} className="flex-1">{success ? 'Cerrar' : 'Cancelar'}</Button>
            {!success && (
              <Button type="submit" variant="primary" disabled={isPending || !canSubmit} loading={isPending} icon={<Send className="w-4 h-4" />} className="flex-1">
                Crear invitación
              </Button>
            )}
          </div>
        </form>
      </Modal>

      {showSecurityConfirm && pendingRole && (pendingRole === 'staff' || pendingRole === 'admin') && (
        <SecurityConfirmationModal isOpen={showSecurityConfirm} role={pendingRole} employeeName={employee.name}
          previousRole={null} onConfirm={handleConfirmSecurity} onCancel={handleCancelSecurity} />
      )}
    </>
  )
}
