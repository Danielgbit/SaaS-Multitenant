'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { 
  X, 
  Menu, 
  CalendarDays, 
  Users, 
  Scissors, 
  LayoutDashboard, 
  UserCircle, 
  CreditCard, 
  MessageSquare, 
  Mail, 
  Package, 
  CheckCircle, 
  Settings,
  LogOut,
  Receipt,
  Wallet
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.5)',
    isDark,
  }
}

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  role: string | null
}

export function MobileNav({ isOpen, onClose, role }: MobileNavProps) {
  const COLORS = useColors()
  const pathname = usePathname()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const supabase = createClient()

  const isStaff = role === 'staff'

  const allRoutes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/',
      group: 'Operaciones',
    },
    {
      href: '/calendar',
      label: 'Agenda',
      icon: CalendarDays,
      active: pathname.startsWith('/calendar'),
      group: 'Operaciones',
    },
    {
      href: '/confirmations',
      label: 'Confirmaciones',
      icon: CheckCircle,
      active: pathname.startsWith('/confirmations'),
      group: 'Operaciones',
    },
    {
      href: '/employees',
      label: 'Equipo',
      icon: Users,
      active: pathname.startsWith('/employees'),
      group: 'Gestión',
      hideForStaff: true,
    },
    {
      href: '/payroll',
      label: 'Nómina',
      icon: Receipt,
      active: pathname.startsWith('/payroll'),
      group: 'Gestión',
      hideForStaff: true,
    },
    {
      href: '/clients',
      label: 'Clientes',
      icon: UserCircle,
      active: pathname.startsWith('/clients'),
      group: 'Gestión',
    },
    {
      href: '/clients/accounts',
      label: 'Cuentas por Cobrar',
      icon: Wallet,
      active: pathname.startsWith('/clients/accounts'),
      group: 'Gestión',
    },
    {
      href: '/services',
      label: 'Servicios',
      icon: Scissors,
      active: pathname.startsWith('/services'),
      group: 'Gestión',
    },
    {
      href: '/inventory',
      label: 'Inventario',
      icon: Package,
      active: pathname.startsWith('/inventory'),
      group: 'Gestión',
      hideForStaff: true,
    },
    {
      href: '/whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      active: pathname.startsWith('/whatsapp'),
      group: 'Integraciones',
      hideForStaff: true,
    },
    {
      href: '/email',
      label: 'Email',
      icon: Mail,
      active: pathname.startsWith('/email'),
      group: 'Integraciones',
      hideForStaff: true,
    },
    {
      href: '/billing',
      label: 'Facturación',
      icon: CreditCard,
      active: pathname.startsWith('/billing'),
      group: 'Sistema',
      hideForStaff: true,
    },
    {
      href: '/settings',
      label: 'Ajustes',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      group: 'Sistema',
      hideForStaff: true,
    },
  ]

  const filteredRoutes = allRoutes.filter(route => {
    if (isStaff && route.hideForStaff) {
      return false
    }
    return true
  })

  const groupedRoutes = filteredRoutes.reduce((acc, route) => {
    if (!acc[route.group]) {
      acc[route.group] = []
    }
    acc[route.group].push(route)
    return acc
  }, {} as Record<string, typeof filteredRoutes>)

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-200 ease-out"
        style={{ backgroundColor: COLORS.overlay }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="absolute inset-y-0 left-0 w-72 max-w-[85vw] transform transition-transform duration-300 ease-out"
        style={{ 
          backgroundColor: COLORS.surface,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Decorative circle */}
        <div 
          className="absolute -right-12 top-0 w-32 h-32 rounded-full opacity-10"
          style={{ 
            background: COLORS.primaryGradient,
            transform: 'translate(50%, -50%)' 
          }}
        />

        {/* Header */}
        <div 
          className="h-20 flex items-center justify-between px-6 border-b shrink-0"
          style={{ borderColor: COLORS.border }}
        >
          <Link 
            href="/calendar" 
            className="flex items-center gap-3 group"
            onClick={onClose}
          >
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: COLORS.primaryGradient }}
            >
              <span className="text-white font-serif font-bold text-lg leading-none">P</span>
            </div>
            <span 
              className="text-xl font-bold tracking-tight"
              style={{ color: COLORS.textPrimary, fontFamily: "'Cormorant Garamond', serif" }}
            >
              Prügressy
            </span>
          </Link>
          
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2.5 rounded-xl transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: COLORS.textSecondary }}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav 
          className="flex-1 py-4 px-3 space-y-4 overflow-y-auto"
          aria-label="Navegación principal"
        >
          {Object.entries(groupedRoutes).map(([group, routes]) => (
            <div key={group} className="space-y-1">
              <div 
                className="text-[10px] font-semibold uppercase tracking-wider px-4 py-2"
                style={{ color: COLORS.textMuted }}
              >
                {group}
              </div>
              {routes.map((route: typeof filteredRoutes[0]) => {
                const Icon = route.icon
                const isActive = route.active
                
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px]
                      transition-all duration-200 font-medium text-sm
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                      ${isActive 
                        ? 'text-white shadow-lg' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                    style={{ 
                      background: isActive ? COLORS.primaryGradient : 'transparent',
                      color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon 
                      className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                      aria-hidden="true" 
                    />
                    {route.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div 
          className="p-4 border-t space-y-3 shrink-0"
          style={{ borderColor: COLORS.border }}
        >
          {role && (
            <div 
              className="px-4 py-3 rounded-xl flex items-center justify-between"
              style={{ 
                backgroundColor: COLORS.surfaceSubtle,
                border: `1px solid ${COLORS.border}` 
              }}
            >
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: COLORS.textMuted }}
              >
                Perfil
              </span>
              <span 
                className="text-sm font-semibold capitalize"
                style={{ color: COLORS.primary }}
              >
                {role}
              </span>
            </div>
          )}
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            style={{ color: '#DC2626', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

interface HamburgerButtonProps {
  onClick: () => void
}

export function HamburgerButton({ onClick }: HamburgerButtonProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return (
    <button
      onClick={onClick}
      className="p-2.5 rounded-xl transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
      style={{ color: isDark ? '#94A3B8' : '#475569' }}
      aria-label="Abrir menú"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
