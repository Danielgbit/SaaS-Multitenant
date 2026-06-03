'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Settings, LogOut, ChevronDown, User, Keyboard, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { NotificationCenter } from './NotificationCenter'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'
import { UserAvatar } from './UserAvatar'
import { SearchInput } from './SearchInput'
import { QuickActionsDropdown } from './QuickActionsDropdown'
import { getRoleLabel } from '@/lib/rbac'
import type { UserRole } from '@/types/user'

interface HeaderUser {
  id: string
  email: string
  role: UserRole
}

interface HeaderOrganization {
  name: string
  connected: boolean
}

interface HeaderProps {
  user: HeaderUser
  organization: HeaderOrganization
  onConfirmationsToggle?: () => void
  onCommandPaletteOpen?: () => void
}

export function Header({
  user,
  organization,
  onConfirmationsToggle,
  onCommandPaletteOpen,
}: HeaderProps) {
  const COLORS = useThemeColors()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
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

  const profileHref = user.role === 'empleado' ? '/mi' : '/settings'

  return (
    <header
      className="sticky top-0 z-40 border-b transition-all duration-200"
      style={{
        borderColor: COLORS.border,
        backgroundColor: scrolled ? COLORS.surfaceGlass : COLORS.surface,
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}
      data-testid="header"
    >
      <div className="h-14 px-4 md:px-6 lg:px-8 flex items-center gap-3 md:gap-4">

        {/* Left: Logo + Organization */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group"
            data-testid="logo-link"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-shadow group-hover:shadow-md flex-shrink-0"
              style={{ background: COLORS.primaryGradient }}
            >
              P
            </div>
            {organization.name && user.role !== 'empleado' && (
              <>
                <span className="hidden xl:block" style={{ color: COLORS.textMuted }}>·</span>
                <div className="hidden lg:flex items-center gap-1.5 min-w-0">
                  <span
                    className="text-sm font-medium max-w-[120px] xl:max-w-[160px] truncate"
                    style={{ color: COLORS.primary }}
                  >
                    {organization.name}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: organization.connected ? COLORS.success : COLORS.warning,
                      boxShadow: `0 0 0 2px ${organization.connected ? COLORS.success + '33' : COLORS.warning + '33'}`,
                    }}
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
          </Link>
        </div>

        {/* Center: Search Input */}
        <div className="flex-1 flex items-center justify-center max-w-xl mx-auto">
          <SearchInput onOpen={() => onCommandPaletteOpen?.()} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
          {user.role !== 'empleado' && (
            <div className="hidden sm:block">
              <QuickActionsDropdown role={user.role} />
            </div>
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
              userId={user.id}
              role={user.role}
              onOpenConfirmationsPanel={onConfirmationsToggle}
            />
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 md:gap-2 p-1 pr-1.5 md:pr-2 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                backgroundColor: profileDropdownOpen || pathname.startsWith('/settings') ? COLORS.primarySubtle : 'transparent',
              }}
              onMouseEnter={e => { if (!profileDropdownOpen) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              onMouseLeave={e => { if (!profileDropdownOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
              aria-label="Perfil"
              aria-expanded={profileDropdownOpen}
              data-testid="profile-menu"
            >
              <UserAvatar name={user.email} email={user.email} />
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-200"
                style={{ color: COLORS.textMuted }}
              />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-64 rounded-2xl py-1 z-50"
                  style={{
                    backgroundColor: COLORS.surfaceGlassStrong,
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: COLORS.shadow.xl,
                  }}
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                      {getRoleLabel(user.role)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                      {organization.name || 'Organización'}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: COLORS.textMuted }}>
                      {user.email}
                    </p>
                  </div>

                  {/* Profile & Settings */}
                  <Link
                    href={profileHref}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                    style={{ color: COLORS.textSecondary }}
                    onClick={() => setProfileDropdownOpen(false)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <User className="w-4 h-4" />
                    Mi perfil
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                    style={{ color: COLORS.textSecondary }}
                    onClick={() => setProfileDropdownOpen(false)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Settings className="w-4 h-4" />
                    Configuración
                  </Link>

                  {/* Help & Shortcuts */}
                  <div className="my-1" style={{ borderTop: `1px solid ${COLORS.border}` }} />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false)
                      onCommandPaletteOpen?.()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                    style={{ color: COLORS.textSecondary }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Keyboard className="w-4 h-4" />
                    Atajos de teclado
                  </button>

                  <a
                    href="https://soporte.prugressy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                    style={{ color: COLORS.textSecondary }}
                    onClick={() => setProfileDropdownOpen(false)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Centro de ayuda
                  </a>

                  {/* Theme toggle */}
                  <div className="my-1" style={{ borderTop: `1px solid ${COLORS.border}` }} />

                  <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.textSecondary }}>
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span>Tema</span>
                    </div>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: COLORS.surfaceHover,
                        color: COLORS.textSecondary,
                      }}
                      suppressHydrationWarning
                    >
                      {theme === 'dark' ? 'Claro' : 'Oscuro'}
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="my-1" style={{ borderTop: `1px solid ${COLORS.border}` }} />

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
