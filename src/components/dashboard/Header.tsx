'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Settings, LogOut, Building2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { NotificationCenter } from './NotificationCenter'

interface HeaderProps {
  organizationConnected: boolean
  organizationName?: string | null
  role?: string | null
  userId?: string | null
  onMenuToggle?: () => void
  showHamburger?: boolean
  onConfirmationsToggle?: () => void
}

export function Header({ organizationConnected, organizationName, role, userId, onMenuToggle, showHamburger, onConfirmationsToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 transition-colors duration-200">
      <div className="flex items-center gap-4">
        {organizationName && role !== 'empleado' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10">
            <Building2 className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
            <span className="text-sm font-semibold text-[#0F4C5C] dark:text-[#38BDF8] hidden sm:block">
              {organizationName}
            </span>
          </div>
        )}
        <div
          className={`w-2.5 h-2.5 rounded-full ${organizationConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`}
          aria-hidden="true"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide hidden lg:block">
          {organizationConnected ? 'Sistemas Operativos conectados' : 'Requiere configuración'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {showHamburger && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 md:hidden"
            aria-label="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

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
          role={role}
          onOpenConfirmationsPanel={onConfirmationsToggle}
        />

        <Link
          href="/settings"
          className={`p-2.5 rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] dark:focus-visible:ring-[#38BDF8] ${
            pathname.startsWith('/settings')
              ? 'bg-[#0F4C5C]/10 text-[#0F4C5C] dark:bg-[#38BDF8]/10 dark:text-[#38BDF8]'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="Configuración"
        >
          <Settings className="w-5 h-5" />
        </Link>

        <button
          onClick={handleSignOut}
          className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}