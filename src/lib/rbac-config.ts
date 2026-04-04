import { AlertTriangle, ShieldAlert, Info } from 'lucide-react'

export type RiskLevel = 'low' | 'medium' | 'critical'

export interface RoleSecurityConfig {
  color: string
  bgColor: string
  borderColor: string
  icon: typeof AlertTriangle | typeof ShieldAlert | typeof Info
  iconColor: string
  permissions: string[]
  riskLevel: RiskLevel
  requiresTextConfirmation: boolean
}

export const ROLE_SECURITY_CONFIG: Record<'staff' | 'admin', RoleSecurityConfig> = {
  staff: {
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    permissions: [
      'Ver y gestionar la agenda completa',
      'Confirmar y gestionar citas',
      'Invitar nuevos empleados al sistema',
    ],
    riskLevel: 'medium',
    requiresTextConfirmation: false,
  },
  admin: {
    color: '#DC2626',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: ShieldAlert,
    iconColor: 'text-red-500',
    permissions: [
      'Acceso completo al sistema',
      'Gestión de empleados y servicios',
      'Configuración del negocio',
      'Nómina y reportes financieros',
      'Billing y suscripciones',
      'Gestión de integraciones (WhatsApp, Email)',
    ],
    riskLevel: 'critical',
    requiresTextConfirmation: true,
  },
}

export type PrivilegeChangeType = 'escalation' | 'lateral' | 'degradation' | 'minor'

export function getPrivilegeChangeType(
  fromRole: string | null,
  toRole: 'staff' | 'admin'
): PrivilegeChangeType {
  if (!fromRole || fromRole === 'empleado') {
    return toRole === 'admin' ? 'escalation' : 'minor'
  }
  
  if (fromRole === 'admin') {
    return 'degradation'
  }
  
  if (fromRole === 'staff' && toRole === 'admin') {
    return 'lateral'
  }
  
  return 'degradation'
}