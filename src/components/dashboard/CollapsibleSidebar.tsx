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
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
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
  const supabase = createClient()

  const isEmployee = role === 'employee'

  const allRoutes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/',
    },
    {
      href: '/calendar',
      label: 'Agenda',
      icon: CalendarDays,
      active: pathname.startsWith('/calendar'),
    },
    {
      href: '/employees',
      label: 'Equipo',
      icon: Users,
      active: pathname.startsWith('/employees'),
      hideForEmployee: true,
    },
    {
      href: '/services',
      label: 'Servicios',
      icon: Scissors,
      active: pathname.startsWith('/services'),
    },
    {
      href: '/clients',
      label: 'Clientes',
      icon: UserCircle,
      active: pathname.startsWith('/clients'),
    },
    {
      href: '/inventory',
      label: 'Inventario',
      icon: Package,
      active: pathname.startsWith('/inventory'),
      hideForEmployee: true,
    },
    {
      href: '/confirmations',
      label: 'Confirmaciones',
      icon: CheckCircle,
      active: pathname.startsWith('/confirmations'),
    },
    {
      href: '/billing',
      label: 'Pagos',
      icon: CreditCard,
      active: pathname.startsWith('/billing'),
      hideForEmployee: true,
    },
    {
      href: '/whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      active: pathname.startsWith('/whatsapp'),
      hideForEmployee: true,
    },
    {
      href: '/email',
      label: 'Email',
      icon: Mail,
      active: pathname.startsWith('/email'),
      hideForEmployee: true,
    },
    {
      href: '/settings',
      label: 'Ajustes',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      hideForEmployee: true,
    },
  ]

  const routes = allRoutes.filter(route => {
    if (isEmployee && route.hideForEmployee) {
      return false
    }
    return true
  })

  useEffect(() => {
    if (hoveredRoute && isCollapsed) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setTooltipVisible(true)
      }, 200)
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
      className="hidden md:flex flex-col z-30 transition-all duration-300 ease-out flex-shrink-0 border-r"
      style={{ 
        width: isCollapsed ? '64px' : '280px',
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {/* Logo */}
      <div 
        className="h-20 flex items-center shrink-0 transition-all duration-300"
        style={{ 
          paddingLeft: isCollapsed ? '16px' : '32px',
          paddingRight: isCollapsed ? '16px' : '32px',
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Link 
          href="/calendar" 
          className="flex items-center gap-3 group"
        >
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md transform transition-transform duration-200 group-hover:scale-105 flex-shrink-0"
            style={{ background: COLORS.primaryGradient }}
          >
            <span className="text-white font-serif font-bold text-lg leading-none">P</span>
          </div>
          <span 
            className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300"
            style={{ 
              color: COLORS.textPrimary, 
              fontFamily: "'Cormorant Garamond', serif",
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
        className="flex-1 py-4 overflow-y-auto overflow-x-hidden transition-all duration-300"
        style={{ 
          paddingLeft: isCollapsed ? '8px' : '16px', 
          paddingRight: isCollapsed ? '8px' : '16px',
          maxHeight: 'calc(100vh - 80px - 80px)', // header 80px + footer toggle 80px aproximate
        }}
        aria-label="Navegación principal"
      >
        <div className="space-y-1.5">
          {routes.map((route) => {
            const Icon = route.icon
            const isActive = route.active
            const isHovered = hoveredRoute === route.href
            
            return (
              <div key={route.href} className="relative">
                <Link
                  href={route.href}
                  className={`
                    group flex items-center gap-3 px-3 py-3 rounded-xl min-h-[48px]
                    transition-all duration-200 font-medium text-sm
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    justify-center
                    ${isActive 
                      ? 'text-white shadow-lg' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                  style={{ 
                    background: isActive ? COLORS.primaryGradient : 'transparent',
                    color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    width: '100%',
                  }}
                  onMouseEnter={() => setHoveredRoute(route.href)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon 
                    className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                    aria-hidden="true" 
                  />
                  <span 
                    className="whitespace-nowrap overflow-hidden transition-all duration-200"
                    style={{ 
                      opacity: isCollapsed ? 0 : 1,
                      width: isCollapsed ? '0' : 'auto',
                    }}
                  >
                    {route.label}
                  </span>
                </Link>

                {/* Tooltip cuando está colapsado */}
                {isCollapsed && isHovered && tooltipVisible && (
                  <div 
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none"
                    style={{
                      animation: 'fadeIn 150ms ease-out',
                    }}
                  >
                    <div 
                      className="px-3 py-2 rounded-lg shadow-lg whitespace-nowrap"
                      style={{ 
                        backgroundColor: COLORS.textPrimary,
                        color: COLORS.surface,
                      }}
                    >
                      <span 
                        className="text-sm font-medium"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {route.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Footer with Toggle */}
      <div 
        className="shrink-0 border-t transition-all duration-300"
        style={{ 
          borderColor: COLORS.border,
          padding: isCollapsed ? '8px' : '12px',
          height: isCollapsed ? 'auto' : 'auto',
        }}
      >
        {/* Profile Badge */}
        <div 
          className="overflow-hidden transition-all duration-300 flex items-center justify-center"
          style={{ 
            height: isCollapsed ? '0px' : '48px',
            opacity: isCollapsed ? 0 : 1,
            marginBottom: isCollapsed ? '0px' : '8px',
          }}
        >
          {role && (
            <div 
              className="px-3 py-2 rounded-xl w-full flex items-center justify-between"
              style={{ 
                backgroundColor: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}` 
              }}
            >
              <span 
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: COLORS.textMuted }}
              >
                Perfil
              </span>
              <span 
                className="text-xs font-semibold capitalize"
                style={{ color: COLORS.primary }}
              >
                {role}
              </span>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl min-h-[48px] transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 group"
          style={{ color: COLORS.textSecondary }}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span 
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Colapsar
              </span>
            </>
          )}
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-8px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
      `}</style>
    </aside>
  )
}
