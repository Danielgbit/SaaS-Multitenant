'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, MoreHorizontal, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getRoleLabel } from '@/lib/rbac'
import { useThemeColors } from '@/hooks/useThemeColors'
import { dashboardRoutes, filterRoutesByRole, groupRoutesByGroup, isRouteActive, NAV_GROUP_LABELS, NAV_GROUP_ORDER, type RouteDefinition, type NavGroupId } from '@/lib/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface RouteWithActive extends RouteDefinition {
  active?: boolean
}

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  role: string | null
  organizationName?: string | null
}

const PRIMARY_ROUTE_KEYS = ['/dashboard', '/calendar', '/confirmations', '/notificaciones']

const PRIMARY_ROUTES = PRIMARY_ROUTE_KEYS.map(href => {
  const route = dashboardRoutes.find(r => r.href === href)
  if (!route) {
    throw new Error(`PRIMARY_ROUTE: missing route for href=${href}`)
  }
  return { href, label: route.label, icon: route.icon }
})

export function MobileNav({ isOpen, onClose, role, organizationName }: MobileNavProps) {
  const COLORS = useThemeColors()
  const pathname = usePathname()
  const supabase = createClient()
  const [secondarySheetOpen, setSecondarySheetOpen] = useState(false)

  const filteredRoutes = filterRoutesByRole(dashboardRoutes, role)
  const routesWithActive: RouteWithActive[] = filteredRoutes.map(route => ({
    ...route,
    active: isRouteActive(pathname, route),
  }))
  const groupedRoutes = groupRoutesByGroup(routesWithActive)

  useEffect(() => {
    if (isOpen || secondarySheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, secondarySheetOpen])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleMoreClick = () => {
    setSecondarySheetOpen(true)
    onClose()
  }

  useEffect(() => {
    if (secondarySheetOpen) {
      onClose()
    }
  }, [secondarySheetOpen, onClose])

  return (
    <>
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl border-t safe-area-bottom"
        style={{ 
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-around py-2 px-2">
          {PRIMARY_ROUTES.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href === '/dashboard' && pathname === '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? ''
                    : 'hover:opacity-80'
                  }
                `}
                style={{
                  color: isActive ? COLORS.primary : COLORS.textMuted,
                  backgroundColor: isActive ? COLORS.primarySubtle : 'transparent',
                }}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-caption font-medium">{label}</span>
              </Link>
            )
          })}
          
          <button
            onClick={handleMoreClick}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl hover:opacity-80 transition-all duration-200"
            style={{ color: COLORS.textMuted }}
            aria-label="Más opciones"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-caption font-medium">Más</span>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {secondarySheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 backdrop-blur-sm md:hidden"
              style={{ backgroundColor: COLORS.overlay }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSecondarySheetOpen(false)}
            />
            
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl border-t max-h-[85dvh] overflow-hidden"
              style={{ 
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-center py-4" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: COLORS.border }} />
              </div>
              
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                    {organizationName || 'Prügressy'}
                  </p>
                  {role && (
                    <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                      {getRoleLabel(role)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSecondarySheetOpen(false)}
                  className="p-2.5 rounded-xl hover:opacity-80 transition-colors"
                  style={{ color: COLORS.textMuted }}
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-4" style={{ maxHeight: 'calc(85dvh - 180px)' }}>
                {NAV_GROUP_ORDER.map((groupId) => {
                  const routes = groupedRoutes[groupId]
                  if (!routes || routes.length === 0) return null

                  return (
                    <div key={groupId} className="space-y-1">
                      <div
                        className="text-sidebar-label font-semibold px-3 py-2"
                        style={{ color: COLORS.textMuted }}
                      >
                        {NAV_GROUP_LABELS[groupId]}
                      </div>
                      {routes.map((route: RouteWithActive) => {
                        const Icon = route.icon
                        const isActive = route.active ?? false

                        return (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setSecondarySheetOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={route.label}
                            className={`
                              group flex items-center gap-3 px-3 py-3 rounded-xl min-h-[48px]
                              transition-all duration-200 font-medium text-sm
                              ${isActive
                                ? ''
                                : 'hover:opacity-80'
                              }
                            `}
                            style={{
                              color: isActive ? COLORS.primary : COLORS.textSecondary,
                              backgroundColor: isActive ? COLORS.primarySubtle : 'transparent',
                            }}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                            <span className="flex items-center gap-2 flex-1">
                              {route.label}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })}
              </nav>
              
              <div className="p-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:opacity-80 transition-colors font-medium"
                  style={{ color: COLORS.danger }}
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}