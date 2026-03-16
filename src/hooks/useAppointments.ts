'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  AppointmentWithDetails, 
  Employee, 
  Client, 
  Service, 
  TimeSlot,
  NewAppointmentData,
  EditAppointmentData
} from '@/types/calendar'

interface UseAppointmentsReturn {
  // State
  appointments: AppointmentWithDetails[]
  employees: Employee[]
  clients: Client[]
  services: Service[]
  loading: boolean
  error: string | null
  currentDate: Date
  weekDates: Date[]
  
  // Modal states
  selectedAppointment: AppointmentWithDetails | null
  showNewAppointmentModal: boolean
  showEditModal: boolean
  showDeleteConfirm: boolean
  
  // Wizard state
  wizardStep: number
  newAppointmentData: NewAppointmentData
  editData: EditAppointmentData
  
  // Slots state
  availableSlots: TimeSlot[]
  loadingSlots: boolean
  slotsError: string | null
  
  // Search states
  clientSearch: string
  serviceSearch: string
  employeeSearch: string
  showClientDropdown: boolean
  showServiceDropdown: boolean
  showEmployeeDropdown: boolean
  
  // Actions
  setCurrentDate: (date: Date) => void
  goToPrevWeek: () => void
  goToNextWeek: () => void
  goToToday: () => void
  openNewModal: () => void
  closeNewModal: () => void
  setSelectedAppointment: (apt: AppointmentWithDetails | null) => void
  nextStep: () => void
  prevStep: () => void
  fetchSlots: () => Promise<void>
  handleCreate: () => Promise<void>
  handleStatus: (status: string) => Promise<void>
  handleDelete: () => Promise<void>
  handleSaveEdit: () => Promise<void>
  setNewAppointmentData: (data: Partial<NewAppointmentData>) => void
  setEditData: (data: Partial<EditAppointmentData>) => void
  setClientSearch: (search: string) => void
  setServiceSearch: (search: string) => void
  setEmployeeSearch: (search: string) => void
  setShowClientDropdown: (show: boolean) => void
  setShowServiceDropdown: (show: boolean) => void
  setShowEmployeeDropdown: (show: boolean) => void
  
  // Helpers
  formatMonthYear: () => string
  isToday: (d: Date) => boolean
  getWeekRange: () => string
  formatDateKey: (d: Date) => string
  formatTime: (d: string) => string
  formatDateTimeFull: (d: string) => string
  appointmentsByDay: Record<string, AppointmentWithDetails[]>
  categorizeSlots: (slots: TimeSlot[]) => { morning: TimeSlot[]; afternoon: TimeSlot[] }
  
  // Extra states for edit
  editSearch: { client: string; service: string; employee: string }
  setEditSearch: React.Dispatch<React.SetStateAction<{ client: string; service: string; employee: string }>>
  showEditDropdowns: { client: boolean; service: boolean; employee: boolean }
  setShowEditDropdowns: React.Dispatch<React.SetStateAction<{ client: boolean; service: boolean; employee: boolean }>>
  editSlots: TimeSlot[]
  loadingEditSlots: boolean
  fetchEditSlots: () => Promise<void>
  showTimeWarning: boolean
  setShowTimeWarning: React.Dispatch<React.SetStateAction<boolean>>
  isCreating: boolean
  updatingStatus: boolean
  isSavingEdit: boolean
  isDeleting: boolean
}

export function useAppointments(organizationId: string): UseAppointmentsReturn {
  const supabase = createClient()
  
  // Main state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [newAppointmentData, setNewAppointmentData] = useState<NewAppointmentData>({
    clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: ''
  })
  const [editData, setEditData] = useState<EditAppointmentData>({
    clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: ''
  })
  
  // Slots state
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  
  // Search states
  const [clientSearch, setClientSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  
  // Edit search
  const [editSearch, setEditSearch] = useState({ client: '', service: '', employee: '' })
  const [showEditDropdowns, setShowEditDropdowns] = useState({ client: false, service: false, employee: false })
  const [editSlots, setEditSlots] = useState<TimeSlot[]>([])
  const [loadingEditSlots, setLoadingEditSlots] = useState(false)
  
  // Actions states
  const [isCreating, setIsCreating] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)

  // Week dates
  const weekDates = useMemo(() => {
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(start.setDate(diff))
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [currentDate])

  const formatDateKey = (date: Date): string => date.toISOString().split('T')[0]

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const formatDateTimeFull = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!organizationId) return
      setLoading(true)
      setError(null)
      try {
        const startDate = formatDateKey(weekDates[0])
        const endDate = formatDateKey(weekDates[6])
        const [aptRes, empRes, cliRes, srvRes] = await Promise.all([
          supabase.from('appointments').select('*').eq('organization_id', organizationId).gte('start_time', `${startDate}T00:00:00.000Z`).lte('start_time', `${endDate}T23:59:59.999Z`).order('start_time'),
          supabase.from('employees').select('*').eq('organization_id', organizationId),
          supabase.from('clients').select('*').eq('organization_id', organizationId),
          supabase.from('services').select('*').eq('organization_id', organizationId),
        ])
        if (aptRes.error) throw aptRes.error

        const empMap = new Map<string, Employee>()
        empRes.data?.forEach(e => empMap.set(e.id, e))
        const cliMap = new Map<string, Client>()
        cliRes.data?.forEach(c => cliMap.set(c.id, c))
        const srvMap = new Map<string, Service>()
        srvRes.data?.forEach(s => srvMap.set(s.id, s))

        const withDetails: AppointmentWithDetails[] = (aptRes.data ?? []).map((apt: any) => ({
          ...apt,
          employee: empMap.get(apt.employee_id),
          client: cliMap.get(apt.client_id),
          service: apt.service_id ? srvMap.get(apt.service_id) : undefined
        }))
        setAppointments(withDetails)
        setEmployees(empRes.data ?? [])
        setClients(cliRes.data ?? [])
        setServices(srvRes.data ?? [])
      } catch (err) {
        console.error('Error:', err)
        setError('Error al cargar')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [organizationId, currentDate, supabase, weekDates])

  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, AppointmentWithDetails[]> = {}
    weekDates.forEach(d => { grouped[formatDateKey(d)] = [] })
    appointments.forEach(apt => {
      const key = formatDateKey(new Date(apt.start_time))
      if (grouped[key]) grouped[key].push(apt)
    })
    return grouped
  }, [appointments, weekDates])

  // Navigation
  const goToPrevWeek = useCallback(() => { 
    const n = new Date(currentDate); 
    n.setDate(n.getDate() - 7); 
    setCurrentDate(n) 
  }, [currentDate])
  
  const goToNextWeek = useCallback(() => { 
    const n = new Date(currentDate); 
    n.setDate(n.getDate() + 7); 
    setCurrentDate(n) 
  }, [currentDate])
  
  const goToToday = useCallback(() => setCurrentDate(new Date()), [])
  
  const formatMonthYear = () => currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(new Date())
  const getWeekRange = () => {
    const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${weekDates[0].toLocaleDateString('es-ES', o)} - ${weekDates[6].toLocaleDateString('es-ES', o)}`
  }

  // Modal actions
  const openNewModal = () => setShowNewAppointmentModal(true)
  
  const closeNewModal = () => {
    setShowNewAppointmentModal(false)
    setWizardStep(1)
    setNewAppointmentData({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
    setClientSearch(''); setServiceSearch(''); setEmployeeSearch('')
    setShowClientDropdown(false); setShowServiceDropdown(false); setShowEmployeeDropdown(false)
    setAvailableSlots([])
  }

  const openEdit = () => {
    if (!selectedAppointment) return
    const apt = selectedAppointment as any
    setEditData({ 
      clientId: selectedAppointment.client_id, 
      serviceId: apt?.service?.id || '', 
      employeeId: selectedAppointment.employee_id, 
      date: selectedAppointment.start_time.split('T')[0], 
      time: selectedAppointment.start_time.split('T')[1].slice(0, 5), 
      notes: selectedAppointment.notes || '' 
    })
    setEditSearch({ 
      client: selectedAppointment.client?.name || '', 
      service: apt?.service?.name || '', 
      employee: selectedAppointment.employee?.name || '' 
    })
    setShowEditModal(true)
    setShowTimeWarning(false)
  }

  const closeEdit = () => {
    setShowEditModal(false)
    setEditData({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
    setEditSearch({ client: '', service: '', employee: '' })
    setShowEditDropdowns({ client: false, service: false, employee: false })
    setEditSlots([])
    setShowTimeWarning(false)
  }

  // Wizard navigation
  const nextStep = () => { if (wizardStep < 3) setWizardStep(wizardStep + 1) }
  const prevStep = () => { if (wizardStep > 1) setWizardStep(wizardStep - 1) }
  const canStep2 = newAppointmentData.clientId !== ''
  const canStep3 = newAppointmentData.serviceId !== '' && newAppointmentData.employeeId !== ''

  // Fetch slots
  const fetchSlots = async () => {
    if (!newAppointmentData.employeeId || !newAppointmentData.serviceId || !newAppointmentData.date) return
    setLoadingSlots(true)
    setSlotsError(null)
    try {
      const res = await fetch(`/api/slots?employeeId=${newAppointmentData.employeeId}&serviceId=${newAppointmentData.serviceId}&date=${newAppointmentData.date}&organizationId=${organizationId}`)
      const data = await res.json()
      if (data.error) {
        setSlotsError(data.error + (data.details ? ` (${data.details})` : ''))
        return
      }
      if (data.slots && data.slots.length > 0) {
        setAvailableSlots(data.slots)
      } else {
        setSlotsError('No hay horarios disponibles.')
      }
    } catch (e) { 
      console.error('[SLOTS] Error:', e)
      setSlotsError('Error al cargar horarios')
    }
    finally { setLoadingSlots(false) }
  }

  const categorizeSlots = (slots: TimeSlot[]) => {
    const m: TimeSlot[] = [], a: TimeSlot[] = []
    slots.forEach(s => { const h = parseInt(s.start_time.split('T')[1].slice(0, 2), 10); (h < 13 ? m : a).push(s) })
    return { morning: m, afternoon: a }
  }

  // Create appointment
  const handleCreate = async () => {
    if (!newAppointmentData.clientId || !newAppointmentData.serviceId || !newAppointmentData.employeeId || !newAppointmentData.time) return
    const startTime = `${newAppointmentData.date}T${newAppointmentData.time}:00.000Z`
    setIsCreating(true)
    try {
      const payload: Record<string, string> = {
        employee_id: newAppointmentData.employeeId,
        client_id: newAppointmentData.clientId,
        service_id: newAppointmentData.serviceId,
        start_time: startTime,
        organization_id: organizationId,
      }
      if (newAppointmentData.notes?.trim()) {
        payload.notes = newAppointmentData.notes.trim()
      }
      const res = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      closeNewModal()
      setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setIsCreating(false) }
  }

  // Update status
  const handleStatus = async (status: string) => {
    if (!selectedAppointment) return
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/appointments', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ appointment_id: selectedAppointment.id, status }) 
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setSelectedAppointment(null)
      setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setUpdatingStatus(false) }
  }

  // Delete
  const handleDelete = async () => {
    if (!selectedAppointment) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/appointments', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ appointment_id: selectedAppointment.id }) 
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setShowDeleteConfirm(false)
      setSelectedAppointment(null)
      setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setIsDeleting(false) }
  }

  // Fetch edit slots
  const fetchEditSlots = async () => {
    if (!editData.employeeId || !editData.serviceId || !editData.date) return
    setLoadingEditSlots(true)
    try {
      const res = await fetch(`/api/slots?employeeId=${editData.employeeId}&serviceId=${editData.serviceId}&date=${editData.date}&organizationId=${organizationId}`)
      const data = await res.json()
      if (data.slots) setEditSlots(data.slots)
    } catch (e) { console.error(e) }
    finally { setLoadingEditSlots(false) }
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (!selectedAppointment || !editData.clientId || !editData.serviceId || !editData.employeeId || !editData.time) return
    const orig = selectedAppointment.start_time.split('T')[1].slice(0, 5)
    if (orig !== editData.time && !showTimeWarning) { setShowTimeWarning(true); return }
    const startTime = `${editData.date}T${editData.time}:00.000Z`
    setIsSavingEdit(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointment_id: selectedAppointment.id, 
          employee_id: editData.employeeId, 
          client_id: editData.clientId, 
          service_id: editData.serviceId, 
          start_time: startTime, 
          notes: editData.notes || null 
        })
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      closeEdit()
      setSelectedAppointment(null)
      setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setIsSavingEdit(false); setShowTimeWarning(false) }
  }

  return {
    // State
    appointments,
    employees,
    clients,
    services,
    loading,
    error,
    currentDate,
    weekDates,
    
    // Modal states
    selectedAppointment,
    showNewAppointmentModal,
    showEditModal,
    showDeleteConfirm,
    
    // Wizard state
    wizardStep,
    newAppointmentData,
    editData,
    
    // Slots state
    availableSlots,
    loadingSlots,
    slotsError,
    
    // Search states
    clientSearch,
    serviceSearch,
    employeeSearch,
    showClientDropdown,
    showServiceDropdown,
    showEmployeeDropdown,
    
    // Actions
    setCurrentDate,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    openNewModal,
    closeNewModal,
    setSelectedAppointment,
    nextStep,
    prevStep,
    fetchSlots,
    handleCreate,
    handleStatus,
    handleDelete,
    handleSaveEdit,
    setNewAppointmentData: (data) => setNewAppointmentData(prev => ({ ...prev, ...data })),
    setEditData: (data) => setEditData(prev => ({ ...prev, ...data })),
    setClientSearch,
    setServiceSearch,
    setEmployeeSearch,
    setShowClientDropdown,
    setShowServiceDropdown,
    setShowEmployeeDropdown,
    
    // Helpers
    formatMonthYear,
    isToday,
    getWeekRange,
    formatDateKey,
    formatTime,
    formatDateTimeFull,
    appointmentsByDay,
    categorizeSlots,
    
    // Extra states for edit
    editSearch,
    setEditSearch,
    showEditDropdowns,
    setShowEditDropdowns,
    editSlots,
    loadingEditSlots,
    fetchEditSlots,
    showTimeWarning,
    setShowTimeWarning,
    isCreating,
    updatingStatus,
    isSavingEdit,
    isDeleting,
  }
}
