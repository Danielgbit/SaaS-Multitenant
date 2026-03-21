'use client'

import { useTheme } from 'next-themes'
import { BillingClient } from '@/components/dashboard/billing/BillingClient'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    surface: isDark ? '#0F172A' : '#FAFAF9',
    surfaceSubtle: isDark ? '#1E293B' : '#FFFFFF',
    textPrimary: isDark ? '#F1F5F9' : '#1A2B32',
    textSecondary: isDark ? '#94A3B8' : '#5A6B70',
    border: isDark ? '#334155' : '#E8ECEE',
    isDark,
  }
}

export function BillingPageWrapper({ 
  plans, 
  subscription, 
  organizationId 
}: { 
  plans: any[]
  subscription: any
  organizationId: string 
}) {
  const COLORS = useColors()

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.surface }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 
            className="text-3xl font-semibold" 
            style={{ 
              color: COLORS.textPrimary, 
              fontFamily: "'Cormorant Garamond', serif" 
            }}
          >
            Facturación
          </h1>
          <p 
            style={{ color: COLORS.textSecondary }} 
            className="mt-2"
          >
            Gestiona tu suscripción y métodos de pago
          </p>
        </header>

        <BillingClient
          plans={plans}
          subscription={subscription}
          organizationId={organizationId}
        />
      </div>
    </div>
  )
}
