'use client'

import { useState } from 'react'
import { User, Phone, Mail, CheckCircle2, ChevronLeft } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { colombianNameSchema, emailSchema } from '@/schemas/common'
import { isValidPhone, getPhoneErrorMessage } from '@/lib/validators/phone'
import type { ThemeColors } from '@/hooks/useThemeColors'

export function StepClient({
  clientName, clientPhone, clientEmail, clientNotes, isSubmitting, colors,
  onNameChange, onPhoneChange, onEmailChange, onNotesChange, onSubmit, onBack,
}: {
  clientName: string; clientPhone: string; clientEmail: string; clientNotes: string
  isSubmitting: boolean; colors: ThemeColors
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
  onEmailChange: (v: string) => void; onNotesChange: (v: string) => void
  onSubmit: () => void; onBack: () => void
}) {
  const [attempted, setAttempted] = useState(false)
  const [hoverConfirm, setHoverConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function clearFieldError(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}

    const nameResult = colombianNameSchema.safeParse(clientName)
    if (!nameResult.success) {
      errors.name = nameResult.error.issues[0]?.message || 'Nombre inválido'
    }

    const normalizedPhone = clientPhone.trim()
    if (!normalizedPhone) {
      errors.phone = 'El teléfono es requerido'
    } else if (!isValidPhone(normalizedPhone)) {
      errors.phone = getPhoneErrorMessage(normalizedPhone) || 'Teléfono inválido'
    }

    if (clientEmail.trim()) {
      const emailResult = emailSchema.safeParse(clientEmail)
      if (!emailResult.success) {
        errors.email = 'Ingresa un email válido'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const canSubmit = !!clientName && !!clientPhone && !isSubmitting

  const handleSubmit = () => {
    setAttempted(true)
    if (!validate()) return
    onSubmit()
  }

  const inputStyle = (hasError: boolean) => ({
    borderRadius: colors.radius.sm,
    border: `1px solid ${hasError ? colors.error : colors.border}`,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    transition: colors.transition,
    ['--tw-ring-color' as string]: colors.borderFocus,
  })

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 flex items-center justify-center" style={{ borderRadius: colors.radius.sm, backgroundColor: colors.primary + '15' }}>
          <User className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          ¿Quién eres?
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="client-name" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Nombre completo *</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: attempted && fieldErrors.name ? colors.error : colors.textMuted }} />
            <input id="client-name" type="text" value={clientName} onChange={e => { onNameChange(e.target.value); clearFieldError('name') }}
              onBlur={() => attempted && validate()}
              placeholder="Tu nombre"
              className="w-full pl-12 pr-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={inputStyle(!!(attempted && fieldErrors.name))} />
          </div>
          {attempted && fieldErrors.name && (
            <p className="text-xs mt-1" style={{ color: colors.error }}>{fieldErrors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="client-phone" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Teléfono *</label>
          <div className="relative">
            <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: attempted && fieldErrors.phone ? colors.error : colors.textMuted }} />
            <input id="client-phone" type="tel" value={clientPhone} onChange={e => { onPhoneChange(e.target.value); clearFieldError('phone') }}
              onBlur={() => attempted && validate()}
              placeholder="Tu número de teléfono"
              className="w-full pl-12 pr-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={inputStyle(!!(attempted && fieldErrors.phone))} />
          </div>
          {attempted && fieldErrors.phone && (
            <p className="text-xs mt-1" style={{ color: colors.error }}>{fieldErrors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="client-email" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Email (opcional)</label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: attempted && fieldErrors.email ? colors.error : colors.textMuted }} />
            <input id="client-email" type="email" value={clientEmail} onChange={e => { onEmailChange(e.target.value); clearFieldError('email') }}
              onBlur={() => attempted && validate()}
              placeholder="Tu correo electrónico"
              className="w-full pl-12 pr-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={inputStyle(!!(attempted && fieldErrors.email))} />
          </div>
          {attempted && fieldErrors.email && (
            <p className="text-xs mt-1" style={{ color: colors.error }}>{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="client-notes" className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Notas (opcional)</label>
          <textarea id="client-notes" value={clientNotes} onChange={e => onNotesChange(e.target.value)}
            placeholder="Alguna información adicional..." rows={2}
            className="w-full px-4 py-3 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={inputStyle(false)} />
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="px-4 py-3 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: colors.radius.button, color: colors.textSecondary, backgroundColor: colors.surfaceSubtle, transition: colors.transition, ['--tw-ring-color' as string]: colors.borderFocus }}>
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Atrás
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          onMouseEnter={() => setHoverConfirm(true)}
          onMouseLeave={() => setHoverConfirm(false)}
          className="flex-1 py-3 font-medium flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            borderRadius: colors.radius.button,
            backgroundColor: canSubmit ? colors.primary : colors.surfaceSubtle,
            color: canSubmit ? colors.surface : colors.textSecondary,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: colors.transition,
            transform: hoverConfirm && canSubmit ? 'translateY(-1px)' : 'none',
            boxShadow: hoverConfirm && canSubmit ? `0 4px 12px ${colors.primary}40` : 'none',
            ['--tw-ring-color' as string]: colors.borderFocus,
          }}
        >
          {isSubmitting ? (
            <><Spinner size="sm" /> Reservando...</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Confirmar reserva</>
          )}
        </button>
      </div>
    </div>
  )
}
