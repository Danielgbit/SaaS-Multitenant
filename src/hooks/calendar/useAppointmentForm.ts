'use client'

import { useState, useCallback } from 'react'

interface SlotData {
  start_time: string
  end_time: string
  available: boolean
  blockedReason?: string
}

export function useAppointmentForm(organizationId: string) {
  // Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [newAppointmentData, setNewAppointmentData] = useState({
    clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: ''
  })

  // Search state (new)
  const [clientSearch, setClientSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)

  // Slots (new)
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  // Edit state
  const [editData, setEditData] = useState({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
  const [editSearch, setEditSearch] = useState({ client: '', service: '', employee: '' })
  const [showEditDropdowns, setShowEditDropdowns] = useState({ client: false, service: false, employee: false })
  const [editSlots, setEditSlots] = useState<SlotData[]>([])
  const [loadingEditSlots, setLoadingEditSlots] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)

  const nextStep = useCallback(() => { if (wizardStep < 4) setWizardStep(s => s + 1) }, [wizardStep])
  const prevStep = useCallback(() => { if (wizardStep > 1) setWizardStep(s => s - 1) }, [wizardStep])

  const resetNewForm = useCallback(() => {
    setWizardStep(1)
    setNewAppointmentData({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
    setClientSearch(''); setServiceSearch(''); setEmployeeSearch('')
    setShowClientDropdown(false); setShowServiceDropdown(false); setShowEmployeeDropdown(false)
    setAvailableSlots([]); setLoadingSlots(false); setSlotsError(null)
  }, [])

  const resetEditForm = useCallback(() => {
    setEditData({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
    setEditSearch({ client: '', service: '', employee: '' })
    setShowEditDropdowns({ client: false, service: false, employee: false })
    setEditSlots([]); setLoadingEditSlots(false); setShowTimeWarning(false)
  }, [])

  const fetchSlots = useCallback(async () => {
    if (!newAppointmentData.employeeId || !newAppointmentData.serviceId || !newAppointmentData.date) return
    setLoadingSlots(true)
    setSlotsError(null)
    try {
      const res = await fetch(`/api/slots?employeeId=${newAppointmentData.employeeId}&serviceId=${newAppointmentData.serviceId}&date=${newAppointmentData.date}&organizationId=${organizationId}&bypassNotice=true`)
      const data = await res.json()
      if (data.error) { setSlotsError(data.error + (data.details ? ` (${data.details})` : '')); return }
      if (data.slots && data.slots.length > 0) {
        setAvailableSlots(data.slots)
      } else {
        setSlotsError('No hay horarios disponibles para este día.')
      }
    } catch (e) { console.error('[SLOTS] Error:', e); setSlotsError('Error al cargar horarios') }
    finally { setLoadingSlots(false) }
  }, [newAppointmentData.employeeId, newAppointmentData.serviceId, newAppointmentData.date, organizationId])

  const fetchEditSlots = useCallback(async () => {
    if (!editData.employeeId || !editData.serviceId || !editData.date) return
    setLoadingEditSlots(true)
    try {
      const res = await fetch(`/api/slots?employeeId=${editData.employeeId}&serviceId=${editData.serviceId}&date=${editData.date}&organizationId=${organizationId}&bypassNotice=true`)
      const data = await res.json()
      if (data.slots) setEditSlots(data.slots)
    } catch (e) { console.error(e) }
    finally { setLoadingEditSlots(false) }
  }, [editData.employeeId, editData.serviceId, editData.date, organizationId])

  const categorizeSlots = useCallback((slots: SlotData[]) => {
    const morning: SlotData[] = []
    const afternoon: SlotData[] = []
    slots.forEach(s => {
      const hour = parseInt(s.start_time.split('T')[1]?.slice(0, 2) || '0', 10)
      if (hour < 13) morning.push(s)
      else afternoon.push(s)
    })
    return { morning, afternoon }
  }, [])

  return {
    wizardStep, setWizardStep,
    newAppointmentData, setNewAppointmentData,
    clientSearch, setClientSearch,
    serviceSearch, setServiceSearch,
    employeeSearch, setEmployeeSearch,
    showClientDropdown, setShowClientDropdown,
    showServiceDropdown, setShowServiceDropdown,
    showEmployeeDropdown, setShowEmployeeDropdown,
    availableSlots, setAvailableSlots,
    loadingSlots, setLoadingSlots,
    slotsError, setSlotsError,
    editData, setEditData,
    editSearch, setEditSearch,
    showEditDropdowns, setShowEditDropdowns,
    editSlots, setEditSlots,
    loadingEditSlots, setLoadingEditSlots,
    showTimeWarning, setShowTimeWarning,
    nextStep, prevStep,
    resetNewForm, resetEditForm,
    fetchSlots, fetchEditSlots,
    categorizeSlots,
  }
}
