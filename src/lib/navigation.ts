import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, CalendarDays, CheckCircle, Bell, ShieldCheck,
  FileSearch, Users, Receipt, WalletCards, UserCircle, Wallet,
  Scissors, Clock, Package, MessageSquare, Mail, CreditCard, Settings,
} from 'lucide-react'

export interface RouteDefinition {
  href: string
  label: string
  icon: LucideIcon
  group: string
  hideForStaff?: boolean
  hideForEmpleado?: boolean
  showOnlyForEmpleado?: boolean
  badge?: string
  activeMatch?: string[]
}

export const dashboardRoutes: RouteDefinition[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    group: 'Operaciones',
    activeMatch: ['/dashboard', '/'],
  },
  {
    href: '/calendar',
    label: 'Agenda',
    icon: CalendarDays,
    group: 'Operaciones',
  },
  {
    href: '/confirmations',
    label: 'Confirmaciones',
    icon: CheckCircle,
    group: 'Operaciones',
  },
  {
    href: '/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
    group: 'Operaciones',
    activeMatch: [
      '/notificaciones',
      '/notificaciones/messages',
      '/notificaciones/dead-letter',
      '/notificaciones/validacion',
    ],
  },
  {
    href: '/notificaciones/validacion',
    label: 'Validación V2',
    icon: ShieldCheck,
    group: 'Operaciones',
    badge: 'Beta',
  },
  {
    href: '/notificaciones/messages',
    label: 'Inspector',
    icon: FileSearch,
    group: 'Operaciones',
  },
  {
    href: '/employees',
    label: 'Equipo',
    icon: Users,
    group: 'Gestión',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/payroll',
    label: 'Nómina',
    icon: Receipt,
    group: 'Gestión',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/payroll/mi',
    label: 'Mi Nómina',
    icon: WalletCards,
    group: 'Gestión',
    showOnlyForEmpleado: true,
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: UserCircle,
    group: 'Gestión',
    hideForEmpleado: true,
  },
  {
    href: '/clients/accounts',
    label: 'Cuentas por Cobrar',
    icon: Wallet,
    group: 'Gestión',
    hideForEmpleado: true,
  },
  {
    href: '/services',
    label: 'Servicios',
    icon: Scissors,
    group: 'Gestión',
    hideForEmpleado: true,
  },
  {
    href: '/horarios',
    label: 'Horarios',
    icon: Clock,
    group: 'Configuración',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/inventory',
    label: 'Inventario',
    icon: Package,
    group: 'Gestión',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/whatsapp',
    label: 'WhatsApp',
    icon: MessageSquare,
    group: 'Integraciones',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/email',
    label: 'Email',
    icon: Mail,
    group: 'Integraciones',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/billing',
    label: 'Facturación',
    icon: CreditCard,
    group: 'Sistema',
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: Settings,
    group: 'Sistema',
    hideForStaff: true,
    hideForEmpleado: true,
  },
]

export function filterRoutesByRole(routes: RouteDefinition[], role: string | null | undefined): RouteDefinition[] {
  return routes.filter(route => {
    if (role === 'staff' && route.hideForStaff) {
      return false
    }
    if (role === 'empleado' && route.hideForEmpleado) {
      return false
    }
    if (route.showOnlyForEmpleado && role !== 'empleado') {
      return false
    }
    return true
  })
}

export function groupRoutesByGroup(routes: RouteDefinition[]): Record<string, RouteDefinition[]> {
  const grouped: Record<string, RouteDefinition[]> = {}

  for (const route of routes) {
    if (!grouped[route.group]) {
      grouped[route.group] = []
    }
    grouped[route.group].push(route)
  }

  return grouped
}

export function routeKey(href: string): string {
  return href.replace(/^\/+/, '')
}

export function matchesPath(pathname: string, href: string): boolean {
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/'
  const cleanHref = href.replace(/\/$/, '') || '/'

  if (cleanHref === '/dashboard') {
    return cleanPath === '/' || cleanPath === '/dashboard'
  }

  return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`)
}

export function isRouteActive(pathname: string, route: RouteDefinition): boolean {
  const matchList = route.activeMatch ?? [route.href]
  return matchList.some(href => matchesPath(pathname, href))
}