'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Settings, LogOut, Building2, Bell } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface HeaderProps {
  organizationConnected: boolean
  organizationName?: string | null
  role?: string | null
  userId?: string | null
  onMenuToggle?: () => void
  showHamburger?: boolean
  onConfirmationsToggle?: () => void
  queueCount?: number
}

function getUrgencyLevel(pendingCount: number, oldestNotificationAt: number | null): {
  color: string
  bgColor: string
  animate: boolean
} {
  if (pendingCount === 0) {
    return { color: '#EF4444', bgColor: '#EF4444', animate: false }
  }

  if (!oldestNotificationAt) {
    return { color: '#EF4444', bgColor: '#EF4444', animate: false }
  }

  const now = new Date().getTime()
  const diffMin = Math.floor((now - oldestNotificationAt) / 60000)

  // Thresholds adjusted for notification age (created_at)
  // These represent how long since the notification was created
  // Remember: notifications for unmarked_alert are created when appointment is ~60 min overdue
  // So 5 min old notification = appointment actually ~65 min overdue
  if (diffMin < 5) {
    return { color: '#22C55E', bgColor: '#22C55E', animate: false }
  } else if (diffMin < 15) {
    return { color: '#EAB308', bgColor: '#EAB308', animate: false }
  } else if (diffMin < 25) {
    return { color: '#F97316', bgColor: '#F97316', animate: false }
  } else {
    return { color: '#EF4444', bgColor: '#EF4444', animate: true }
  }
}

export function Header({ organizationConnected, organizationName, role, userId, onMenuToggle, showHamburger, onConfirmationsToggle, queueCount = 0 }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [oldestPendingAt, setOldestPendingAt] = useState<number | null>(null)
  const [reminderCount, setReminderCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!organizationConnected || !organizationName) return

    if (role === 'empleado' && userId) {
      const fetchReminderCount = async () => {
        try {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)

          const { count } = await (supabase as any)
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'reminder')
            .eq('read', false)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())

          setReminderCount(count || 0)
        } catch (error) {
          console.error('[Header] Error fetching reminder count:', error)
        }
      }

      fetchReminderCount()
      const interval = setInterval(fetchReminderCount, 60000)
      return () => clearInterval(interval)
    }

    if (role === 'empleado' || !organizationName) return

    const fetchPendingInfo = async () => {
      try {
        const { data: orgMember } = await (supabase as any)
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single()

        if (!orgMember) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data: oldestNotification } = await (supabase as any)
          .from('notifications')
          .select('created_at')
          .eq('organization_id', orgMember.organization_id)
          .in('type', ['unmarked_alert', 'auto_completed'])
          .eq('read', false)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: true })
          .limit(1)
          .single()

        if (oldestNotification?.created_at) {
          setOldestPendingAt(new Date(oldestNotification.created_at).getTime())
        } else {
          setOldestPendingAt(null)
        }

        const { count } = await (supabase as any)
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgMember.organization_id)
          .in('type', ['unmarked_alert', 'auto_completed'])
          .eq('read', false)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())

        setPendingCount(count || 0)
      } catch (error) {
        console.error('[Header] Error fetching pending count:', error)
      }
    }

    fetchPendingInfo()
    const interval = setInterval(fetchPendingInfo, 30000)
    return () => clearInterval(interval)
  }, [organizationConnected, role, organizationName, userId])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const urgency = getUrgencyLevel(pendingCount, oldestPendingAt)

  return (
    <header className="h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 transition-colors duration-200">
      {/* Left: Status + Organization Badge (only for admin/owner/staff, not empleado) */}
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

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile Menu Toggle */}
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

        {/* Theme Toggle */}
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

        {/* Confirmations Bell */}
        {role === 'empleado' && reminderCount > 0 && (
          <Link
            href="/calendar"
            className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] dark:focus-visible:ring-[#38BDF8]"
            aria-label="Recordatorios"
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
            >
              {reminderCount > 9 ? '9+' : reminderCount}
            </span>
          </Link>
        )}

        {role !== 'empleado' && onConfirmationsToggle && (
          <button
            onClick={onConfirmationsToggle}
            className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] dark:focus-visible:ring-[#38BDF8]"
            aria-label="Confirmaciones"
          >
            <Bell className="w-5 h-5" />
            {(queueCount > 0 || pendingCount > 0) && (
              <span
                className={`
                  absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center
                  ${queueCount > 0 ? 'animate-pulse bg-emerald-500' : (urgency.animate ? 'animate-pulse' : '')}
                `}
                style={queueCount > 0 ? {} : { backgroundColor: urgency.bgColor }}
              >
                {queueCount > 0 ? (queueCount > 9 ? '9+' : queueCount) : (pendingCount > 9 ? '9+' : pendingCount)}
              </span>
            )}
          </button>
        )}

        {/* Settings */}
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

        {/* User Menu / Logout */}
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
