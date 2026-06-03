'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Settings, LogOut, Plus, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { NotificationCenter } from './NotificationCenter'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'
import { PageBreadcrumb } from './PageBreadcrumb'
import { UserAvatar } from './UserAvatar'
import { getRoleLabel } from '@/lib/rbac'

interface HeaderProps {
  organizationConnected: boolean
  organizationName?: string | null
  role?: string | null
  userId?: string | null
  userEmail?: string | null
  onConfirmationsToggle?: () => void
}

export function Header ({ 
  organizationConnected, 
  organizationName, 
  role, 
  userId, 
  userEmail,
  onConfirmationsToggle 
}: HeaderProps) {
  const COLORS = useThemeColors()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
    setProfileDropdownOpen(false)
  }

  const handleNewAppointment = () => {
    router.push('/calendar')
  }

  return (
    <header 
      className="sticky top-4 z-20 mx-4 md:mx-6 lg:mx-8 rounded-2xl border transition-all duration-200"
      style={{ 
        borderColor: COLORS.border,
        backgroundColor: scrolled ? COLORS.surfaceGlass : COLORS.glass,
        boxShadow: scrolled ? COLORS.shadow.lg : COLORS.shadow.md,
      }}
    >
      <div className="h-14 px-4 md:px-6 lg:px-8 flex items-center justify-between">
        
        <div className="flex items-center gap-2 min-w-0 md:min-w-[200px]">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 group"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-shadow group-hover:shadow-md"
              style={{ background: COLORS.primaryGradient }}
            >
              P
            </div>
            {organizationName && role !== 'empleado' && (
              <>
                <span className="hidden xl:block" style={{ color: COLORS.textMuted }}>·</span>
                <div className="hidden lg:flex items-center gap-1.5">
                  <span 
                    className="text-sm font-medium max-w-[100px] truncate"
                    style={{ color: COLORS.primary }}
                  >
                    {organizationName}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ 
                      backgroundColor: organizationConnected ? COLORS.success : COLORS.warning,
                      boxShadow: `0 0 0 2px ${organizationConnected ? COLORS.success + '33' : COLORS.warning + '33'}`
                    }}
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <PageBreadcrumb />
        </div>

        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          {role !== 'empleado' && (
            <button
              onClick={handleNewAppointment}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2"
              style={{ 
                background: COLORS.primaryGradient,
                boxShadow: `0 2px 8px ${COLORS.primary}25`
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo turno</span>
            </button>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 hover:opacity-80"
            style={{ color: COLORS.textMuted }}
            aria-label={theme ? (theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro') : 'Cambiar modo'}
            suppressHydrationWarning
          >
            {theme ? (
              theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div className="hidden md:block">
            <NotificationCenter
              userId={userId || ''}
              role={role ?? null}
              onOpenConfirmationsPanel={onConfirmationsToggle}
            />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 md:gap-2 p-1 pr-1.5 md:pr-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                backgroundColor: profileDropdownOpen || pathname.startsWith('/settings') ? COLORS.primarySubtle : 'transparent'
              }}
              onMouseEnter={e => { if (!profileDropdownOpen) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              onMouseLeave={e => { if (!profileDropdownOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
              aria-label="Perfil"
              aria-expanded={profileDropdownOpen}
            >
              <UserAvatar name={userEmail} email={userEmail} />
              <ChevronDown 
                className="w-3.5 h-3.5 transition-transform duration-200" 
                style={{ color: COLORS.textMuted }}
              />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-56 rounded-2xl py-1 z-50"
                  style={{ 
                    backgroundColor: COLORS.surfaceGlassStrong,
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: COLORS.shadow.xl
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {role && (
                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                        {role ? getRoleLabel(role) : 'Rol'}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                        {organizationName || 'Organización'}
                      </p>
                      {userEmail && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>
                          {userEmail}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                    style={{ color: COLORS.textSecondary }}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Configuración
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: COLORS.danger }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.dangerLight }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}