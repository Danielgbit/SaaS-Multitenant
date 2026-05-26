'use client'

import { useThemeColors } from '@/hooks/useThemeColors'
import { Scissors } from 'lucide-react'

interface Props {
  services: Record<string, any>[]
}

export function MiServicesCard({ services }: Props) {
  const colors = useThemeColors()

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.primarySubtle, color: colors.primary }}>
          <Scissors className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Mis Servicios</h3>
      </div>

      {services.length === 0 ? (
        <p className="text-sm" style={{ color: colors.textMuted }}>
          No tienes servicios asignados. Habla con el administrador.
        </p>
      ) : (
        <div className="space-y-2">
          {services.map((svc: any, idx: number) => (
            <div
              key={svc.id || idx}
              className="flex items-center justify-between p-2.5 rounded-xl"
              style={{ background: colors.surfaceSubtle }}
            >
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                {svc.name}
              </span>
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                {svc.duration}min · ${Number(svc.price).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
