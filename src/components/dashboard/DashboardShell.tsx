'use client'

import { useState, useEffect } from 'react'
import { CollapsibleSidebar } from '@/components/dashboard/CollapsibleSidebar'
import { Header } from '@/components/dashboard/Header'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ConfirmationsPanel } from '@/components/dashboard/ConfirmationsPanel'
import { ConfirmBanner } from '@/components/dashboard/ConfirmBanner'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface DashboardShellProps {
  children: React.ReactNode
  role: string | null
  organizationId: string | null
  organizationName?: string | null
}

export function DashboardShell({ children, role, organizationId, organizationName }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [confirmationsPanelOpen, setConfirmationsPanelOpen] = useState(false)

  useKeyboardShortcuts()

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="flex h-screen bg-[#FAFAF9] dark:bg-[#0F172A] font-sans antialiased selection:bg-[#0F4C5C]/20 dark:selection:bg-[#38BDF8]/30">
      
      {/* Desktop Collapsible Sidebar */}
      <CollapsibleSidebar
        role={role}
        organizationName={organizationName}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Navigation */}
      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)}
        role={role}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          organizationConnected={!!organizationId}
          organizationName={organizationName}
          role={role}
          onMenuToggle={() => setMobileNavOpen(true)}
          showHamburger
          onConfirmationsToggle={() => setConfirmationsPanelOpen(!confirmationsPanelOpen)}
        />

        {role !== 'empleado' && organizationId && (
          <ConfirmBanner
            organizationId={organizationId}
            onOpenPanel={() => setConfirmationsPanelOpen(true)}
          />
        )}

        <ConfirmationsPanel
          organizationId={organizationId || ''}
          isOpen={confirmationsPanelOpen}
          onClose={() => setConfirmationsPanelOpen(false)}
        />

        <main className="flex-1 overflow-y-auto w-full scroll-smooth">
          <div className="w-full max-w-[1280px] mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
