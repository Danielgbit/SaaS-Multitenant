'use client'

import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useThemeColors } from '@/hooks/useThemeColors'
import { dashboardRoutes, filterRoutesByRole } from '@/lib/navigation'
import { Calendar, CheckCircle2, DollarSign, UserPlus, Sun, Moon, Users, Settings, LayoutDashboard } from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: string | null
}

export function CommandPalette({ open, onOpenChange, role }: CommandPaletteProps) {
  const router = useRouter()
  const COLORS = useThemeColors()

  const navigate = useCallback((href: string) => {
    router.push(href)
    onOpenChange(false)
  }, [router, onOpenChange])

  const routes = role ? filterRoutesByRole(dashboardRoutes, role) : dashboardRoutes

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Paleta de comandos"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <Command.Input
          placeholder="Buscar o ejecutar acción..."
          className="w-full px-5 py-4 text-base outline-none border-b placeholder-slate-400 dark:placeholder-slate-500"
          style={{
            backgroundColor: 'transparent',
            color: COLORS.textPrimary,
            borderColor: COLORS.border,
          }}
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm" style={{ color: COLORS.textMuted }}>
            No se encontraron resultados
          </Command.Empty>

          <Command.Group heading="Navegación" className="text-xs font-semibold px-2 py-1.5" style={{ color: COLORS.textMuted }}>
            {routes.map((route) => (
              <Command.Item
                key={route.href}
                onSelect={() => navigate(route.href)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-700"
                style={{ color: COLORS.textPrimary }}
              >
                {route.icon && <route.icon className="w-4 h-4" style={{ color: COLORS.textMuted }} />}
                {route.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Acciones rápidas" className="text-xs font-semibold px-2 py-1.5" style={{ color: COLORS.textMuted }}>
            <Command.Item
              onSelect={() => navigate('/calendar?new=true')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-700"
              style={{ color: COLORS.textPrimary }}
            >
              <Calendar className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              Nueva cita
            </Command.Item>
            <Command.Item
              onSelect={() => navigate('/clients?new=true')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-700"
              style={{ color: COLORS.textPrimary }}
            >
              <UserPlus className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              Nuevo cliente
            </Command.Item>
            <Command.Item
              onSelect={() => navigate('/confirmations/walkin')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-700"
              style={{ color: COLORS.textPrimary }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              Confirmación sin cita
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div
          className="flex items-center gap-3 px-5 py-2.5 border-t text-xs"
          style={{
            borderColor: COLORS.border,
            color: COLORS.textMuted,
            backgroundColor: COLORS.surface,
          }}
        >
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: COLORS.border }}>↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: COLORS.border }}>↵</kbd>
            seleccionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: COLORS.border }}>esc</kbd>
            cerrar
          </span>
        </div>
      </div>
    </Command.Dialog>
  )
}
