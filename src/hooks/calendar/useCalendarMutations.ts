'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { createAppointment, updateAppointmentStatus } from '@/actions/appointments/createAppointment'
import { updateAppointment } from '@/actions/appointments/updateAppointment'
import { deleteAppointment } from '@/actions/appointments/deleteAppointment'
import type { AppointmentWithDetails } from '@/types/calendar'

interface NewAppointmentData {
  clientId: string
  serviceId: string
  employeeId: string
  date: string
  time: string
  notes: string
}

interface EditData {
  clientId: string
  serviceId: string
  employeeId: string
  date: string
  time: string
  notes: string
}

interface UseCalendarMutationsCallbacks {
  onSuccess: () => void
  selectedAppointment: AppointmentWithDetails | null
  newAppointmentData: NewAppointmentData
  editData: EditData
  convertTo24Hour: (time: string) => string
}

export function useCalendarMutations(
  organizationId: string,
  {
    onSuccess, selectedAppointment, newAppointmentData, editData, convertTo24Hour,
  }: UseCalendarMutationsCallbacks
) {
  const [isCreating, setIsCreating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreate = useCallback(async () => {
    if (!newAppointmentData.clientId || !newAppointmentData.serviceId || !newAppointmentData.employeeId || !newAppointmentData.time) return
    const time24 = convertTo24Hour(newAppointmentData.time)
    const startTime = `${newAppointmentData.date}T${time24}:00.000Z`
    setIsCreating(true)
    try {
      const result = await createAppointment({
        employee_id: newAppointmentData.employeeId,
        client_id: newAppointmentData.clientId,
        service_id: newAppointmentData.serviceId,
        start_time: startTime,
        organization_id: organizationId,
        notes: newAppointmentData.notes?.trim() || undefined,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Cita creada')
      onSuccess()
    } catch (e) { console.error(e); toast.error('Error al crear la cita') }
    finally { setIsCreating(false) }
  }, [organizationId, newAppointmentData, onSuccess, convertTo24Hour])

  const handleStatus = useCallback(async (status: string) => {
    if (!selectedAppointment) return
    setUpdatingStatus(true)
    try {
      const result = await updateAppointmentStatus({
        appointment_id: selectedAppointment.id,
        status: status as any,
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Estado actualizado')
      onSuccess()
    } catch (e) { console.error(e); toast.error('Error al actualizar estado') }
    finally { setUpdatingStatus(false) }
  }, [selectedAppointment, onSuccess])

  const handleSaveEdit = useCallback(async (showTimeWarning?: boolean) => {
    if (!selectedAppointment || !editData.clientId || !editData.serviceId || !editData.employeeId || !editData.time) return Promise.resolve(false)
    setIsSavingEdit(true)
    try {
      const time24 = convertTo24Hour(editData.time)
      const startTime = `${editData.date}T${time24}:00.000Z`
      const result = await updateAppointment({
        appointment_id: selectedAppointment.id,
        employee_id: editData.employeeId,
        client_id: editData.clientId,
        service_id: editData.serviceId,
        start_time: startTime,
        notes: editData.notes || null,
      })
      if (result.error) { toast.error(result.error); return false }
      toast.success('Cita actualizada')
      onSuccess()
      return true
    } catch (e) { console.error(e); toast.error('Error al actualizar'); return false }
    finally { setIsSavingEdit(false) }
  }, [selectedAppointment, editData, organizationId, onSuccess, convertTo24Hour])

  const handleDelete = useCallback(async () => {
    if (!selectedAppointment) return
    setIsDeleting(true)
    try {
      const result = await deleteAppointment({ appointment_id: selectedAppointment.id })
      if (result.error) { toast.error(result.error); return }
      toast.success('Cita eliminada')
      onSuccess()
    } catch (e) { console.error(e); toast.error('Error al eliminar') }
    finally { setIsDeleting(false) }
  }, [selectedAppointment, onSuccess])

  const confirmServiceFromModal = useCallback(async (reason?: string) => {
    if (!selectedAppointment) return
    setUpdatingStatus(true)
    try {
      const formData = new FormData()
      formData.append('appointmentId', selectedAppointment.id)
      formData.append('reason', reason || 'Confirmado por admin desde calendario')

      const { markManually } = await import('@/actions/confirmations/markManually')
      const result = await markManually({ success: false }, formData)
      if (result.error) { toast.error(result.error); return }
      toast.success('Servicio confirmado')
      onSuccess()
    } catch (e) { console.error(e); toast.error('Error al confirmar servicio') }
    finally { setUpdatingStatus(false) }
  }, [selectedAppointment, onSuccess])

  const confirmAppointmentFromModal = useCallback(async () => {
    if (!selectedAppointment) return
    setUpdatingStatus(true)
    try {
      const result = await updateAppointmentStatus({
        appointment_id: selectedAppointment.id,
        status: 'confirmed',
      })
      if (result.error) { toast.error(result.error); return }
      toast.success('Cita confirmada')
      onSuccess()
    } catch (e) { console.error(e); toast.error('Error al confirmar la cita') }
    finally { setUpdatingStatus(false) }
  }, [selectedAppointment, onSuccess])

  return {
    isCreating, updatingStatus, isSavingEdit, isDeleting,
    handleCreate, handleStatus, handleSaveEdit, handleDelete,
    confirmServiceFromModal, confirmAppointmentFromModal,
    setUpdatingStatus,
  }
}
