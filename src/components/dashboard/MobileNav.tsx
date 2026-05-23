'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, MoreHorizontal, LogOut, LayoutDashboard, CalendarDays, CheckCircle, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getRoleLabel } from '@/lib/rbac'
import { useThemeColors } from '@/hooks/useThemeColors'
import { dashboardRoutes, filterRoutesByRole, groupRoutesByGroup, type RouteDefinition } from '@/lib/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  role: string | null
  organizationName?: string | null
}

const PRIMARY_ROUTES = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/calendar', icon: CalendarDays, label: 'Agenda' },
  { href: '/confirmations', icon: CheckCircle, label: 'Confirmar' },
  { href: '/notificaciones', icon: Bell, label: 'Alertas' },
]

export function MobileNav({ isOpen, onClose, role, organizationName }: MobileNavProps) {
  const COLORS = useThemeColors()
  const pathname = usePathname()
  const supabase = createClient()
  const [secondarySheetOpen, setSecondarySheetOpen] = useState(false)

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

  // Close primary nav when opening secondary
  useEffect(() => {
    if (secondarySheetOpen) {
      onClose()
    }
  }, [secondarySheetOpen, onClose])

  return (
    <>
      {/* Bottom Navigation */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-white/20 dark:border-white/10 safe-area-bottom"
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
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-[#0F4C5C] dark:text-[#38BDF8] bg-[#0F4C5C]/5 dark:bg-[#38BDF8]/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
          
          <button
            onClick={handleMoreClick}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </motion.nav>

      {/* Secondary Sheet */}
      <AnimatePresence>
        {secondarySheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSecondarySheetOpen(false)}
            />
            
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 rounded-t-3xl border-t border-white/20 dark:border-white/10 max-h-[85vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Handle */}
              <div className="flex items-center justify-center py-4 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {organizationName || 'Prügressy'}
                  </p>
                  {role && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {getRoleLabel(role)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSecondarySheetOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              
              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
                {Object.entries(groupedRoutes).map(([group, routes]) => (
                  <div key={group} className="space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider px-3 py-2 text-slate-400 dark:text-slate-500">
                      {group}
                    </div>
                    {routes.map((route) => {
                      const Icon = route.icon
                      const isActive = route.active
                      
                      return (
                        <Link
                          key={route.href}
                          href={route.href}
                          onClick={() => setSecondarySheetOpen(false)}
                          className={`
                            group flex items-center gap-3 px-3 py-3 rounded-xl min-h-[48px]
                            transition-all duration-200 font-medium text-sm
                            ${isActive 
                              ? 'bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 text-[#0F4C5C] dark:text-[#38BDF8]' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                          <span className="flex items-center gap-2 flex-1">
                            {route.label}
                            {route.badge && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                {route.badge}
                              </span>
                            )}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>
              
              {/* Footer */}
              <div className="p-4 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
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
