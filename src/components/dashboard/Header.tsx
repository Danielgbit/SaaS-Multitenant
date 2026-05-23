'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Settings, LogOut, Building2, ChevronDown, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { NotificationCenter } from './NotificationCenter'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeColors } from '@/hooks/useThemeColors'

interface HeaderProps {
  organizationConnected: boolean
  organizationName?: string | null
  role?: string | null
  userId?: string | null
  onConfirmationsToggle?: () => void
}

export function Header({ organizationConnected, organizationName, role, userId, onConfirmationsToggle }: HeaderProps) {
  const COLORS = useThemeColors()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
    setProfileDropdownOpen(false)
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-20 bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {organizationName && role !== 'empleado' && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10">
            <Building2 className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
            <span className="text-sm font-semibold text-[#0F4C5C] dark:text-[#38BDF8] hidden sm:block">
              {organizationName}
            </span>
          </div>
        )}
        <div
          className={`w-2 h-2 rounded-full ${organizationConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
          aria-hidden="true"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] dark:focus-visible:ring-[#38BDF8]"
          aria-label={mounted ? (theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro') : 'Cambiar modo'}
          suppressHydrationWarning
        >
          {mounted ? (
            theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <NotificationCenter
          userId={userId || ''}
          role={role ?? null}
          onOpenConfirmationsPanel={onConfirmationsToggle}
        />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] dark:focus-visible:ring-[#38BDF8] ${
              profileDropdownOpen || pathname.startsWith('/settings')
                ? 'bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label="Perfil"
            aria-expanded={profileDropdownOpen}
          >
            <User className="w-5 h-5" />
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-56 rounded-xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg py-1 z-50"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {role && (
                  <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {role === 'admin' ? 'Administrador' : role === 'staff' ? 'Asistente' : role === 'empleado' ? 'Empleado' : 'Owner'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {organizationName || 'Organización'}
                    </p>
                  </div>
                )}
                
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
