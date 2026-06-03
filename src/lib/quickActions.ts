import { Calendar, UserPlus, CheckCircle2, type LucideIcon } from 'lucide-react'
import type { UserRole } from '@/types/user'

export interface QuickAction {
  id: string
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'new-appointment',
    label: 'Nuevo turno',
    href: '/calendar?new=true',
    icon: Calendar,
    roles: ['owner', 'admin', 'staff'],
  },
  {
    id: 'new-client',
    label: 'Nuevo cliente',
    href: '/clients?new=true',
    icon: UserPlus,
    roles: ['owner', 'admin', 'staff'],
  },
  {
    id: 'walkin',
    label: 'Confirmación walk-in',
    href: '/confirmations/walkin',
    icon: CheckCircle2,
    roles: ['owner', 'admin', 'staff'],
  },
]
