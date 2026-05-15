'use client'

import { useState } from 'react'
import { BarChart3, FileText, Zap, ListFilter, Settings, MessageCircle } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { TabOverview } from './TabOverview'
import { TabQueue } from './TabQueue'
import { TabSettings } from './TabSettings'
import { TabTemplates } from './TabTemplates'
import { TabAutomations } from './TabAutomations'

type TabId = 'overview' | 'queue' | 'settings' | 'templates' | 'automations'

interface WhatsAppModuleClientProps {
  organizationId: string
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'queue', label: 'Cola', icon: <ListFilter className="w-4 h-4" /> },
  { id: 'settings', label: 'Configuración', icon: <Settings className="w-4 h-4" /> },
  { id: 'templates', label: 'Templates', icon: <FileText className="w-4 h-4" /> },
  { id: 'automations', label: 'Automatizaciones', icon: <Zap className="w-4 h-4" /> },
]

export function WhatsAppModuleClient({ organizationId }: WhatsAppModuleClientProps) {
  const COLORS = useThemeColors()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <TabOverview organizationId={organizationId} />
      case 'queue':
        return <TabQueue organizationId={organizationId} />
      case 'settings':
        return <TabSettings organizationId={organizationId} />
      case 'templates':
        return <TabTemplates organizationId={organizationId} />
      case 'automations':
        return <TabAutomations organizationId={organizationId} />
      default:
        return <TabOverview organizationId={organizationId} />
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderColor: COLORS.border,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: COLORS.whatsappLight }}
        >
          <MessageCircle className="w-5 h-5" style={{ color: COLORS.whatsapp }} />
          <span
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              backgroundColor: COLORS.success,
              borderColor: COLORS.surface,
            }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl font-bold"
              style={{ color: COLORS.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              WhatsApp
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: COLORS.success + '20', color: COLORS.success }}>
              Operativo
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>
            Mensajería y automatizaciones
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-1 p-1.5 rounded-xl overflow-x-auto"
        style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor: isActive ? COLORS.primaryGradient : 'transparent',
                color: isActive ? '#FFFFFF' : COLORS.textSecondary,
                boxShadow: isActive ? '0 2px 8px rgba(56, 189, 248, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = COLORS.surfaceHover }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span style={{ color: isActive ? '#FFFFFF' : (tab.id === 'overview' ? COLORS.textSecondary : COLORS.textMuted) }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div>{renderTab()}</div>
    </div>
  )
}