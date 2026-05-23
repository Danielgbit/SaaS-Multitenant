'use client'

import { useState, useCallback } from 'react'
import type { AppointmentWithDetails } from '@/types/calendar'

export function useCalendarModals() {
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [showPurgeModal, setShowPurgeModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showConfirmServiceModal, setShowConfirmServiceModal] = useState(false)
  const [showConfirmAppointmentModal, setShowConfirmAppointmentModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [pendingConfirmService, setPendingConfirmService] = useState<AppointmentWithDetails | null>(null)
  const [pendingConfirmAppointment, setPendingConfirmAppointment] = useState<AppointmentWithDetails | null>(null)

  const closeAll = useCallback(() => {
    setShowNewAppointmentModal(false)
    setShowPurgeModal(false)
    setShowDeleteConfirm(false)
    setShowConfirmServiceModal(false)
    setShowConfirmAppointmentModal(false)
    setSelectedAppointment(null)
    setPendingConfirmService(null)
    setPendingConfirmAppointment(null)
  }, [])

  return {
    showNewAppointmentModal, setShowNewAppointmentModal,
    showPurgeModal, setShowPurgeModal,
    showDeleteConfirm, setShowDeleteConfirm,
    showConfirmServiceModal, setShowConfirmServiceModal,
    showConfirmAppointmentModal, setShowConfirmAppointmentModal,
    selectedAppointment, setSelectedAppointment,
    pendingConfirmService, setPendingConfirmService,
    pendingConfirmAppointment, setPendingConfirmAppointment,
    closeAll,
  }
}
