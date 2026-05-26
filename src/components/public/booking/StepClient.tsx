'use client'

import { User, Phone, Mail, CheckCircle2, ChevronLeft } from 'lucide-react'
import { Spinner } from '@/components/ui'

interface BookingColors {
  primary: string; primaryLight: string; surface: string; surfaceSubtle: string
  border: string; borderLight: string; textPrimary: string; textSecondary: string
  textMuted: string; success: string; successLight: string; warning: string
  warningLight: string; error: string; errorLight: string
}

export function StepClient({
  clientName, clientPhone, clientEmail, clientNotes, isSubmitting, colors,
  onNameChange, onPhoneChange, onEmailChange, onNotesChange, onSubmit, onBack,
}: {
  clientName: string; clientPhone: string; clientEmail: string; clientNotes: string
  isSubmitting: boolean; colors: BookingColors
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
  onEmailChange: (v: string) => void; onNotesChange: (v: string) => void
  onSubmit: () => void; onBack: () => void
}) {
  const canSubmit = !!clientName && !!clientPhone && !isSubmitting

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.primary + '15' }}>
          <User className="w-5 h-5" style={{ color: colors.primary }} />
        </div>
        <h2 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>
          ¿Quién eres?
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Nombre completo *</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
            <input type="text" value={clientName} onChange={e => onNameChange(e.target.value)}
              placeholder="Tu nombre"
              className="w-full pl-12 pr-4 py-3 rounded-xl"
              style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textPrimary }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Teléfono *</label>
          <div className="relative">
            <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
            <input type="tel" value={clientPhone} onChange={e => onPhoneChange(e.target.value)}
              placeholder="Tu número de teléfono"
              className="w-full pl-12 pr-4 py-3 rounded-xl"
              style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textPrimary }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Email (opcional)</label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
            <input type="email" value={clientEmail} onChange={e => onEmailChange(e.target.value)}
              placeholder="Tu correo electrónico"
              className="w-full pl-12 pr-4 py-3 rounded-xl"
              style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textPrimary }} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Notas (opcional)</label>
          <textarea value={clientNotes} onChange={e => onNotesChange(e.target.value)}
            placeholder="Alguna información adicional..." rows={2}
            className="w-full px-4 py-3 rounded-xl resize-none"
            style={{ border: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textPrimary }} />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="px-4 py-3 rounded-xl font-medium"
          style={{ color: colors.textSecondary, backgroundColor: colors.surfaceSubtle }}>
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Atrás
        </button>
        <button onClick={onSubmit} disabled={!canSubmit}
          className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
          style={{ backgroundColor: canSubmit ? colors.primary : colors.borderLight, color: canSubmit ? '#FFF' : colors.textMuted }}>
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
