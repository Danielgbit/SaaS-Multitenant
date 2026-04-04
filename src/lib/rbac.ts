import type { MemberRole } from '@/types/invitations'

export type RoleLabel = {
  value: MemberRole
  label: string
  description: string
}

export const ROLE_LABELS: Record<MemberRole, RoleLabel> = {
  admin: {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso completo al sistema',
  },
  staff: {
    value: 'staff',
    label: 'Asistente',
    description: 'Agenda, confirmaciones e invitaciones',
  },
  empleado: {
    value: 'empleado',
    label: 'Empleado',
    description: 'Agenda, confirmaciones y su nómina',
  },
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as MemberRole]?.label || role
}

export function isOwner(role: string | null): boolean {
  return role === 'owner'
}

export function isAdmin(role: string | null): boolean {
  return role === 'admin'
}

export function isStaff(role: string | null): boolean {
  return role === 'staff'
}

export function isEmpleado(role: string | null): boolean {
  return role === 'empleado'
}

export function canAccessRoute(role: string | null, route: string): boolean {
  if (!role) return false

  if (isOwner(role) || isAdmin(role)) return true

  if (isStaff(role)) {
    const staffRestricted = [
      '/dashboard/employees',
      '/dashboard/payroll',
      '/dashboard/inventory',
      '/dashboard/whatsapp',
      '/dashboard/email',
      '/dashboard/settings',
      '/dashboard/billing',
    ]
    return !staffRestricted.some(r => route.startsWith(r))
  }

  if (isEmpleado(role)) {
    const empleadoRestricted = [
      '/dashboard/employees',
      '/dashboard/clients',
      '/dashboard/services',
      '/dashboard/inventory',
      '/dashboard/whatsapp',
      '/dashboard/email',
      '/dashboard/settings',
      '/dashboard/billing',
    ]
    if (empleadoRestricted.some(r => route.startsWith(r))) return false
    return true
  }

  return false
}

export function getDashboardDefaultRoute(role: string | null): string {
  if (isEmpleado(role)) return '/dashboard/payroll/mi'
  return '/dashboard'
}