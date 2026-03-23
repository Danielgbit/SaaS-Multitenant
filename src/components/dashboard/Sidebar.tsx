'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users, Scissors, LayoutDashboard, UserCircle, CreditCard, MessageSquare, Mail, Package, CheckCircle, Settings, Receipt } from 'lucide-react'

interface SidebarProps {
  role: string | null
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const isStaff = role === 'staff'

  const allRoutes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/',
      group: 'Operaciones',
    },
    {
      href: '/calendar',
      label: 'Agenda',
      icon: CalendarDays,
      active: pathname.startsWith('/calendar'),
      group: 'Operaciones',
    },
    {
      href: '/confirmations',
      label: 'Confirmaciones',
      icon: CheckCircle,
      active: pathname.startsWith('/confirmations'),
      group: 'Operaciones',
    },
    {
      href: '/employees',
      label: 'Equipo',
      icon: Users,
      active: pathname.startsWith('/employees'),
      group: 'Gestión',
      hideForStaff: true,
    },
    {
      href: '/payroll',
      label: 'Nómina',
      icon: Receipt,
      active: pathname.startsWith('/payroll'),
      group: 'Gestión',
      hideForStaff: true,
    },
    {
      href: '/clients',
      label: 'Clientes',
      icon: UserCircle,
      active: pathname.startsWith('/clients'),
      group: 'Gestión',
    },
    {
      href: '/services',
      label: 'Servicios',
      icon: Scissors,
      active: pathname.startsWith('/services'),
      group: 'Gestión',
    },
    {
      href: '/inventory',
      label: 'Inventario',
      icon: Package,
      active: pathname.startsWith('/inventory'),
      group: 'Gestión',
      hideForStaff: true,
    },
    {
      href: '/whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      active: pathname.startsWith('/whatsapp'),
      group: 'Integraciones',
      hideForStaff: true,
    },
    {
      href: '/email',
      label: 'Email',
      icon: Mail,
      active: pathname.startsWith('/email'),
      group: 'Integraciones',
      hideForStaff: true,
    },
    {
      href: '/billing',
      label: 'Facturación',
      icon: CreditCard,
      active: pathname.startsWith('/billing'),
      group: 'Sistema',
      hideForStaff: true,
    },
    {
      href: '/settings',
      label: 'Ajustes',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      group: 'Sistema',
      hideForStaff: true,
    },
  ]

  const filteredRoutes = allRoutes.filter(route => {
    if (isStaff && route.hideForStaff) {
      return false
    }
    return true
  })

  const groupedRoutes = filteredRoutes.reduce((acc, route) => {
    if (!acc[route.group]) {
      acc[route.group] = []
    }
    acc[route.group].push(route)
    return acc
  }, {} as Record<string, typeof filteredRoutes>)

  return (
    <aside className="w-72 hidden md:flex flex-col bg-white dark:bg-[#1E293B] border-r border-slate-200 dark:border-slate-800/60 z-30 transition-colors duration-200 flex-shrink-0">
      <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
        <Link 
          href="/calendar" 
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 rounded-lg p-1"
          aria-label="Ir al inicio de Prügressy"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F4C5C] to-[#0C3E4A] dark:from-[#38BDF8] dark:to-[#0EA5E9] flex items-center justify-center shadow-md transform transition-transform duration-200 group-hover:scale-105">
            <span className="text-white font-serif font-bold text-lg leading-none">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-serif">
            Prügressy
          </span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-4 overflow-y-auto" aria-label="Navegación principal">
        {Object.entries(groupedRoutes).map(([group, routes]) => (
          <div key={group} className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider px-4 py-2 text-slate-400 dark:text-slate-500">
              {group}
            </div>
            {routes.map((route: typeof filteredRoutes[0]) => {
              const Icon = route.icon
              const isActive = route.active
              
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl min-h-[44px]
                    transition-all duration-200 font-medium text-sm
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2
                    ${isActive 
                      ? 'bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8]' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                    aria-hidden="true" 
                  />
                  {route.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
        {role && (
          <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Perfil</span>
            <span className="text-xs font-semibold text-[#0F4C5C] dark:text-[#38BDF8] capitalize">{role}</span>
          </div>
        )}
      </div>
    </aside>
  )
}