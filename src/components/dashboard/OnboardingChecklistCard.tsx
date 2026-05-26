'use client'

import Link from 'next/link'
import { useThemeColors } from '@/hooks/useThemeColors'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { OnboardingStep } from '@/actions/onboarding/getOnboardingState'

interface Props {
  completed: Record<OnboardingStep, boolean>
  totalCompleted: number
  totalSteps: number
}

const STEP_LABELS: Record<OnboardingStep, { label: string; href: string }> = {
  business: { label: 'Nombre del negocio', href: '/onboarding?step=business' },
  services: { label: 'Crear servicios', href: '/onboarding?step=services' },
  employees: { label: 'Agregar empleados', href: '/onboarding?step=employees' },
  hours: { label: 'Configurar horario', href: '/onboarding?step=hours' },
  whatsapp: { label: 'Conectar WhatsApp', href: '/onboarding?step=whatsapp' },
}

export function OnboardingChecklistCard({ completed, totalCompleted, totalSteps }: Props) {
  const colors = useThemeColors()
  const allDone = totalCompleted === totalSteps

  if (allDone) return null

  const firstIncomplete = (Object.entries(completed) as [OnboardingStep, boolean][]).find(
    ([, done]) => !done
  )?.[0]

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: `linear-gradient(135deg, ${colors.primarySubtle} 0%, ${colors.surfaceSubtle} 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
            Configura tu negocio
          </h3>
          <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {totalCompleted} de {totalSteps} pasos completados
          </p>
        </div>

        {firstIncomplete && (
          <Link
            href={STEP_LABELS[firstIncomplete].href}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all text-white flex-shrink-0"
            style={{ background: colors.primary }}
          >
            Continuar <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full mb-4 overflow-hidden"
        style={{ background: colors.border }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(totalCompleted / totalSteps) * 100}%`,
            background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          }}
        />
      </div>

      {/* Step list */}
      <div className="space-y-2">
        {(Object.entries(STEP_LABELS) as [OnboardingStep, { label: string; href: string }][]).map(
          ([key, { label, href }]) => {
            const done = completed[key]
            return (
              <Link
                key={key}
                href={href}
                className="flex items-center gap-3 text-sm py-1.5 px-3 rounded-lg transition-all hover:opacity-80"
                style={{ color: done ? colors.success : colors.textSecondary }}
              >
                <CheckCircle2
                  className={`w-4 h-4 flex-shrink-0 transition-all ${
                    done ? 'opacity-100' : 'opacity-30'
                  }`}
                />
                <span className={done ? 'font-medium' : ''}>{label}</span>
              </Link>
            )
          }
        )}
      </div>
    </div>
  )
}
