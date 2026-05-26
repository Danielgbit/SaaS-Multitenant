'use server'

import { createClient } from '@/lib/supabase/server'

export type OnboardingStep = 'business' | 'services' | 'employees' | 'hours' | 'whatsapp'

export type OnboardingState = {
  isFirstTime: boolean
  currentStep: OnboardingStep
  completed: Record<OnboardingStep, boolean>
  totalCompleted: number
  totalSteps: number
}

const CORE_STEPS: OnboardingStep[] = ['business', 'services', 'employees', 'hours', 'whatsapp']
const GRACE_PERIOD_DAYS = 14

export async function getOnboardingState(): Promise<OnboardingState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      isFirstTime: false,
      currentStep: 'business',
      completed: { business: true, services: true, employees: true, hours: true, whatsapp: true },
      totalCompleted: 5,
      totalSteps: 5,
    }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    return {
      isFirstTime: false,
      currentStep: 'business',
      completed: { business: true, services: true, employees: true, hours: true, whatsapp: true },
      totalCompleted: 5,
      totalSteps: 5,
    }
  }

  const orgId = orgMember.organization_id

  const [orgResult, servicesResult, employeesResult, bookingResult, providersResult, integrationsResult] =
    await Promise.all([
      supabase.from('organizations').select('name, created_at').eq('id', orgId).single(),
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('booking_settings').select('spa_opening_time, spa_closing_time').eq('organization_id', orgId).single(),
      supabase.from('notification_providers').select('is_enabled').eq('organization_id', orgId).eq('channel', 'whatsapp').eq('is_enabled', true).maybeSingle(),
      supabase.from('integrations').select('status').eq('organization_id', orgId).eq('type', 'whatsapp').neq('status', 'disabled').maybeSingle(),
    ])

  const org = orgResult.data

  const businessOk = org !== null && org.name !== 'My Business'
  const servicesOk = (servicesResult.count ?? 0) > 0
  const employeesOk = (employeesResult.count ?? 0) > 0

  const booking = bookingResult.data
  const hasCustomHours =
    booking !== null &&
    (booking.spa_opening_time !== '09:00' || booking.spa_closing_time !== '20:00')
  const hoursOk = hasCustomHours

  const whatsappOk =
    providersResult.data !== null || integrationsResult.data !== null

  const completed: Record<OnboardingStep, boolean> = {
    business: businessOk,
    services: servicesOk,
    employees: employeesOk,
    hours: hoursOk,
    whatsapp: whatsappOk,
  }

  const createdRecently =
    org !== null &&
    new Date(org.created_at).getTime() > Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000

  const coreMissing = !businessOk || !servicesOk || !employeesOk
  const isFirstTime = createdRecently && coreMissing

  const totalCompleted = CORE_STEPS.filter((s) => completed[s]).length

  const currentStep = CORE_STEPS.find((s) => !completed[s]) ?? 'whatsapp'

  return {
    isFirstTime,
    currentStep,
    completed,
    totalCompleted,
    totalSteps: CORE_STEPS.length,
  }
}
