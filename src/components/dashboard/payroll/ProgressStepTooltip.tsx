'use client'

import { HelpCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { useThemeColors } from '@/hooks/useThemeColors'

interface ProgressStepTooltipProps {
  whenUsed: string
  restrictions: string
}

export function ProgressStepTooltip({ whenUsed, restrictions }: ProgressStepTooltipProps) {
  const colors = useThemeColors()

  return (
    <div className="relative inline-flex">
      <Tooltip
        content={
          <div className="space-y-1.5">
            <div>
              <span className="text-sidebar-label font-semibold opacity-70">Cuándo</span>
              <p className="text-xs leading-relaxed">{whenUsed}</p>
            </div>
            <div className="pt-1 border-t border-white/10">
              <span className="text-sidebar-label font-semibold opacity-70">Restricciones</span>
              <p className="text-xs leading-relaxed">{restrictions}</p>
            </div>
          </div>
        }
      >
        <button
          type="button"
          className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
          aria-label="Ver información del estado"
        >
          <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: colors.textMuted }} />
        </button>
      </Tooltip>
    </div>
  )
}
