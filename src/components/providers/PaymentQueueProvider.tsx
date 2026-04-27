'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export interface QueuedNotification {
  id: string
  appointmentId: string
  clientName: string
  serviceName: string
  employeeName: string
  totalPrice: number
  completedAt: string | null
  logId?: string
  notes?: string | null
  queuedAt: number
}

interface PaymentQueueContextType {
  queue: QueuedNotification[]
  currentNotification: QueuedNotification | null
  isModalOpen: boolean
  addToQueue: (notification: QueuedNotification) => void
  removeFromQueue: (id: string) => void
  processNext: () => void
  openModal: (notification: QueuedNotification) => void
  closeModal: () => void
  markAsPaid: (id: string) => void
  queueCount: number
}

export const PaymentQueueContext = createContext<PaymentQueueContextType>({
  queue: [],
  currentNotification: null,
  isModalOpen: false,
  addToQueue: () => {},
  removeFromQueue: () => {},
  processNext: () => {},
  openModal: () => {},
  closeModal: () => {},
  markAsPaid: () => {},
  queueCount: 0,
})

const PROCESS_DELAY_MS = 2000
const QUEUE_STORAGE_KEY = 'payment-queue'

export function PaymentQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedNotification[]>([])
  const [currentNotification, setCurrentNotification] = useState<QueuedNotification | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const processingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setQueue(parsed.filter((n: QueuedNotification) => Date.now() - n.queuedAt < 3600000))
      } catch (e) {
        localStorage.removeItem(QUEUE_STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
    } else {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    }
  }, [queue])

  const showNotificationToast = useCallback((notification: QueuedNotification) => {
    toast.success(
      `Servicio completado por ${notification.employeeName}`,
      {
        description: `${notification.clientName} - ${notification.serviceName} - $${notification.totalPrice.toLocaleString('es-CO')}`,
        duration: 10000,
        action: {
          label: 'Cobrar ahora',
          onClick: () => {
            toast.dismiss()
            setCurrentNotification(notification)
            setIsModalOpen(true)
          },
        },
        onDismiss: () => {
        },
      }
    )
  }, [])

  const addToQueue = useCallback((notification: QueuedNotification) => {
    setQueue(prev => {
      const exists = prev.some(n => n.id === notification.id)
      if (exists) return prev

      const updated = [...prev, notification]

      if (!currentNotification && !isModalOpen && prev.length === 0) {
        setTimeout(() => {
          showNotificationToast(notification)
        }, 500)
      }

      return updated
    })
  }, [currentNotification, isModalOpen, showNotificationToast])

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(n => n.id !== id))
  }, [])

  const openModal = useCallback((notification: QueuedNotification) => {
    setCurrentNotification(notification)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const markAsPaid = useCallback((id: string) => {
    removeFromQueue(id)
    setCurrentNotification(null)
    setIsModalOpen(false)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      processingRef.current = false
      processNext()
    }, PROCESS_DELAY_MS)
  }, [removeFromQueue])

  const processNext = useCallback(() => {
    if (processingRef.current) return
    if (currentNotification || isModalOpen) return

    setQueue(prev => {
      if (prev.length === 0) return prev

      const [next, ...rest] = prev
      processingRef.current = true

      setTimeout(() => {
        showNotificationToast(next)
      }, 500)

      return rest
    })
  }, [currentNotification, isModalOpen, showNotificationToast])

  return (
    <PaymentQueueContext.Provider
      value={{
        queue,
        currentNotification,
        isModalOpen,
        addToQueue,
        removeFromQueue,
        processNext,
        openModal,
        closeModal,
        markAsPaid,
        queueCount: queue.length + (currentNotification ? 1 : 0),
      }}
    >
      {children}
    </PaymentQueueContext.Provider>
  )
}

export function usePaymentQueue() {
  const context = useContext(PaymentQueueContext)
  if (!context) {
    throw new Error('usePaymentQueue must be used within PaymentQueueProvider')
  }
  return context
}

export function setupPaymentQueueRealtime(
  organizationId: string,
  userId: string,
  onNewNotification: (notification: QueuedNotification) => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`payment-queue-${organizationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `organization_id=eq.${organizationId}`,
      },
      (payload) => {
        const notification = payload.new as {
          id: string
          type: string
          user_id: string
          title: string
          message: string
          metadata: Record<string, unknown>
          created_at: string
        }

        if (notification.type === 'service_ready' && notification.user_id === userId) {
          const metadata = notification.metadata || {}
          onNewNotification({
            id: notification.id,
            appointmentId: (metadata.appointment_id as string) || '',
            clientName: (metadata.client_name as string) || notification.message?.split(' - ')[0] || 'Cliente',
            serviceName: (metadata.service_name as string) || notification.title,
            employeeName: (metadata.employee_name as string) || 'Profesional',
            totalPrice: (metadata.price as number) || 0,
            completedAt: (metadata.completed_at as string) || notification.created_at,
            logId: (metadata.log_id as string) || undefined,
            notes: (metadata.notes as string) || null,
            queuedAt: Date.now(),
          })
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}