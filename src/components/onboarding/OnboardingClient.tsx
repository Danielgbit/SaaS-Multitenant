'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { OnboardingWizard } from './OnboardingWizard'
import { BusinessStep } from './steps/BusinessStep'
import { ServicesStep } from './steps/ServicesStep'
import { EmployeesStep } from './steps/EmployeesStep'
import { HoursStep } from './steps/HoursStep'
import { WhatsAppStep } from './steps/WhatsAppStep'
import type { OnboardingStep, OnboardingState } from '@/actions/onboarding/getOnboardingState'

const STEP_ORDER: OnboardingStep[] = ['business', 'services', 'employees', 'hours', 'whatsapp']

interface OnboardingClientProps {
  initialState: OnboardingState
  orgId: string
  initialStep: OnboardingStep
}

export function OnboardingClient({ initialState, orgId, initialStep }: OnboardingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const stepParam = searchParams.get('step') as OnboardingStep | null

  const currentStep = stepParam && STEP_ORDER.includes(stepParam) ? stepParam : initialStep

  const goToStep = useCallback(
    (step: OnboardingStep) => {
      router.push(`/onboarding?step=${step}`)
    },
    [router]
  )

  const currentIdx = STEP_ORDER.indexOf(currentStep)

  const handleNext = useCallback(() => {
    const nextIdx = currentIdx + 1
    if (nextIdx < STEP_ORDER.length) {
      goToStep(STEP_ORDER[nextIdx])
    }
  }, [currentIdx, goToStep])

  const handleSkip = useCallback(() => {
    handleNext()
  }, [handleNext])

  const renderStep = () => {
    const props = { orgId, onNext: handleNext, onSkip: handleSkip }

    switch (currentStep) {
      case 'business':
        return <BusinessStep {...props} />
      case 'services':
        return <ServicesStep {...props} />
      case 'employees':
        return <EmployeesStep {...props} />
      case 'hours':
        return <HoursStep {...props} />
      case 'whatsapp':
        return <WhatsAppStep {...props} />
    }
  }

  return (
    <OnboardingWizard currentStep={currentStep} completed={initialState.completed}>
      {renderStep()}
    </OnboardingWizard>
  )
}
