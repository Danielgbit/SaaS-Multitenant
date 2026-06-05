import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, CalendarDays, CheckCircle, Bell, ShieldCheck,
  FileSearch, Users, Receipt, WalletCards, UserCircle, Wallet,
  Scissors, Clock, Package, MessageSquare, Mail, CreditCard, Settings, Smile, DollarSign,
} from 'lucide-react'

export const NAV_GROUPS = {
  MAIN: 'main',
  STAFF: 'staff',
  TEAM: 'team',
  BUSINESS: 'business',
  COMMS: 'communications',
  SYSTEM: 'system',
} as const

export type NavGroupId = typeof NAV_GROUPS[keyof typeof NAV_GROUPS]

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  main: 'Principal',
  staff: 'Personal',
  team: 'Equipo',
  business: 'Negocio',
  communications: 'Comunicaciones',
  system: 'Sistema',
}

export const NAV_GROUP_ORDER: NavGroupId[] = [
  'main', 'staff', 'team', 'business', 'communications', 'system',
]

export interface RouteDefinition {
  href: string
  label: string
  icon: LucideIcon
  group: NavGroupId
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
    group: NAV_GROUPS.MAIN,
    activeMatch: ['/dashboard', '/'],
  },
  {
    href: '/caja',
    label: 'Caja del Día',
    icon: DollarSign,
    group: NAV_GROUPS.MAIN,
    hideForEmpleado: true,
  },
  {
    href: '/calendar',
    label: 'Agenda',
    icon: CalendarDays,
    group: NAV_GROUPS.MAIN,
  },
  {
    href: '/confirmations',
    label: 'Confirmaciones',
    icon: CheckCircle,
    group: NAV_GROUPS.MAIN,
  },
  {
    href: '/notificaciones',
    label: 'Notificaciones',
    icon: Bell,
    group: NAV_GROUPS.BUSINESS,
    activeMatch: [
      '/notificaciones',
      '/notificaciones/mensajes',
      '/notificaciones/rechazados',
      '/notificaciones/validacion',
    ],
  },
  {
    href: '/notificaciones/validacion',
    label: 'Validación V2',
    icon: ShieldCheck,
    group: NAV_GROUPS.COMMS,
  },
  {
    href: '/notificaciones/mensajes',
    label: 'Inspector',
    icon: FileSearch,
    group: NAV_GROUPS.COMMS,
  },
  {
    href: '/employees',
    label: 'Equipo',
    icon: Users,
    group: NAV_GROUPS.TEAM,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/nomina',
    label: 'Nómina',
    icon: Receipt,
    group: NAV_GROUPS.TEAM,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/nomina/mi',
    label: 'Mi Nómina',
    icon: WalletCards,
    group: NAV_GROUPS.STAFF,
    showOnlyForEmpleado: true,
  },
  {
    href: '/mi',
    label: 'Mi Espacio',
    icon: Smile,
    group: NAV_GROUPS.STAFF,
    showOnlyForEmpleado: true,
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: UserCircle,
    group: NAV_GROUPS.TEAM,
    hideForEmpleado: true,
  },
  {
    href: '/clients/accounts',
    label: 'Cuentas por Cobrar',
    icon: Wallet,
    group: NAV_GROUPS.BUSINESS,
    hideForEmpleado: true,
  },
  {
    href: '/services',
    label: 'Servicios',
    icon: Scissors,
    group: NAV_GROUPS.TEAM,
    hideForEmpleado: true,
  },
  {
    href: '/horarios',
    label: 'Horarios',
    icon: Clock,
    group: NAV_GROUPS.BUSINESS,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/inventario',
    label: 'Inventario',
    icon: Package,
    group: NAV_GROUPS.BUSINESS,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/whatsapp',
    label: 'WhatsApp',
    icon: MessageSquare,
    group: NAV_GROUPS.COMMS,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/correo',
    label: 'Email',
    icon: Mail,
    group: NAV_GROUPS.COMMS,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/facturacion',
    label: 'Facturación',
    icon: CreditCard,
    group: NAV_GROUPS.SYSTEM,
    hideForStaff: true,
    hideForEmpleado: true,
  },
  {
    href: '/ajustes',
    label: 'Ajustes',
    icon: Settings,
    group: NAV_GROUPS.SYSTEM,
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

export function groupRoutesByGroup<T extends RouteDefinition>(routes: T[]): Record<NavGroupId, T[]> {
  const grouped = {} as Record<NavGroupId, T[]>
  for (const route of routes) {
    if (!grouped[route.group]) {
      grouped[route.group] = [] as T[]
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