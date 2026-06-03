'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  dashboardRoutes, filterRoutesByRole, groupRoutesByGroup, isRouteActive,
  NAV_GROUP_LABELS, NAV_GROUP_ORDER, type RouteDefinition, type NavGroupId,
} from '@/lib/navigation'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { getRoleLabel } from '@/lib/rbac'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'

interface RouteWithActive extends RouteDefinition {
  active?: boolean
}

interface CollapsibleSidebarProps {
  role: string | null
  organizationName?: string | null
  isCollapsed: boolean
  onToggle: () => void
}

const STORAGE_KEY = 'sidebarExpandedGroups'

const DEFAULT_EXPANDED_GROUPS: Record<NavGroupId, boolean> = {
  main: true,
  staff: true,
  team: true,
  business: true,
  communications: true,
  system: false,
}

function loadExpandedGroups(): Record<NavGroupId, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_EXPANDED_GROUPS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_EXPANDED_GROUPS, ...parsed }
  } catch {
    return DEFAULT_EXPANDED_GROUPS
  }
}

export function CollapsibleSidebar({ role, organizationName, isCollapsed, onToggle }: CollapsibleSidebarProps) {
  const COLORS = useThemeColors()
  const pathname = usePathname()
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<NavGroupId, boolean>>(DEFAULT_EXPANDED_GROUPS)
  const [mounted, setMounted] = useState(false)

  const isEmpleado = role === 'empleado'

  const filteredRoutes = filterRoutesByRole(dashboardRoutes, role)

  const routesWithActive: RouteWithActive[] = filteredRoutes.map(route => ({
    ...route,
    active: isRouteActive(pathname, route),
  }))

  const groupedRoutes = groupRoutesByGroup(routesWithActive)

  const activeRoute = routesWithActive.find(r => r.active)

  useEffect(() => {
    setMounted(true)
    setExpandedGroups(loadExpandedGroups())
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expandedGroups))
  }, [expandedGroups, mounted])

  useEffect(() => {
    const group = activeRoute?.group
    if (group && expandedGroups[group] === false) {
      setExpandedGroups(prev => ({ ...prev, [group]: true }))
    }
  }, [activeRoute, expandedGroups])

  const toggleGroup = (groupId: NavGroupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

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
      className="hidden md:flex flex-col z-30 flex-shrink-0 border-r backdrop-blur-xl"
      style={{
        backgroundColor: COLORS.surfaceGlass,
        borderColor: COLORS.border,
        width: isCollapsed ? 72 : 260
      }}
      initial={{ width: isCollapsed ? 72 : 260 }}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className="relative flex items-center shrink-0 transition-all duration-300"
        style={{
          height: '72px',
          borderBottom: `1px solid ${COLORS.border}`,
          paddingLeft: isCollapsed ? '20px' : '24px',
          paddingRight: isCollapsed ? '20px' : '24px',
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
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ backgroundColor: COLORS.success, borderColor: COLORS.surface }}
            />
          </div>
          {isEmpleado && organizationName ? (
            <div
              className="flex flex-col overflow-hidden transition-all duration-300"
              style={{ opacity: isCollapsed ? 0 : 1 }}
            >
              <span
                className="text-xs font-medium truncate"
                style={{ color: COLORS.textMuted }}
              >
                Trabajando en
              </span>
              <span
                className="font-heading text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden truncate"
                style={{ color: COLORS.textPrimary }}
              >
                {organizationName}
              </span>
            </div>
          ) : (
            <span
              className="font-heading text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300"
              style={{
                color: COLORS.textPrimary,
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
          {NAV_GROUP_ORDER.map((groupId) => {
            const routes = groupedRoutes[groupId]
            if (!routes || routes.length === 0) return null

            const isExpanded = expandedGroups[groupId]

            if (isCollapsed) {
              return (
                <div key={groupId} className="space-y-1">
                  {routes.map((route) => {
                    const Icon = route.icon
                    const isActive = route.active ?? false
                    const isHovered = hoveredRoute === route.href

                    return (
                      <div key={route.href} className="relative">
                        <Link
                          href={route.href}
                          className={`
                            group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200 font-medium text-sm
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                            ${isActive ? '' : 'hover:opacity-80'}
                          `}
                          style={{
                            width: '100%',
                            paddingLeft: isActive ? '12px' : '16px',
                            paddingRight: isActive ? '12px' : '16px',
                            color: isActive ? COLORS.accentTeal : COLORS.textSecondary,
                            backgroundColor: isActive ? COLORS.primarySubtle : 'transparent',
                          }}
                          onMouseEnter={() => setHoveredRoute(route.href)}
                          onMouseLeave={() => setHoveredRoute(null)}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={route.label}
                        >
                          {isActive && (
                            <div
                              className="absolute inset-y-1 left-1 right-1 rounded-lg border"
                              style={{
                                backgroundColor: COLORS.primarySubtle,
                                borderColor: `${COLORS.accentTeal}25`
                              }}
                            />
                          )}

                          <Icon
                            className={`
                              w-5 h-5 flex-shrink-0 transition-all duration-200 relative z-10
                              ${isActive ? 'scale-110' : isHovered ? 'scale-105' : ''}
                            `}
                            style={{ color: isActive ? COLORS.accentTeal : undefined }}
                            aria-hidden="true"
                          />
                        </Link>

                        {isHovered && tooltipVisible && (
                          <motion.div
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div
                              className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm whitespace-nowrap border"
                              style={{
                                backgroundColor: COLORS.overlay,
                                color: COLORS.textPrimary,
                                borderColor: COLORS.border
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color: COLORS.accentTeal }} aria-hidden="true" />
                              <span className="text-sm font-medium">{route.label}</span>
                            </div>
                            <div
                              className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 rotate-45 border-l border-b"
                              style={{
                                backgroundColor: COLORS.overlay,
                                borderColor: COLORS.border
                              }}
                            />
                          </motion.div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }

            return (
              <div key={groupId} className="space-y-1">
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{ color: COLORS.textMuted }}
                  aria-expanded={isExpanded}
                >
                  <span className="text-sidebar-label font-semibold uppercase tracking-wider">
                    {NAV_GROUP_LABELS[groupId]}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform duration-200"
                    style={{
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1">
                        {routes.map((route) => {
                          const Icon = route.icon
                          const isActive = route.active ?? false
                          const isHovered = hoveredRoute === route.href

                          return (
                            <div key={route.href} className="relative">
                              <Link
                                href={route.href}
                                className={`
                                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                                  transition-all duration-200 font-medium text-sm
                                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                                  ${isActive ? '' : 'hover:opacity-80'}
                                `}
                                style={{
                                  width: '100%',
                                  paddingLeft: isActive ? '12px' : '16px',
                                  paddingRight: isActive ? '12px' : '16px',
                                  color: isActive ? COLORS.accentTeal : COLORS.textSecondary,
                                  backgroundColor: isActive ? COLORS.primarySubtle : 'transparent',
                                }}
                                onMouseEnter={() => setHoveredRoute(route.href)}
                                onMouseLeave={() => setHoveredRoute(null)}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={route.label}
                              >
                                {isActive && (
                                  <div
                                    className="absolute inset-y-1 left-1 right-1 rounded-lg border"
                                    style={{
                                      backgroundColor: COLORS.primarySubtle,
                                      borderColor: `${COLORS.accentTeal}25`
                                    }}
                                  />
                                )}

                                <Icon
                                  className={`
                                    w-5 h-5 flex-shrink-0 transition-all duration-200 relative z-10
                                    ${isActive ? 'scale-110' : isHovered ? 'scale-105' : ''}
                                  `}
                                  style={{ color: isActive ? COLORS.accentTeal : undefined }}
                                  aria-hidden="true"
                                />
                                <span
                                  className="whitespace-nowrap overflow-hidden transition-all duration-300 flex items-center gap-2 relative z-10"
                                  style={{
                                    color: isActive ? COLORS.accentTeal : undefined,
                                  }}
                                >
                                  {route.label}
                                </span>
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </nav>

      <div
        className="shrink-0"
        style={{
          padding: isCollapsed ? '12px' : '16px',
          borderTop: `1px solid ${COLORS.border}`
        }}
      >
        {!isCollapsed && role && (
          <div className="mb-3 transition-all duration-300 animate-scaleIn">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
              style={{
                backgroundColor: COLORS.surfaceSubtle,
                borderColor: COLORS.border
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: COLORS.primaryGradient }}
              >
                <span className="text-white font-semibold text-xs uppercase">
                  {role.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-label" style={{ color: COLORS.textMuted }}>
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
            hover:opacity-80 group
            ${isCollapsed ? 'justify-center' : 'justify-between'}
          `}
          style={{
            backgroundColor: COLORS.surfaceSubtle,
            color: COLORS.textMuted
          }}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {!isCollapsed && (
            <span className="text-sm font-medium">
              Colapsar
            </span>
          )}
          <div
            className={`
              w-7 h-7 rounded-lg flex items-center justify-center
              transition-all duration-300
              ${isCollapsed ? '' : 'rotate-180'}
            `}
            style={{ background: COLORS.primaryGradient, color: 'white' }}
          >
            <ChevronLeft className="w-4 h-4 transition-transform duration-200" />
          </div>
        </button>
      </div>
    </motion.aside>
  )
}