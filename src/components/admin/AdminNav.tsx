'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TicketIcon,
  BuildingOfficeIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/client'

interface AdminNavProps {
  userEmail?: string | null
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    {
      href: '/admin',
      label: 'Overview',
      icon: HomeIcon,
      exact: true,
    },
    {
      href: '/admin/promo-codes',
      label: 'Códigos',
      icon: TicketIcon,
      exact: false,
    },
    {
      href: '/admin/organizations',
      label: 'Organizaciones',
      icon: BuildingOfficeIcon,
      exact: false,
    },
  ]

  function isActive(href: string, exact: boolean) {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="text-xl font-semibold text-[#0F172A] dark:text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Prügressy Admin
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${
                        active
                          ? 'bg-[#0F4C5C] text-white'
                          : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E6F1F4] dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#475569] hidden sm:block">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#475569] hover:text-[#0F172A] hover:bg-[#E6F1F4] dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      <nav className="md:hidden border-t border-[#E2E8F0] dark:border-slate-700 px-4 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                ${
                  active
                    ? 'bg-[#0F4C5C] text-white'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#E6F1F4]'
                }
              `}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}