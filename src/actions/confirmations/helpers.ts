import type { ConfirmationStatus } from '@/types/confirmations'

export interface ServiceWithPrice {
  service_id: string
  price: number
}

export interface EmployeeServiceOverride {
  service_id: string
  price_override: number | null
}

export function canConfirm(
  status: ConfirmationStatus
): { allowed: boolean; reason?: string } {
  if (status === 'confirmed') {
    return { allowed: false, reason: 'Esta cita ya fue confirmada.' }
  }
  if (status === 'scheduled' || status === 'pending_confirmation') {
    return { allowed: false, reason: 'Esta cita aún no fue marcada por el empleado.' }
  }
  if (status === 'completed' || status === 'needs_review') {
    return { allowed: true }
  }
  const _exhaustive: never = status
  return { allowed: false, reason: 'Estado inválido' }
}

export function canMarkCompleted(
  status: ConfirmationStatus,
  appointmentEmployeeId: string | null,
  currentEmployeeId: string
): { allowed: boolean; reason?: string } {
  if (!appointmentEmployeeId) {
    return { allowed: false, reason: 'Cita no asignada' }
  }
  if (appointmentEmployeeId !== currentEmployeeId) {
    return { allowed: false, reason: 'Solo puedes marcar como completadas tus propias citas.' }
  }
  if (status === 'confirmed') {
    return { allowed: false, reason: 'Esta cita ya fue cobrada.' }
  }
  if (status === 'completed') {
    return { allowed: false, reason: 'Ya marcaste completado' }
  }
  if (status === 'scheduled' || status === 'pending_confirmation' || status === 'needs_review') {
    return { allowed: true }
  }
  const _exhaustive: never = status
  return { allowed: false, reason: 'Estado inválido' }
}

export function calculateTotal(
  services: ServiceWithPrice[],
  overrides: EmployeeServiceOverride[],
  adjustment: number = 0
): number {
  const overrideMap = new Map(
    overrides.map(o => [o.service_id, o.price_override])
  )
  const baseTotal = services.reduce(
    (sum, s) => sum + (overrideMap.get(s.service_id) ?? s.price),
    0
  )
  return baseTotal + adjustment
}
