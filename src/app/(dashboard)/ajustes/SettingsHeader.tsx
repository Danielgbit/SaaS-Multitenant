'use client'

import { Settings } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

export function SettingsHeader() {
  const COLORS = useThemeColors()

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8" style={{ background: COLORS.primaryGradient }}>
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Administración</p>
            <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Configuración</h1>
          </div>
        </div>
        <p className="text-sm text-white/80">Administra la configuración de tu negocio</p>
      </div>
    </div>
  )
}
