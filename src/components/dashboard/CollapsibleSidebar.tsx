'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { 
  CalendarDays, 
  Users, 
  Scissors,
  LayoutDashboard, 
  UserCircle, 
  CreditCard, 
  MessageSquare, 
  Mail, 
  Package, 
  CheckCircle, 
  Settings,
  ChevronLeft,
  Receipt
} from 'lucide-react'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryHover: isDark ? '#0EA5E9' : '#0C3E4A',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    primarySubtle: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 76, 92, 0.06)',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceHover: isDark ? '#334155' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    isDark,
  }
}

interface CollapsibleSidebarProps {
  role: string | null
  isCollapsed: boolean
  onToggle: () => void
}

export function CollapsibleSidebar({ role, isCollapsed, onToggle }: CollapsibleSidebarProps) {
  const COLORS = useColors()
  const pathname = usePathname()
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  useEffect(() => {
    if (hoveredRoute && isCollapsed) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setTooltipVisible(true)
      }, 300)
    } else {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
      setTooltipVisible(false)
    }

    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [hoveredRoute, isCollapsed])

  return (
    <aside 
      className="md:flex flex-col z-30 transition-all duration-300 ease-out flex-shrink-0 border-r"
      style={{ 
        width: isCollapsed ? '72px' : '260px',
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {/* Logo Section */}
      <div 
        className="relative flex items-center shrink-0 transition-all duration-300"
        style={{ 
          height: '72px',
          paddingLeft: isCollapsed ? '20px' : '24px',
          paddingRight: isCollapsed ? '20px' : '24px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Link 
          href="/calendar" 
          className="flex items-center gap-3 group"
        >
          <div 
            className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
            style={{ background: COLORS.primaryGradient }}
          >
            <span className="text-white font-serif font-bold text-xl leading-none">P</span>
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800"
              style={{ backgroundColor: '#34D399' }}
            />
          </div>
          <span 
            className="font-display text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300"
            style={{ 
              color: COLORS.textPrimary, 
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? '0' : 'auto',
            }}
          >
            Prügressy
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 scrollbar-thin"
        style={{ 
          paddingTop: '12px',
          paddingBottom: '12px',
          maskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)',
        }}
        aria-label="Navegación principal"
      >
        <div 
          className="space-y-4 px-3"
          style={{
            paddingLeft: isCollapsed ? '12px' : '16px',
            paddingRight: isCollapsed ? '12px' : '16px',
          }}
        >
          {Object.entries(groupedRoutes).map(([group, routes]) => (
            <div key={group} className="space-y-0.5">
              {!isCollapsed && (
                <div 
                  className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2"
                  style={{ color: COLORS.textMuted }}
                >
                  {group}
                </div>
              )}
              {routes.map((route: typeof filteredRoutes[0]) => {
                const Icon = route.icon
                const isActive = route.active
                const isHovered = hoveredRoute === route.href
                
                return (
                  <div key={route.href} className="relative">
                    {isActive && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-200"
                        style={{ 
                          height: '24px',
                          background: COLORS.primaryGradient,
                        }}
                      />
                    )}
                    
                    <Link
                      href={route.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 font-medium text-sm
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        ${isActive 
                          ? '' 
                          : 'hover:bg-opacity-60'
                        }
                      `}
                      style={{ 
                        backgroundColor: isActive 
                          ? COLORS.primarySubtle 
                          : isHovered 
                            ? COLORS.surfaceHover 
                            : 'transparent',
                        color: isActive 
                          ? COLORS.primary 
                          : COLORS.textSecondary,
                        width: '100%',
                        paddingLeft: isActive ? '20px' : '16px',
                      }}
                      onMouseEnter={() => setHoveredRoute(route.href)}
                      onMouseLeave={() => setHoveredRoute(null)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon 
                        className={`
                          w-5 h-5 flex-shrink-0 transition-all duration-200
                          ${isActive 
                            ? 'scale-110' 
                            : isHovered 
                              ? 'scale-105' 
                              : ''
                          }
                        `}
                        style={{ 
                          color: isActive ? COLORS.primary : COLORS.textSecondary,
                        }}
                        aria-hidden="true" 
                      />
                      <span 
                        className="whitespace-nowrap overflow-hidden transition-all duration-300"
                        style={{ 
                          opacity: isCollapsed ? 0 : 1,
                          width: isCollapsed ? '0' : 'auto',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {route.label}
                      </span>
                      
                      {isActive && (
                        <div 
                          className="absolute inset-0 rounded-lg opacity-20 pointer-events-none transition-opacity duration-200"
                          style={{ 
                            background: `linear-gradient(90deg, ${COLORS.primary}15, transparent)`,
                          }}
                        />
                      )}
                    </Link>

                    {isCollapsed && isHovered && tooltipVisible && (
                      <div 
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none animate-slideInLeft"
                      >
                        <div 
                          className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap"
                          style={{ 
                            backgroundColor: COLORS.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                            color: '#F8FAFC',
                            border: `1px solid ${COLORS.isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(51, 65, 85, 0.3)'}`,
                          }}
                        >
                          <Icon className="w-4 h-4" style={{ color: COLORS.primary }} aria-hidden="true" />
                          <span 
                            className="text-sm font-medium"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {route.label}
                          </span>
                        </div>
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 rotate-45"
                          style={{ 
                            backgroundColor: COLORS.isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.95)',
                            borderLeft: `1px solid ${COLORS.isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(51, 65, 85, 0.3)'}`,
                            borderBottom: `1px solid ${COLORS.isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(51, 65, 85, 0.3)'}`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer with Profile and Toggle */}
      <div 
        className="shrink-0 border-t"
        style={{ 
          borderColor: COLORS.border,
          padding: isCollapsed ? '12px' : '16px',
        }}
      >
        {/* Profile Badge */}
        {!isCollapsed && role && (
          <div 
            className="mb-3 transition-all duration-300 animate-scaleIn"
          >
            <div 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ 
                backgroundColor: COLORS.surfaceHover,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: COLORS.primaryGradient }}
              >
                <span 
                  className="text-white font-semibold text-xs uppercase"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {role.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.textMuted }}
                >
                  Rol
                </p>
                <p 
                  className="text-sm font-semibold capitalize truncate"
                  style={{ color: COLORS.primary }}
                >
                  {role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
            transition-all duration-200 
            hover:bg-opacity-50 group
            ${isCollapsed ? 'justify-center' : 'justify-between'}
          `}
          style={{ 
            backgroundColor: COLORS.surfaceHover,
            color: COLORS.textSecondary,
          }}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {!isCollapsed && (
            <span 
              className="text-sm font-medium"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Colapsar
            </span>
          )}
          <div 
            className={`
              w-7 h-7 rounded-lg flex items-center justify-center
              transition-all duration-300
              ${isCollapsed ? '' : 'rotate-180'}
            `}
            style={{ 
              backgroundColor: COLORS.primary,
              color: 'white',
            }}
          >
            <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
          </div>
        </button>
      </div>
    </aside>
  )
}
