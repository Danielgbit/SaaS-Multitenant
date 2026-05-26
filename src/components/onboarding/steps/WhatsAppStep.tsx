'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react'

interface Props {
  orgId: string
  onNext: () => void
  onSkip: () => void
}

export function WhatsAppStep({ orgId, onNext, onSkip }: Props) {
  const colors = useThemeColors()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>WhatsApp</h2>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Conecta WhatsApp para enviar recordatorios y confirmaciones automáticas a tus clientes
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl mb-6" style={{ background: colors.surfaceSubtle, border: `1px solid ${colors.border}` }}>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          La integración de WhatsApp te permite:
        </p>
        <ul className="mt-2 space-y-1">
          {['Enviar recordatorios automáticos de citas', 'Confirmar reservas con un solo clic', 'Notificar cambios de último minuto'].map(
            (benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-sm" style={{ color: colors.textPrimary }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: colors.success }} />
                {benefit}
              </li>
            )
          )}
        </ul>
      </div>

      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm px-4 py-2 rounded-xl transition-all"
          style={{ color: colors.textSecondary }}
        >
          Lo haré después
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/whatsapp'
          }}
          className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all text-white inline-flex items-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          }}
        >
          Configurar ahora
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.border }}>
        <button
          type="button"
          onClick={onNext}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all"
          style={{ background: colors.success + '15', color: colors.success }}
        >
          Completar configuración
        </button>
      </div>
    </div>
  )
}
