'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ROUTE_MAP } from '@/lib/routes'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'

export function PageBreadcrumb() {
  const COLORS = useThemeColors()
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split('/').filter(Boolean)
  
  const breadcrumbItems = segments
    .map(segment => ({
      segment,
      ...ROUTE_MAP[segment],
    }))
    .filter(item => item.label)

  if (breadcrumbItems.length === 0) {
    return null
  }

  const handleBack = () => {
    if (breadcrumbItems.length > 1) {
      const parentPath = '/' + segments.slice(0, -1).join('/')
      router.push(parentPath)
    } else {
      router.back()
    }
  }

  return (
    <nav className="flex items-center gap-1" aria-label="Breadcrumb">
      {/* Mobile: Back button */}
      <button
        onClick={handleBack}
        className="lg:hidden p-1.5 rounded-xl transition-colors"
        style={{ 
          color: COLORS.textMuted,
          backgroundColor: 'transparent'
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = COLORS.surfaceHover; e.currentTarget.style.color = COLORS.textSecondary }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = COLORS.textMuted }}
        aria-label="Volver"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Tablet: Single level */}
      <span 
        className="hidden md:block lg:hidden text-sm font-medium"
        style={{ color: COLORS.textSecondary }}
      >
        {breadcrumbItems[breadcrumbItems.length - 1]?.label}
      </span>

      {/* Desktop: Full breadcrumb */}
      <div className="hidden lg:flex items-center gap-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1
          
          return (
            <div key={item.segment} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="w-4 h-4" style={{ color: COLORS.textMuted, opacity: 0.5 }} />
              )}
              <span
                className="text-sm cursor-pointer transition-colors"
                style={{ 
                  color: isLast ? COLORS.textSecondary : COLORS.textMuted,
                  fontWeight: isLast ? 500 : 400
                }}
                onMouseEnter={e => { if (!isLast) e.currentTarget.style.color = COLORS.textSecondary }}
                onMouseLeave={e => { if (!isLast) e.currentTarget.style.color = COLORS.textMuted }}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
