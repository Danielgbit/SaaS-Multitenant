import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingState } from '@/actions/onboarding/getOnboardingState'
import { OnboardingClient } from '@/components/onboarding/OnboardingClient'
import type { OnboardingStep } from '@/actions/onboarding/getOnboardingState'

const VALID_STEPS: OnboardingStep[] = ['business', 'services', 'employees', 'hours', 'whatsapp']

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) redirect('/dashboard')

  const state = await getOnboardingState()
  const { step } = await searchParams

  if (!state.isFirstTime && state.totalCompleted === state.totalSteps) {
    redirect('/dashboard')
  }

  const currentStep: OnboardingStep =
    step && (VALID_STEPS as readonly string[]).includes(step)
      ? (step as OnboardingStep)
      : state.currentStep

  return (
    <OnboardingClient
      initialState={state}
      orgId={orgMember.organization_id}
      initialStep={currentStep}
    />
  )
}
