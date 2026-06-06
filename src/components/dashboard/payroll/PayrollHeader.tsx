'use client'

import Link from 'next/link'
import { Wallet, Settings } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

interface PayrollHeaderProps {
  payrollTypeLabel: string
}

export function PayrollHeader({ payrollTypeLabel }: PayrollHeaderProps) {
  const COLORS = useThemeColors()

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 md:p-8" style={{ background: COLORS.primaryGradient }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Gestión de Personal</p>
            <h1 className="text-3xl font-bold text-white font-heading">Nómina</h1>
            <p className="text-sm mt-1 text-white/80">{payrollTypeLabel}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/nomina/configuracion" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <Settings className="w-4 h-4" />
            Configurar
          </Link>
        </div>
      </div>
    </div>
  )
}
