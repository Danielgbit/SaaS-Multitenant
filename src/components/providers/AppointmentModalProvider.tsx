'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AppointmentModalContextType {
  selectedAppointmentId: string | null
  setSelectedAppointmentId: (id: string | null) => void
  openAppointment: (id: string) => void
  closeModal: () => void
}

export const AppointmentModalContext = createContext<AppointmentModalContextType>({
  selectedAppointmentId: null,
  setSelectedAppointmentId: () => {},
  openAppointment: () => {},
  closeModal: () => {},
})

export function AppointmentModalProvider({ children }: { children: ReactNode }) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  const openAppointment = useCallback((id: string) => {
    setSelectedAppointmentId(id)
  }, [])

  const closeModal = useCallback(() => {
    setSelectedAppointmentId(null)
  }, [])

  return (
    <AppointmentModalContext.Provider value={{ selectedAppointmentId, setSelectedAppointmentId, openAppointment, closeModal }}>
      {children}
    </AppointmentModalContext.Provider>
  )
}

export function useAppointmentModal() {
  const context = useContext(AppointmentModalContext)
  if (!context) {
    throw new Error('useAppointmentModal must be used within AppointmentModalProvider')
  }
  return context
}