export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

export function formatCurrencyFromCents(cents: number, currency: string = 'EUR'): string {
  return formatCurrency(cents / 100, currency)
}

export function centsToAmount(cents: number): number {
  return cents / 100
}

export function amountToCents(amount: number): number {
  return Math.round(amount * 100)
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  
  const now = new Date()
  const trialEnd = new Date(trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) < new Date()
}

export function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid'

export function getSubscriptionStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    trial: 'Período de prueba',
    active: 'Activo',
    past_due: 'Pago pendiente',
    canceled: 'Cancelado',
    unpaid: 'Sin pagar',
  }
  return labels[status] || status
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    trial: '#D97706',
    active: '#059669',
    past_due: '#DC2626',
    canceled: '#6B7280',
    unpaid: '#DC2626',
  }
  return colors[status] || '#6B7280'
}

export type PlanTier = 'basic' | 'professional' | 'enterprise'

export interface Plan {
  id: string
  name: string
  price: number
  max_employees: number
  max_services: number
  max_inventory_items: number
  whatsapp_enabled: boolean
  stripe_price_id: string | null
  description: string | null
  features: string[] | null
}

export function isPlanUnlimited(value: number): boolean {
  return value === -1
}

export function getPlanTier(planName: string): PlanTier {
  const name = planName.toLowerCase()
  if (name.includes('enterprise')) return 'enterprise'
  if (name.includes('profesional')) return 'professional'
  return 'basic'
}

export function canUseWhatsApp(plan: Plan | null): boolean {
  if (!plan) return false
  return plan.whatsapp_enabled
}

export function hasReachedEmployeeLimit(currentCount: number, plan: Plan | null): boolean {
  if (!plan) return true
  if (isPlanUnlimited(plan.max_employees)) return false
  return currentCount >= plan.max_employees
}

export function hasReachedServiceLimit(currentCount: number, plan: Plan | null): boolean {
  if (!plan) return true
  if (isPlanUnlimited(plan.max_services)) return false
  return currentCount >= plan.max_services
}

export function hasReachedInventoryLimit(currentCount: number, plan: Plan | null): boolean {
  if (!plan) return true
  if (isPlanUnlimited(plan.max_inventory_items)) return false
  return currentCount >= plan.max_inventory_items
}
