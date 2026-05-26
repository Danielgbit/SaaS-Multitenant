'use client'

import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { OnboardingStep } from '@/actions/onboarding/getOnboardingState'

type StepDef = {
  key: OnboardingStep
  label: string
}

const STEPS: StepDef[] = [
  { key: 'business', label: 'Negocio' },
  { key: 'services', label: 'Servicios' },
  { key: 'employees', label: 'Equipo' },
  { key: 'hours', label: 'Horario' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

interface OnboardingWizardProps {
  currentStep: OnboardingStep
  completed: Record<OnboardingStep, boolean>
  children: React.ReactNode
}

export function OnboardingWizard({ currentStep, completed, children }: OnboardingWizardProps) {
  const colors = useThemeColors()

  const currentIdx = useMemo(() => STEPS.findIndex((s) => s.key === currentStep), [currentStep])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow.lg,
      }}
    >
      {/* Header with gradient */}
      <div
        className="px-6 py-5 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          color: '#FFF',
        }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative">
          <h1 className="text-xl font-semibold mb-4">Configura tu negocio</h1>

          {/* Step indicators */}
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const isCompleted = completed[step.key]
              const isActive = idx === currentIdx
              const isPending = !isCompleted && !isActive

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-white text-[#0F4C5C] shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-white text-[#0F4C5C]'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 transition-all duration-300 ${
                        isActive || isCompleted ? 'text-white font-medium' : 'text-white/60'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] transition-colors duration-300 ${
                        isCompleted ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress text */}
          <p className="text-xs text-white/70 mt-3">
            Paso {currentIdx + 1} de {STEPS.length}
          </p>
        </div>
      </div>

      {/* Step content */}
      <div className="p-6">{children}</div>
    </div>
  )
}
