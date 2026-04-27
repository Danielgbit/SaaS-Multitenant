'use client'

import { useState, useEffect } from 'react'
import { CollapsibleSidebar } from '@/components/dashboard/CollapsibleSidebar'
import { Header } from '@/components/dashboard/Header'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ConfirmationsPanel } from '@/components/dashboard/ConfirmationsPanel'
import { ConfirmBanner } from '@/components/dashboard/ConfirmBanner'
import { ReminderBanner } from '@/components/dashboard/ReminderBanner'
import { PaymentModal } from '@/components/dashboard/PaymentModal'
import { PaymentQueueProvider, usePaymentQueue } from '@/components/providers/PaymentQueueProvider'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAppointmentModal } from '@/components/providers/AppointmentModalProvider'

interface DashboardShellProps {
  children: React.ReactNode
  userId?: string | null
  role: string | null
  organizationId: string | null
  organizationName?: string | null
}

function DashboardShellContent({ 
  children, 
  userId, 
  role, 
  organizationId, 
  organizationName 
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [confirmationsPanelOpen, setConfirmationsPanelOpen] = useState(false)
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
      <div className="flex h-screen bg-[#FAFAF9] dark:bg-[#0F172A] font-sans antialiased selection:bg-[#0F4C5C]/20 dark:selection:bg-[#38BDF8]/30">

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
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <div className="w-full max-w-[1280px] mx-auto px-6 md:px-8 lg:px-10">
            <Header
              organizationConnected={!!organizationId}
              organizationName={organizationName}
              role={role}
              userId={userId}
              onMenuToggle={() => setMobileNavOpen(true)}
              showHamburger
              onConfirmationsToggle={() => setConfirmationsPanelOpen(!confirmationsPanelOpen)}
              queueCount={queueCount}
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
          </div>

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
        />
      )}
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