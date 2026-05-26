'use client'

import Link from 'next/link'
import { useThemeColors } from '@/hooks/useThemeColors'
import { WalletCards, ArrowRight } from 'lucide-react'

export function MiPayrollLink() {
  const colors = useThemeColors()

  return (
    <Link
      href="/payroll/mi"
      className="block rounded-2xl p-5 transition-all hover:opacity-90"
      style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <WalletCards className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Mi Nómina</h3>
            <p className="text-xs text-white/80">Ver mis ingresos, comisiones y recibos</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-white/60" />
      </div>
    </Link>
  )
}
