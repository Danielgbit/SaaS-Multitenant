'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { CollapsibleSidebar } from '@/components/dashboard/CollapsibleSidebar'
import { Header } from '@/components/dashboard/Header'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ConfirmBanner } from '@/components/dashboard/ConfirmBanner'
import { ReminderBanner } from '@/components/dashboard/ReminderBanner'
import { PageContainer } from '@/components/ui'
import { PaymentQueueProvider, usePaymentQueue } from '@/components/providers/PaymentQueueProvider'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAppointmentModal } from '@/components/providers/AppointmentModalProvider'
import { CommandPalette } from '@/components/dashboard/command-palette/CommandPalette'
import { SidebarSectionSkeleton } from './analytics/DashboardSkeletons'
import { useThemeColors } from '@/hooks/useThemeColors'

const ConfirmationsPanel = dynamic(
  () => import('./ConfirmationsPanel').then(m => ({ default: m.ConfirmationsPanel })),
  { loading: () => <SidebarSectionSkeleton />, ssr: false }
)

const PaymentModal = dynamic(
  () => import('./PaymentModal').then(m => ({ default: m.PaymentModal })),
  { loading: () => <SidebarSectionSkeleton />, ssr: false }
)

const AdjustPriceModal = dynamic(
  () => import('./AdjustPriceModal').then(m => ({ default: m.AdjustPriceModal })),
  { loading: () => <SidebarSectionSkeleton />, ssr: false }
)

interface DashboardShellProps {
  children: React.ReactNode
  userId?: string | null
  userEmail?: string | null
  role: string | null
  organizationId: string | null
  organizationName?: string | null
}

function DashboardShellContent({ 
  children, 
  userId, 
  userEmail,
  role, 
  organizationId, 
  organizationName 
}: DashboardShellProps) {
  const COLORS = useThemeColors()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [confirmationsPanelOpen, setConfirmationsPanelOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const { openAppointment } = useAppointmentModal()
  const {
    currentNotification,
    isModalOpen,
    addToQueue,
    markAsPaid,
    queueCount,
    processNext,
    closeModal,
  } = usePaymentQueue()

  useKeyboardShortcuts()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    if (!organizationId || role === 'empleado' || !userId) return

    const { setupPaymentQueueRealtime } = require('@/components/providers/PaymentQueueProvider')
    
    const cleanup = setupPaymentQueueRealtime(organizationId, userId, (notification: any) => {
      addToQueue(notification)
    })

    return cleanup
  }, [organizationId, role, userId, addToQueue])

  useEffect(() => {
    if (!currentNotification && !isModalOpen && queueCount > 0) {
      const timer = setTimeout(() => {
        processNext()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentNotification, isModalOpen, queueCount, processNext])

  return (
    <>
      <div className="flex h-screen font-sans antialiased" style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary }}>

        <CollapsibleSidebar
          role={role}
          organizationName={organizationName}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <MobileNav
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          role={role}
          organizationName={organizationName}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <PageContainer>
            <Header
              organizationConnected={!!organizationId}
              organizationName={organizationName}
              role={role}
              userId={userId}
              userEmail={userEmail}
              onConfirmationsToggle={() => setConfirmationsPanelOpen(!confirmationsPanelOpen)}
            />

            {role !== 'empleado' && organizationId && (
              <ConfirmBanner
                organizationId={organizationId}
                onOpenPanel={() => setConfirmationsPanelOpen(true)}
              />
            )}

            {role === 'empleado' && userId && (
              <ReminderBanner
                userId={userId}
                onOpenAppointment={openAppointment}
              />
            )}
          </PageContainer>

          <ConfirmationsPanel
            organizationId={organizationId || ''}
            isOpen={confirmationsPanelOpen}
            onClose={() => setConfirmationsPanelOpen(false)}
          />

          <main className="flex-1 overflow-y-auto w-full scroll-smooth pb-20 md:pb-0">
            <PageContainer className="p-6 md:p-8 lg:p-10">
              {children}
            </PageContainer>
          </main>

        </div>
      </div>

      {currentNotification && isModalOpen && (
        <PaymentModal
          appointmentId={currentNotification.appointmentId}
          logId={currentNotification.logId}
          clientName={currentNotification.clientName}
          serviceName={currentNotification.serviceName}
          employeeName={currentNotification.employeeName}
          totalPrice={currentNotification.totalPrice}
          completedAt={currentNotification.completedAt}
          isOpen={isModalOpen}
          onClose={closeModal}
          onSuccess={() => {
            markAsPaid(currentNotification.id)
          }}
          queueNotificationId={currentNotification.id}
          onQueuePaymentSuccess={markAsPaid}
          services={[]}
          onConfirm={async () => ({ success: true })}
        />
      )}

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        role={role}
      />
    </>
  )
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <PaymentQueueProvider>
      <DashboardShellContent {...props} />
    </PaymentQueueProvider>
  )
}