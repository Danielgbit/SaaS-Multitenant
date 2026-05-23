'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { dashboardRoutes, filterRoutesByRole, groupRoutesByGroup, type RouteDefinition } from '@/lib/navigation'
import { ChevronLeft } from 'lucide-react'
import { getRoleLabel } from '@/lib/rbac'
import { motion } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'

interface CollapsibleSidebarProps {
  role: string | null
  organizationName?: string | null
  isCollapsed: boolean
  onToggle: () => void
}

export function CollapsibleSidebar({ role, organizationName, isCollapsed, onToggle }: CollapsibleSidebarProps) {
  const COLORS = useThemeColors()
  const pathname = usePathname()
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isEmpleado = role === 'empleado'

  const filteredRoutes = filterRoutesByRole(dashboardRoutes, role)

  const routesWithActive: RouteDefinition[] = filteredRoutes.map(route => ({
    ...route,
    active:
      route.href === '/dashboard'
        ? pathname === '/dashboard' || pathname === '/'
        : route.href === '/notificaciones'
          ? pathname === '/notificaciones' || pathname.startsWith('/notificaciones/dead-letter') || pathname.startsWith('/notificaciones/validacion') || pathname.startsWith('/notificaciones/messages')
          : route.href === '/payroll'
            ? pathname.startsWith('/payroll') && !pathname.startsWith('/payroll/mi')
            : pathname.startsWith(route.href),
  }))

  const groupedRoutes = groupRoutesByGroup(routesWithActive)

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
    <motion.aside 
      className="hidden md:flex flex-col z-30 flex-shrink-0 border-r bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border-r border-white/20 dark:border-white/[0.12]"
      initial={{ width: isCollapsed ? 72 : 260 }}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div 
        className="relative flex items-center shrink-0 transition-all duration-300 border-b border-white/20 dark:border-white/10"
        style={{
          height: '72px',
          paddingLeft: isCollapsed ? '20px' : '24px',
          paddingRight: isCollapsed ? '20px' : '24px',
        }}
      >
        <Link
          href="/calendar"
          className="flex items-center gap-3 group"
        >
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 flex-shrink-0 bg-gradient-to-br from-[#0F4C5C] to-[#115E59] dark:from-[#38BDF8] dark:to-[#2DD4BF]"
          >
            <span className="text-white font-serif font-bold text-xl leading-none">P</span>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-800"
            />
          </div>
          {isEmpleado && organizationName ? (
            <div
              className="flex flex-col overflow-hidden transition-all duration-300"
              style={{ opacity: isCollapsed ? 0 : 1 }}
            >
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                Trabajando en
              </span>
              <span
                className="font-heading text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-slate-900 dark:text-slate-100 truncate"
              >
                {organizationName}
              </span>
            </div>
          ) : (
            <span
              className="font-heading text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 text-slate-900 dark:text-slate-100"
              style={{
                opacity: isCollapsed ? 0 : 1,
              }}
            >
              Prügressy
            </span>
          )}
        </Link>
      </div>

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
            <div key={group} className="space-y-1">
              {!isCollapsed && (
                <div className="text-sidebar-label px-3 py-2 text-slate-400 dark:text-slate-500">
                  {group}
                </div>
              )}
              {routes.map((route: typeof filteredRoutes[0]) => {
                const Icon = route.icon
                const isActive = route.active
                const isHovered = hoveredRoute === route.href
                
                return (
                  <div key={route.href} className="relative">
                    <Link
                      href={route.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 font-medium text-sm
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                        ${isActive 
                          ? '' 
                          : 'hover:bg-[#0F4C5C]/5 dark:hover:bg-white/[0.08]'
                        }
                      `}
                      style={{ 
                        width: '100%',
                        paddingLeft: isActive ? '12px' : '16px',
                        paddingRight: isActive ? '12px' : '16px',
                      }}
                      onMouseEnter={() => setHoveredRoute(route.href)}
                      onMouseLeave={() => setHoveredRoute(null)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive && (
                        <div 
                          className="absolute inset-y-1 left-1 right-1 rounded-lg bg-[#0F4C5C]/8 dark:bg-[#38BDF8]/10 border border-[#0F4C5C]/15 dark:border-[#38BDF8]/20"
                        />
                      )}
                      
                      <Icon 
                        className={`
                          w-5 h-5 flex-shrink-0 transition-all duration-200 relative z-10
                          ${isActive 
                            ? 'scale-110' 
                            : isHovered 
                              ? 'scale-105' 
                              : ''
                          }
                        `}
                        style={{ color: isActive ? COLORS.accentTeal : undefined }}
                        aria-hidden="true" 
                      />
                      <span 
                        className="whitespace-nowrap overflow-hidden transition-all duration-300 flex items-center gap-2 relative z-10"
                        style={{ 
                          opacity: isCollapsed ? 0 : 1,
                          width: isCollapsed ? '0' : 'auto',
                          color: isActive ? COLORS.accentTeal : undefined,
                        }}
                      >
                        {route.label}
                        {route.badge && (
                          <span className="text-label px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            {route.badge}
                          </span>
                        )}
                      </span>
                    </Link>

                    {isCollapsed && isHovered && tooltipVisible && (
                      <motion.div 
                        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 border border-slate-700">
                          <Icon className="w-4 h-4" style={{ color: COLORS.accentTeal }} aria-hidden="true" />
                          <span 
                            className="text-sm font-medium flex items-center gap-2"
                          >
                            {route.label}
                            {route.badge && (
                              <span className="text-label px-1 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                {route.badge}
                              </span>
                            )}
                          </span>
                        </div>
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 rotate-45 bg-slate-900/95 dark:bg-slate-800/95 border-l border-b border-slate-700"
                        />
                      </motion.div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </nav>

      <div 
        className="shrink-0 border-t border-white/20 dark:border-white/10"
        style={{ 
          padding: isCollapsed ? '12px' : '16px',
        }}
      >
        {!isCollapsed && role && (
          <div className="mb-3 transition-all duration-300 animate-scaleIn">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-[#0F4C5C] to-[#115E59] dark:from-[#38BDF8] dark:to-[#2DD4BF]">
                <span className="text-white font-semibold text-xs uppercase">
                  {role.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-label text-slate-400 dark:text-slate-500">
                  Rol
                </p>
                <p className="text-sm font-semibold capitalize truncate" style={{ color: COLORS.accentTeal }}>
                  {getRoleLabel(role)}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
            transition-all duration-200 
            hover:bg-opacity-50 group
            ${isCollapsed ? 'justify-center' : 'justify-between'}
            bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400
          `}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {!isCollapsed && (
            <span className="text-sm font-medium">
              Colapsar
            </span>
          )}
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center
            transition-all duration-300
            ${isCollapsed ? '' : 'rotate-180'}
            bg-gradient-to-br from-[#0F4C5C] to-[#115E59] dark:from-[#38BDF8] dark:to-[#2DD4BF] text-white
          `}>
            <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
          </div>
        </button>
      </div>
    </motion.aside>
  )
}
