'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  User, 
  Building2,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Circle,
  Phone,
  Mail,
  FileText,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { 
  Appointment, 
  Employee, 
  Client, 
  Service, 
  AppointmentWithDetails, 
  CalendarViewProps,
  TimeSlot,
  NewAppointmentData,
  EditAppointmentData,
  CalendarColors
} from '@/types/calendar'
import { ConfirmationButton } from './ConfirmationButton'
import React from 'react'

function useColors(): CalendarColors & { isDark: boolean } {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    isDark,
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFB',
    surfaceHover: isDark ? '#334155' : '#F1F5F9',
    border: isDark ? '#334155' : '#E8ECEE',
    borderLight: isDark ? '#1E293B' : '#F0F3F4',
    textPrimary: isDark ? '#F1F5F9' : '#1A2B32',
    textSecondary: isDark ? '#94A3B8' : '#5A6B70',
    textMuted: isDark ? '#64748B' : '#8A9A9E',
    success: '#059669',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    warning: '#D97706',
    warningLight: isDark ? '#451A03' : '#FEF3C7',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(15,23,42,0.5)',
    glass: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)',
  }
}

export function CalendarView({ organizationId, userRole }: CalendarViewProps) {
  const COLORS = useColors()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const STATUS_CONFIG = useMemo(() => ({
    confirmed: { color: COLORS.success, bg: COLORS.successLight, label: 'Confirmada', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    pending: { color: COLORS.warning, bg: COLORS.warningLight, label: 'Pendiente', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    cancelled: { color: COLORS.error, bg: COLORS.errorLight, label: 'Cancelada', icon: <XCircle className="w-3.5 h-3.5" /> },
    completed: { color: COLORS.textSecondary, bg: COLORS.borderLight, label: 'Completada', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  }), [COLORS])

  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [newAppointmentData, setNewAppointmentData] = useState({
    clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: ''
  })
  const [clientSearch, setClientSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<{start_time: string, end_time: string, available: boolean}[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
  const [editSearch, setEditSearch] = useState({ client: '', service: '', employee: '' })
  const [showEditDropdowns, setShowEditDropdowns] = useState({ client: false, service: false, employee: false })
  const [editSlots, setEditSlots] = useState<{start_time: string, end_time: string, available: boolean}[]>([])
  const [loadingEditSlots, setLoadingEditSlots] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  
  // Delete mode
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

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
        if (empRes.error) throw empRes.error
        if (cliRes.error) throw cliRes.error
        if (srvRes.error) throw srvRes.error

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

  const goToPrevWeek = useCallback(() => { const n = new Date(currentDate); n.setDate(n.getDate() - 7); setCurrentDate(n) }, [currentDate])
  const goToNextWeek = useCallback(() => { const n = new Date(currentDate); n.setDate(n.getDate() + 7); setCurrentDate(n) }, [currentDate])
  const goToToday = useCallback(() => setCurrentDate(new Date()), [])
  const formatMonthYear = () => currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(new Date())
  const getWeekRange = () => {
    const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${weekDates[0].toLocaleDateString('es-ES', o)} - ${weekDates[6].toLocaleDateString('es-ES', o)}`
  }

  const openNewModal = () => setShowNewAppointmentModal(true)
  const closeNewModal = () => {
    setShowNewAppointmentModal(false)
    setWizardStep(1)
    setNewAppointmentData({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
    setClientSearch(''); setServiceSearch(''); setEmployeeSearch('')
    setShowClientDropdown(false); setShowServiceDropdown(false); setShowEmployeeDropdown(false)
    setAvailableSlots([])
  }

  const nextStep = () => { if (wizardStep < 3) setWizardStep(wizardStep + 1) }
  const prevStep = () => { if (wizardStep > 1) setWizardStep(wizardStep - 1) }
  const canStep2 = newAppointmentData.clientId !== ''
  const canStep3 = newAppointmentData.serviceId !== '' && newAppointmentData.employeeId !== ''

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
        setSlotsError('No hay horarios disponibles. Verifica que el empleado tenga disponibilidad configurada para este día.')
      }
    } catch (e) { 
      console.error('[SLOTS] Error:', e)
      setSlotsError('Error al cargar horarios')
    }
    finally { setLoadingSlots(false) }
  }

  const categorizeSlots = (slots: typeof availableSlots) => {
    const m: typeof availableSlots = [], a: typeof availableSlots = []
    slots.forEach(s => { const h = parseInt(s.start_time.split('T')[1].slice(0, 2), 10); (h < 13 ? m : a).push(s) })
    return { morning: m, afternoon: a }
  }
  const { morning: mornSlots, afternoon: aftSlots } = categorizeSlots(availableSlots)

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
      closeNewModal(); setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setIsCreating(false) }
  }

  const handleStatus = async (status: string) => {
    if (!selectedAppointment) return
    setUpdatingStatus(true)
    try {
      const res = await fetch('/api/appointments', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appointment_id: selectedAppointment.id, status }) })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setSelectedAppointment(null); setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setUpdatingStatus(false) }
  }

  const openEdit = () => {
    if (!selectedAppointment) return
    const apt = selectedAppointment as any
    setEditData({ clientId: selectedAppointment.client_id, serviceId: apt?.service?.id || '', employeeId: selectedAppointment.employee_id, date: selectedAppointment.start_time.split('T')[0], time: selectedAppointment.start_time.split('T')[1].slice(0, 5), notes: selectedAppointment.notes || '' })
    setEditSearch({ client: selectedAppointment.client?.name || '', service: apt?.service?.name || '', employee: selectedAppointment.employee?.name || '' })
    setIsEditing(true); setShowTimeWarning(false)
  }

  const closeEdit = () => {
    setIsEditing(false)
    setEditData({ clientId: '', serviceId: '', employeeId: '', date: '', time: '', notes: '' })
    setEditSearch({ client: '', service: '', employee: '' })
    setShowEditDropdowns({ client: false, service: false, employee: false })
    setEditSlots([]); setShowTimeWarning(false)
  }

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

  const handleSaveEdit = async () => {
    if (!selectedAppointment || !editData.clientId || !editData.serviceId || !editData.employeeId || !editData.time) return
    const orig = selectedAppointment.start_time.split('T')[1].slice(0, 5)
    if (orig !== editData.time && !showTimeWarning) { setShowTimeWarning(true); return }
    const startTime = `${editData.date}T${editData.time}:00.000Z`
    setIsSavingEdit(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: selectedAppointment.id, employee_id: editData.employeeId, client_id: editData.clientId, service_id: editData.serviceId, start_time: startTime, notes: editData.notes || null })
      })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      closeEdit(); setSelectedAppointment(null); setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setIsSavingEdit(false); setShowTimeWarning(false) }
  }

  const handleDelete = async () => {
    if (!selectedAppointment) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/appointments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appointment_id: selectedAppointment.id }) })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setShowDeleteConfirm(false); setSelectedAppointment(null); setCurrentDate(new Date(currentDate))
    } catch (e) { console.error(e); alert('Error') }
    finally { setIsDeleting(false) }
  }

  if (loading || !mounted) return (
    <div suppressHydrationWarning className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800" style={{ boxShadow: '0 4px 24px rgba(15,76,92,0.08)' }}>
      {/* Skeleton Header */}
      <div suppressHydrationWarning className="px-6 md:px-8 py-5 md:py-6 flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
        <div className="animate-pulse">
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
      {/* Skeleton Week Days */}
      <div suppressHydrationWarning className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-600">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="py-4 text-center">
            <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2" />
            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
          </div>
        ))}
      </div>
      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 min-h-[500px]">
        {[...Array(7)].map((_, i) => (
          <div suppressHydrationWarning key={i} className={`p-3 border-r border-slate-200 dark:border-slate-600 ${i === 6 ? '' : ''}`}>
            {[...Array(3)].map((_, j) => (
              <div key={j} className="p-3 rounded-xl mb-2 animate-pulse">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-[600px] rounded-2xl" style={{ backgroundColor: COLORS.surface, boxShadow: '0 4px 24px rgba(15,76,92,0.08)' }}>
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COLORS.errorLight }}>
          <Calendar className="w-8 h-8" style={{ color: COLORS.error }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>
            Error
          </h3>
          <p style={{ color: COLORS.textSecondary }} className="text-sm">
            {error}
          </p>
        </div>
        <button 
          onClick={goToToday} 
          className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02]"
          style={{ backgroundColor: COLORS.primary, color: '#FFF', boxShadow: '0 4px 12px rgba(15,76,92,0.25)' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.surface, boxShadow: '0 4px 24px rgba(15,76,92,0.08)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header with gradient */}
      <div className="px-6 md:px-8 py-5 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden" style={{ 
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
      }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="hidden md:block w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold capitalize text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{formatMonthYear()}</h2>
            <p className="text-sm mt-1 text-white/80">{getWeekRange()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 relative z-10">
          <button 
            onClick={goToToday} 
            className="px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-white/20"
            style={{ color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Hoy
          </button>
          <div className="flex rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
            <button 
              onClick={goToPrevWeek} 
              className="p-2.5 transition-colors duration-200 hover:bg-white/20 rounded-l-lg" 
              style={{ backgroundColor: 'transparent' }} 
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <button 
              onClick={goToNextWeek} 
              className="p-2.5 transition-colors duration-200 hover:bg-white/20 rounded-r-lg" 
              style={{ backgroundColor: 'transparent' }} 
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
          {userRole === 'owner' || userRole === 'admin' ? (
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{ backgroundColor: '#FFFFFF', color: COLORS.primary, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva cita</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        {weekDates.map((date, i) => (
          <div 
            key={i} 
            className={`py-3 md:py-4 text-center transition-colors duration-200 ${i !== 6 ? 'border-r' : ''}`}
            style={{ 
              borderColor: COLORS.border, 
              backgroundColor: isToday(date) ? `${COLORS.primary}10` : COLORS.surfaceSubtle 
            }}
          >
            <p className="text-xs font-medium uppercase" style={{ color: COLORS.textMuted }}>
              {date.toLocaleDateString('es-ES', { weekday: 'short' })}
            </p>
            <div 
              className={`inline-flex items-center justify-center mt-1 w-8 h-8 md:w-9 md:h-9 rounded-full transition-all duration-200`}
              style={{ 
                color: isToday(date) ? COLORS.primary : COLORS.textPrimary, 
                fontFamily: 'Cormorant Garamond, serif',
                backgroundColor: isToday(date) ? `${COLORS.primary}20` : 'transparent',
                boxShadow: isToday(date) ? `0 0 0 2px ${COLORS.surface}, 0 0 0 4px ${COLORS.primary}` : 'none'
              }}
            >
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 min-h-[500px]">
        {weekDates.map((date, i) => {
          const dayKey = formatDateKey(date)
          const dayAppts = appointmentsByDay[dayKey] || []
          return (
            <div 
              key={i} 
              className={`${i !== 6 && i !== 0 ? 'md:border-r' : ''} p-3 md:p-3 transition-colors duration-200`}
              style={{ 
                borderColor: COLORS.border, 
                backgroundColor: isToday(date) ? `${COLORS.primary}05` : COLORS.surface 
              }}
            >
              {/* Mobile: Day header */}
              <div className="md:hidden mb-3 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                  {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                </span>
                {isToday(date) && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                    Hoy
                  </span>
                )}
              </div>
              
              {dayAppts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: COLORS.borderLight }}>
                    <Calendar className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Sin citas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayAppts.map((apt, index) => {
                    const st = (STATUS_CONFIG as Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>)[apt.status] || { color: COLORS.textSecondary, bg: COLORS.borderLight, label: apt.status, icon: <Circle className="w-3.5 h-3.5" /> }
                    const clientInitial = apt.client?.name?.charAt(0).toUpperCase() || 'C'
                    return (
                      <button 
                        key={apt.id} 
                        onClick={() => setSelectedAppointment(apt)} 
                        className="w-full text-left p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md group cursor-pointer"
                        style={{ 
                          backgroundColor: st.bg, 
                          border: `1px solid ${st.color}30`, 
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" style={{ color: st.color }} />
                            <span className="text-xs font-bold" style={{ color: st.color }}>{formatTime(apt.start_time)}</span>
                          </div>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: COLORS.isDark ? `${st.color}20` : st.color + '15', color: st.color }}
                          >
                            {apt.service?.name?.slice(0, 10) || 'Servicio'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: COLORS.primary }}
                          >
                            {clientInitial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>{apt.client?.name || 'Cliente'}</p>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: COLORS.textMuted }} />
                              <span className="text-xs truncate" style={{ color: COLORS.textSecondary }}>{apt.employee?.name || 'Empleado'}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer with glassmorphism */}
      <div 
        className="px-6 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-3"
        style={{ 
          borderTop: `1px solid ${COLORS.border}`, 
          backgroundColor: COLORS.glass,
          backdropFilter: 'blur(12px)'
        }}
      >
        <p className="text-sm" style={{ color: COLORS.textSecondary }}>
          <span className="font-semibold" style={{ color: COLORS.textPrimary }}>{appointments.length}</span> cita{appointments.length !== 1 ? 's' : ''} esta semana
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {Object.entries(STATUS_CONFIG).slice(0, 4).map(([s, c]) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: c.color }} 
              />
              <span className="text-xs hidden sm:inline" style={{ color: COLORS.textMuted }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,43,50,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedAppointment(null)}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4" style={{ backgroundColor: COLORS.primary, color: '#FFF' }}><h3 className="text-xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Detalles</h3></div>
            <div className="p-6">
              {(() => { const st = (STATUS_CONFIG as Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }>)[selectedAppointment.status] || { color: COLORS.textSecondary, bg: COLORS.borderLight, label: selectedAppointment.status, icon: <Circle /> }; return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between"><div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.icon}{st.label}</div><span className="text-sm" style={{ color: COLORS.textMuted }}>#{selectedAppointment.id.slice(0, 8)}</span></div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}><div className="flex items-center gap-3 mb-2"><Calendar className="w-5 h-5" style={{ color: COLORS.primary }} /><span className="font-semibold" style={{ color: COLORS.textPrimary }}>Fecha</span></div><p className="text-sm pl-8" style={{ color: COLORS.textSecondary }}>{formatDateTimeFull(selectedAppointment.start_time)}</p></div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}><div className="flex items-center gap-3 mb-2"><User className="w-5 h-5" style={{ color: COLORS.primary }} /><span className="font-semibold" style={{ color: COLORS.textPrimary }}>Cliente</span></div><p className="font-medium pl-8" style={{ color: COLORS.textPrimary }}>{selectedAppointment.client?.name || 'N/A'}</p>{selectedAppointment.client?.phone && <div className="flex items-center gap-2 text-sm pl-8" style={{ color: COLORS.textSecondary }}><Phone className="w-4 h-4" />{selectedAppointment.client.phone}</div>}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}><div className="flex items-center gap-3 mb-2"><Building2 className="w-5 h-5" style={{ color: COLORS.primary }} /><span className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>Profesional</span></div><p className="text-sm font-medium pl-8" style={{ color: COLORS.textSecondary }}>{selectedAppointment.employee?.name || 'N/A'}</p></div>
                    <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}><div className="flex items-center gap-3 mb-2"><Clock className="w-5 h-5" style={{ color: COLORS.primary }} /><span className="font-semibold text-sm" style={{ color: COLORS.textPrimary }}>Servicio</span></div><p className="text-sm font-medium pl-8" style={{ color: COLORS.textSecondary }}>{selectedAppointment.service?.name || 'N/A'}</p></div>
                  </div>
                  {selectedAppointment.notes && <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle }}><div className="flex items-center gap-3 mb-2"><FileText className="w-5 h-5" style={{ color: COLORS.primary }} /><span className="font-semibold" style={{ color: COLORS.textPrimary }}>Notas</span></div><p className="text-sm pl-8" style={{ color: COLORS.textSecondary }}>{selectedAppointment.notes}</p></div>}
                </div>
              )})()}
            </div>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <div className="flex gap-2">
                {userRole === 'empleado' && selectedAppointment.status === 'confirmed' && (
                  <ConfirmationButton
                    appointmentId={selectedAppointment.id}
                    clientName={selectedAppointment.client?.name || 'Cliente'}
                    serviceName={selectedAppointment.service?.name || 'Servicio'}
                    basePrice={selectedAppointment.service?.price || 0}
                    disabled={selectedAppointment.confirmation_status === 'completed' || selectedAppointment.confirmation_status === 'confirmed'}
                    onCompleted={() => { setSelectedAppointment(null); setCurrentDate(new Date(currentDate)) }}
                  />
                )}
                {userRole !== 'empleado' && selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && <><button onClick={() => handleStatus('confirmed')} disabled={updatingStatus || selectedAppointment.status === 'confirmed'} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.success, color: '#FFF', opacity: selectedAppointment.status === 'confirmed' ? 0.5 : 1 }}>Confirmar</button><button onClick={() => handleStatus('cancelled')} disabled={updatingStatus} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.error, color: '#FFF' }}>Cancelar</button></>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: COLORS.error, backgroundColor: COLORS.errorLight }}>Eliminar</button>
                <button onClick={() => setSelectedAppointment(null)} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>Cerrar</button>
                <button onClick={openEdit} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: '#FFF' }}>Editar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal - Wizard */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(8px)' }} onClick={closeNewModal}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-all duration-300" style={{ backgroundColor: COLORS.surface, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 relative overflow-hidden" style={{ 
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
              color: '#FFF' 
            }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Nueva Cita</h3>
                  <button onClick={closeNewModal} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between mb-3">
                  {[1,2,3].map(s => {
                    const isCompleted = wizardStep > s
                    const isActive = wizardStep >= s
                    return (
                      <div key={s} className="flex items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${isActive ? 'bg-white text-[#0F4C5C] shadow-lg' : 'bg-white/20 text-white'}`}>
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-16 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-white' : 'bg-white/30'}`} />}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-white/70">
                  <span className={wizardStep >= 1 ? 'text-white font-medium' : ''}>Cliente</span>
                  <span className={wizardStep >= 2 ? 'text-white font-medium' : ''}>Servicio</span>
                  <span className={wizardStep >= 3 ? 'text-white font-medium' : ''}>Horario</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {wizardStep === 1 && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                      <User className="w-8 h-8" style={{ color: COLORS.primary }} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>¿Para quién?</h4>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>Selecciona el cliente que realizará la reserva</p>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                      Cliente
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 cursor-help" style={{ color: COLORS.textMuted }} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}>
                          Selecciona el cliente que reservó
                        </div>
                      </div>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Buscar cliente..." 
                      value={clientSearch} 
                      onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true) }} 
                      onFocus={() => setShowClientDropdown(true)} 
                      className="w-full px-4 py-3.5 pl-12 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-offset-2" 
                      style={{ 
                        borderColor: showClientDropdown ? COLORS.primary : COLORS.border, 
                        backgroundColor: COLORS.surface, 
                        color: COLORS.textPrimary,
                        boxShadow: showClientDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
                      }} 
                    />
                    <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                  </div>
                  {showClientDropdown && clients.length > 0 && (
                    <div className="relative z-20 mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-56 overflow-y-auto" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => { setNewAppointmentData({...newAppointmentData, clientId: c.id }); setClientSearch(c.name); setShowClientDropdown(false); nextStep() }} 
                          className="w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors duration-150 hover:opacity-80" 
                          style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.phone && <p className="text-xs" style={{ color: COLORS.textMuted }}>{c.phone}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                      <Sparkles className="w-8 h-8" style={{ color: COLORS.primary }} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>¿Qué y quién?</h4>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>Selecciona el servicio y el profesional</p>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                      Servicio
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 cursor-help" style={{ color: COLORS.textMuted }} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}>
                          Elige el tratamiento o servicio
                        </div>
                      </div>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Buscar servicio..." 
                        value={serviceSearch} 
                        onChange={e => { setServiceSearch(e.target.value); setShowServiceDropdown(true) }} 
                        onFocus={() => setShowServiceDropdown(true)} 
                        className="w-full px-4 py-3.5 pl-12 rounded-xl border-2 transition-all duration-200 focus:ring-2" 
                        style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} 
                      />
                      <Sparkles className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                    </div>
                    {showServiceDropdown && (
                      <div className="absolute z-20 w-full mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-48 overflow-y-auto" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                        {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => { setNewAppointmentData({...newAppointmentData, serviceId: s.id, time: ''}); setServiceSearch(s.name); setShowServiceDropdown(false); setAvailableSlots([]) }} 
                            className="w-full px-4 py-3.5 text-left flex items-center justify-between hover:opacity-80 transition-colors" 
                            style={{ color: COLORS.textPrimary }}
                          >
                            <span className="font-medium">{s.name}</span>
                            <span className="text-sm px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}>{s.duration} min</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                      Profesional
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 cursor-help" style={{ color: COLORS.textMuted }} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}>
                          Selecciona quién atenderá
                        </div>
                      </div>
                    </label>
                    <input 
                      type="text" 
                      placeholder="Buscar profesional..." 
                      value={employeeSearch} 
                      onChange={e => { setEmployeeSearch(e.target.value); setShowEmployeeDropdown(true) }} 
                      onFocus={() => setShowEmployeeDropdown(true)} 
                      className="w-full px-4 py-3.5 pl-12 rounded-xl border-2 transition-all duration-200 focus:ring-2" 
                      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} 
                    />
                    <Building2 className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                    {showEmployeeDropdown && (
                      <div className="absolute z-20 w-full mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-48 overflow-y-auto" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                        {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(e => (
                          <button 
                            key={e.id} 
                            onClick={() => { setNewAppointmentData({...newAppointmentData, employeeId: e.id, time: ''}); setEmployeeSearch(e.name); setShowEmployeeDropdown(false); setAvailableSlots([]) }} 
                            className="w-full px-4 py-3.5 text-left flex items-center gap-3 hover:opacity-80 transition-colors" 
                            style={{ color: COLORS.textPrimary }}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                              {e.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{e.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
                      <Calendar className="w-8 h-8" style={{ color: COLORS.primary }} />
                    </div>
                    <h4 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}>¿Cuándo?</h4>
                    <p className="text-sm" style={{ color: COLORS.textSecondary }}>Selecciona el horario disponible</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Fecha</label>
                    <input 
                      type="date" 
                      value={newAppointmentData.date} 
                      min={new Date().toISOString().split('T')[0]} 
                      onChange={e => { setNewAppointmentData({...newAppointmentData, date: e.target.value, time: ''}); setAvailableSlots([]) }} 
                      className="w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200" 
                      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} 
                    />
                  </div>
                  {newAppointmentData.date && newAppointmentData.employeeId && newAppointmentData.serviceId && (
                    <div>
                      {!loadingSlots && availableSlots.length === 0 && (
                        <button 
                          onClick={fetchSlots} 
                          className="w-full px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90" 
                          style={{ backgroundColor: COLORS.primary, color: '#FFF', boxShadow: `0 4px 12px ${COLORS.primary}40` }}
                        >
                          Ver horarios disponibles
                        </button>
                      )}
                      {loadingSlots && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.primary }} />
                        </div>
                      )}
                      {slotsError && (
                        <div className="p-4 rounded-xl border-2" style={{ backgroundColor: COLORS.errorLight, borderColor: COLORS.error }}>
                          <p className="text-sm font-medium" style={{ color: COLORS.error }}>No hay disponibilidad</p>
                          <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{slotsError}</p>
                          <button 
                            onClick={fetchSlots} 
                            className="mt-3 text-xs font-medium underline"
                            style={{ color: COLORS.primary }}
                          >
                            Reintentar
                          </button>
                        </div>
                      )}
                      {availableSlots.length > 0 && (
                        <div className="space-y-4 max-h-72 overflow-y-auto">
                          {mornSlots.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Mañana</span>
                                <div className="group relative">
                                  <HelpCircle className="w-3.5 h-3.5 cursor-help" style={{ color: COLORS.textMuted }} />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}>
                                    Antes de las 13:00
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {mornSlots.filter(s => s.available).map(s => (
                                  <button 
                                    key={s.start_time} 
                                    onClick={() => setNewAppointmentData({...newAppointmentData, time: s.start_time.split('T')[1].slice(0, 5)})}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? 'ring-2 ring-offset-2' : ''}`}
                                    style={{ 
                                      backgroundColor: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? COLORS.primary : COLORS.surfaceSubtle,
                                      color: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? '#FFF' : COLORS.textPrimary,
                                      borderColor: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? COLORS.primary : 'transparent',
                                      boxShadow: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? `0 4px 12px ${COLORS.primary}30` : 'none'
                                    }}
                                  >
                                    {s.start_time.split('T')[1].slice(0, 5)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {aftSlots.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                                <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Tarde</span>
                                <div className="group relative">
                                  <HelpCircle className="w-3.5 h-3.5 cursor-help" style={{ color: COLORS.textMuted }} />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}>
                                    Desde las 13:00 en adelante
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {aftSlots.filter(s => s.available).map(s => (
                                  <button 
                                    key={s.start_time} 
                                    onClick={() => setNewAppointmentData({...newAppointmentData, time: s.start_time.split('T')[1].slice(0, 5)})}
                                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? 'ring-2 ring-offset-2' : ''}`}
                                    style={{ 
                                      backgroundColor: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? COLORS.primary : COLORS.surfaceSubtle,
                                      color: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? '#FFF' : COLORS.textPrimary,
                                      borderColor: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? COLORS.primary : 'transparent',
                                      boxShadow: newAppointmentData.time === s.start_time.split('T')[1].slice(0, 5) ? `0 4px 12px ${COLORS.primary}30` : 'none'
                                    }}
                                  >
                                    {s.start_time.split('T')[1].slice(0, 5)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                      Notas
                      <div className="group relative">
                        <HelpCircle className="w-4 h-4 cursor-help" style={{ color: COLORS.textMuted }} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}>
                          Información adicional (opcional)
                        </div>
                      </div>
                    </label>
                    <textarea 
                      value={newAppointmentData.notes} 
                      onChange={e => setNewAppointmentData({...newAppointmentData, notes: e.target.value})} 
                      className="w-full px-4 py-3.5 rounded-xl border-2 resize-none transition-all duration-200" 
                      rows={3}
                      placeholder="Alguna nota adicional..."
                      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} 
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-5 flex items-center justify-between sticky bottom-0" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
              {wizardStep > 1 ? (
                <button 
                  onClick={prevStep} 
                  className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80 flex items-center gap-2"
                  style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}
                >
                  <ChevronLeft className="w-4 h-4" /> Atrás
                </button>
              ) : (
                <button 
                  onClick={closeNewModal} 
                  className="px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
                  style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}
                >
                  Cancelar
                </button>
              )}
              {wizardStep < 3 ? (
                <button 
                  onClick={nextStep} 
                  disabled={(wizardStep === 1 && !newAppointmentData.clientId) || (wizardStep === 2 && (!newAppointmentData.serviceId || !newAppointmentData.employeeId))} 
                  className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary, color: '#FFF', boxShadow: `0 4px 12px ${COLORS.primary}40` }}
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleCreate} 
                  disabled={!newAppointmentData.time || isCreating} 
                  className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary, color: '#FFF', boxShadow: `0 4px 12px ${COLORS.primary}40` }}
                >
                  {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" />Creando...</> : <><CheckCircle2 className="w-4 h-4" />Crear Cita</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,43,50,0.5)', backdropFilter: 'blur(4px)' }} onClick={closeEdit}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4" style={{ backgroundColor: COLORS.primary, color: '#FFF' }}><div className="flex items-center justify-between"><h3 className="text-xl font-semibold">Editar Cita</h3><button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-white/20"><X className="w-5 h-5" /></button></div></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Cliente</label><input type="text" value={editSearch.client} onChange={e => { setEditSearch({...editSearch, client: e.target.value}); setShowEditDropdowns({...showEditDropdowns, client: true}) }} className="w-full px-4 py-3 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }} />{showEditDropdowns.client && <div className="absolute z-20 w-full mt-2 rounded-xl border overflow-hidden max-h-48 overflow-y-auto" style={{ backgroundColor: COLORS.surface }}>{clients.filter(c => c.name.toLowerCase().includes(editSearch.client.toLowerCase())).map(c => <button key={c.id} onClick={() => { setEditData({...editData, clientId: c.id}); setEditSearch({...editSearch, client: c.name}); setShowEditDropdowns({...showEditDropdowns, client: false}) }} className="w-full px-4 py-3 text-left" style={{ color: COLORS.textPrimary }}>{c.name}</button>)}</div>}</div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Servicio</label><input type="text" value={editSearch.service} onChange={e => { setEditSearch({...editSearch, service: e.target.value}); setShowEditDropdowns({...showEditDropdowns, service: true}) }} className="w-full px-4 py-3 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }} />{showEditDropdowns.service && <div className="absolute z-20 w-full mt-2 rounded-xl border overflow-hidden max-h-48 overflow-y-auto" style={{ backgroundColor: COLORS.surface }}>{services.filter(s => s.name.toLowerCase().includes(editSearch.service.toLowerCase())).map(s => <button key={s.id} onClick={() => { setEditData({...editData, serviceId: s.id, time: ''}); setEditSearch({...editSearch, service: s.name}); setShowEditDropdowns({...showEditDropdowns, service: false}); setEditSlots([]) }} className="w-full px-4 py-3 text-left" style={{ color: COLORS.textPrimary }}>{s.name} ({s.duration} min)</button>)}</div>}</div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Profesional</label><input type="text" value={editSearch.employee} onChange={e => { setEditSearch({...editSearch, employee: e.target.value}); setShowEditDropdowns({...showEditDropdowns, employee: true}) }} className="w-full px-4 py-3 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }} />{showEditDropdowns.employee && <div className="absolute z-20 w-full mt-2 rounded-xl border overflow-hidden max-h-48 overflow-y-auto" style={{ backgroundColor: COLORS.surface }}>{employees.filter(e => e.name.toLowerCase().includes(editSearch.employee.toLowerCase())).map(e => <button key={e.id} onClick={() => { setEditData({...editData, employeeId: e.id, time: ''}); setEditSearch({...editSearch, employee: e.name}); setShowEditDropdowns({...showEditDropdowns, employee: false}); setEditSlots([]) }} className="w-full px-4 py-3 text-left" style={{ color: COLORS.textPrimary }}>{e.name}</button>)}</div>}</div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Fecha</label><input type="date" value={editData.date} min={new Date().toISOString().split('T')[0]} onChange={e => { setEditData({...editData, date: e.target.value, time: ''}); setEditSlots([]); setShowTimeWarning(false) }} className="w-full px-4 py-3 rounded-xl border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} /></div>
              {editData.date && editData.employeeId && editData.serviceId && <div>{!loadingEditSlots && editSlots.length === 0 && <button onClick={fetchEditSlots} className="w-full px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: '#FFF' }}>Ver horarios</button>}{loadingEditSlots && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.primary }} /></div>}{editSlots.length > 0 && <div className="grid grid-cols-4 gap-2">{editSlots.filter(s => s.available).map(s => <button key={s.start_time} onClick={() => { setEditData({...editData, time: s.start_time.split('T')[1].slice(0, 5)}); setShowTimeWarning(false) }} className={`px-2 py-2 rounded-lg text-sm ${editData.time === s.start_time.split('T')[1].slice(0, 5) ? 'ring-2' : ''}`} style={{ backgroundColor: editData.time === s.start_time.split('T')[1].slice(0, 5) ? COLORS.primary : COLORS.surfaceSubtle, color: editData.time === s.start_time.split('T')[1].slice(0, 5) ? '#FFF' : COLORS.textPrimary }}>{s.start_time.split('T')[1].slice(0, 5)}</button>)}</div>}</div>}
              <div><label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>Notas</label><textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border" rows={2} style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }} /></div>{showTimeWarning && <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.warningLight }}><p className="text-sm font-medium" style={{ color: COLORS.warning }}>El horario cambió. ¿Continuar?</p></div>}
            </div>
            <div className="px-6 py-4 flex justify-between sticky bottom-0" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
              <button onClick={closeEdit} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}>Cancelar</button>
              <button onClick={handleSaveEdit} disabled={!editData.clientId || !editData.serviceId || !editData.employeeId || !editData.time || isSavingEdit} className="px-6 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: COLORS.primary, color: '#FFF', opacity: (!editData.clientId || !editData.serviceId || !editData.employeeId || !editData.time || isSavingEdit) ? 0.5 : 1 }}>{isSavingEdit ? <><Loader2 className="w-4 h-4 inline animate-spin" />Guardando...</> : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,43,50,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center"><div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.errorLight }}><AlertCircle className="w-8 h-8" style={{ color: COLORS.error }} /></div><h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>¿Eliminar?</h3><p className="text-sm" style={{ color: COLORS.textSecondary }}>Esta acción no se puede deshacer.</p></div>
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}>Cancelar</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: COLORS.error, color: '#FFF' }}>{isDeleting ? <Loader2 className="w-4 h-4 inline animate-spin" /> : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarView
