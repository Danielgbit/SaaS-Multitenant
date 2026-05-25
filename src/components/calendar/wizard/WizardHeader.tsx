'use client'

import { CheckCircle2, X } from 'lucide-react'
import type { CalendarColors } from '@/types/calendar'

interface WizardHeaderProps {
  COLORS: CalendarColors
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onClose: () => void
  closeRef: React.RefObject<HTMLButtonElement | null>
}

export function WizardHeader({
  COLORS,
  currentStep,
  totalSteps,
  stepLabels,
  onClose,
  closeRef,
}: WizardHeaderProps) {
  return (
    <div
      className="px-5 sm:px-6 py-4 sm:py-5 relative overflow-hidden flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
        color: '#FFF'
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-semibold font-heading">
            Nueva Cita
          </h3>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-2">
          {stepLabels.map((label, idx) => {
            const step = idx + 1
            const isCompleted = currentStep > step
            const isActive = currentStep === step
            const isFuture = currentStep < step
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-[#0F4C5C] shadow-lg scale-110'
                        : isCompleted
                        ? 'bg-white text-[#0F4C5C]'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                  </div>
                  <span
                    className={`hidden sm:block text-caption mt-1 transition-all duration-300 ${
                      isActive || isCompleted ? 'text-white font-medium' : 'text-white/60'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < stepLabels.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] sm:mt-[-1.5rem] transition-colors duration-300 ${
                      isCompleted ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
