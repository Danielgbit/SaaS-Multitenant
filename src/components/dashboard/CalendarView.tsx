'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { setupAppointmentsRealtime } from '@/components/providers/AppointmentRealtimeProvider'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
} from 'lucide-react'
import { Spinner } from '@/components/ui'
import {
  Employee,
  Client,
  Service,
  AppointmentWithDetails,
  CalendarViewProps,
} from '@/types/calendar'
import { useAppointmentModal } from '@/components/providers/AppointmentModalProvider'
import { useCalendarFilters } from '@/hooks/useCalendarFilters'
import { AppointmentList } from '@/components/calendar/AppointmentList'
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar'
import { formatTime, convertTo24Hour } from '@/lib/utils/formatTime'
import { useThemeColors } from '@/hooks/useThemeColors'
import { toast } from 'sonner'
import { useCalendarModals } from '@/hooks/calendar/useCalendarModals'
import { useCalendarMutations } from '@/hooks/calendar/useCalendarMutations'
import { useAppointmentForm } from '@/hooks/calendar/useAppointmentForm'
import { ConfirmActionModal } from '@/components/calendar/ConfirmActionModal'

const NewAppointmentWizard = dynamic(
  () => import('@/components/calendar/wizard/NewAppointmentWizard').then(m => ({ default: m.NewAppointmentWizard })),
  { ssr: false }
)

const EditAppointmentModal = dynamic(
  () => import('@/components/calendar/EditAppointmentModal').then(m => ({ default: m.EditAppointmentModal })),
  { ssr: false }
)

const AppointmentDetailModal = dynamic(
  () => import('@/components/calendar/AppointmentDetailModal').then(m => ({ default: m.AppointmentDetailModal })),
  { ssr: false }
)

const PurgeModal = dynamic(
  () => import('@/components/calendar/PurgeModal').then(m => ({ default: m.PurgeModal })),
  { ssr: false }
)

export function CalendarView({ organizationId, userRole }: CalendarViewProps) {
  const COLORS = useThemeColors()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showScheduleWarning, setShowScheduleWarning] = useState(true)

  useEffect(() => {
    setMounted(true)
}, [])

  const STATUS_CONFIG = useMemo(() => ({
    confirmed: { color: COLORS.success, bg: COLORS.successLight || '', label: 'Confirmada', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    pending: { color: COLORS.warning, bg: COLORS.warningLight || '', label: 'Pendiente', icon: <AlertCircle className="w-3.5 h-3.5" /> },
    cancelled: { color: COLORS.error, bg: COLORS.errorLight || '', label: 'Cancelada', icon: <XCircle className="w-3.5 h-3.5" /> },
    completed: { color: COLORS.textSecondary, bg: COLORS.borderLight || '', label: 'Completada', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  }), [COLORS])

  const EMPLOYEE_COLORS = [
    '#0F4C5C', '#38BDF8', '#16A34A', '#EA580C', '#8B5CF6',
    '#EC4899', '#F59E0B', '#06B6D4', '#84CC16', '#F43F5E'
  ]

  const modals = useCalendarModals()
  const form = useAppointmentForm(organizationId)
  const mutations = useCalendarMutations(organizationId, {
    onSuccess: () => setCurrentDate(new Date(currentDate)),
    selectedAppointment: modals.selectedAppointment,
    newAppointmentData: form.newAppointmentData,
    editData: form.editData,
    convertTo24Hour,
  })

  const { selectedAppointmentId, closeModal } = useAppointmentModal()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Employee filter hook
  const {
    selectedEmployeeId,
    setSelectedEmployeeId,
    filteredAppointments,
    employeesWithLoad,
    totalAppointments,
    visibleAppointmentsCount
  } = useCalendarFilters({
    organizationId,
    userRole: userRole || 'empleado',
    employees,
    appointments
  })

  const employeeColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    employees.forEach((emp, idx) => {
      map[emp.id] = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length]
    })
    return map
  }, [employees])

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
  const formatDateTimeFull = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const fetchAppointmentsData = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const startDate = formatDateKey(weekDates[0])
      const endDate = formatDateKey(weekDates[6])
      const [aptRes, empRes, cliRes, srvRes] = await Promise.all([
        supabase.from('appointments').select(`
          *,
          appointment_services(
            service_id,
            services(name, price, duration)
          )
        `).eq('organization_id', organizationId).gte('start_time', `${startDate}T00:00:00.000Z`).lte('start_time', `${endDate}T23:59:59.999Z`).order('start_time'),
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
        service: (apt.appointment_services as any[])?.[0]?.services ?? undefined
      }))
      setAppointments(withDetails)
      setEmployees(empRes.data ?? [])
      setClients(cliRes.data ?? [])
      setServices(srvRes.data ?? [])
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar')
    } finally { setLoading(false) }
  }, [organizationId, currentDate, supabase, weekDates])

  useEffect(() => {
    fetchAppointmentsData()
  }, [fetchAppointmentsData])

  useEffect(() => {
    if (!organizationId) return

    const cleanup = setupAppointmentsRealtime(
      organizationId,
      ({ eventType, new: updatedApt, old: oldApt }) => {
        if (eventType === 'UPDATE' && updatedApt) {
          setAppointments(prev => {
            if (!prev.find(apt => apt.id === updatedApt.id)) return prev
            return prev.map(apt =>
              apt.id === updatedApt.id
                ? { ...apt, ...updatedApt }
                : apt
            )
          })
        }
        if (eventType === 'INSERT' && updatedApt) {
          setAppointments(prev => {
            const exists = prev.find(apt => apt.id === updatedApt.id)
            if (exists) return prev
            return [...prev, updatedApt]
          })
        }
        if (eventType === 'DELETE' && oldApt) {
          setAppointments(prev => prev.filter(apt => apt.id !== oldApt.id))
        }
      }
    )

    return cleanup
  }, [organizationId])

  useEffect(() => {
    if (selectedAppointmentId && appointments.length > 0) {
      const apt = appointments.find(a => a.id === selectedAppointmentId)
      if (apt) {
        modals.setSelectedAppointment(apt)
      }
    }
  }, [selectedAppointmentId, appointments])

  useEffect(() => {
    const apt = modals.selectedAppointment
    if (apt) {
      const found = appointments.find(a => a.id === apt.id)
      if (!found) {
        modals.setSelectedAppointment(null)
      }
    }
  }, [appointments])

  const handleCloseAppointmentModal = () => {
    modals.setSelectedAppointment(null)
    closeModal()
  }

  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, AppointmentWithDetails[]> = {}
    weekDates.forEach(d => { grouped[formatDateKey(d)] = [] })
    filteredAppointments.forEach(apt => {
      const key = formatDateKey(new Date(apt.start_time))
      if (grouped[key]) grouped[key].push(apt)
    })
    return grouped
  }, [filteredAppointments, weekDates])

  const goToPrevWeek = useCallback(() => { const n = new Date(currentDate); n.setDate(n.getDate() - 7); setCurrentDate(n) }, [currentDate])
  const goToNextWeek = useCallback(() => { const n = new Date(currentDate); n.setDate(n.getDate() + 7); setCurrentDate(n) }, [currentDate])
  const goToToday = useCallback(() => setCurrentDate(new Date()), [])
  const formatMonthYear = () => currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const isToday = (d: Date) => formatDateKey(d) === formatDateKey(new Date())
  const getWeekRange = () => {
    const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${weekDates[0].toLocaleDateString('es-ES', o)} - ${weekDates[6].toLocaleDateString('es-ES', o)}`
  }

  const handleCreate = async () => {
    await mutations.handleCreate()
    if (!mutations.isCreating) {
      form.resetNewForm()
      modals.setShowNewAppointmentModal(false)
    }
  }

  const handleStatus = mutations.handleStatus

  const openEdit = () => {
    if (!modals.selectedAppointment) return
    const apt = modals.selectedAppointment as any
    form.setEditData({
      clientId: modals.selectedAppointment.client_id,
      serviceId: apt?.service?.id || '',
      employeeId: modals.selectedAppointment.employee_id,
      date: modals.selectedAppointment.start_time.split('T')[0],
      time: formatTime(modals.selectedAppointment.start_time),
      notes: modals.selectedAppointment.notes || '',
    })
    form.setEditSearch({
      client: modals.selectedAppointment.client?.name || '',
      service: apt?.service?.name || '',
      employee: modals.selectedAppointment.employee?.name || '',
    })
    form.setShowTimeWarning(false)
  }

  const closeEdit = () => { form.resetEditForm() }

  const handleAdminConfirmService = (apt: AppointmentWithDetails) => {
    modals.setPendingConfirmService(apt)
    modals.setShowConfirmServiceModal(true)
  }

  const confirmServiceFromModal = async (reason?: string) => {
    if (!modals.pendingConfirmService) return
    await mutations.confirmServiceFromModal(reason)
    if (!mutations.updatingStatus) {
      modals.setShowConfirmServiceModal(false)
      modals.setPendingConfirmService(null)
    }
  }

  const handleConfirmAppointment = (apt: AppointmentWithDetails) => {
    modals.setPendingConfirmAppointment(apt)
    modals.setShowConfirmAppointmentModal(true)
  }

  const confirmAppointmentFromModal = async () => {
    if (!modals.pendingConfirmAppointment) return
    modals.setSelectedAppointment(modals.pendingConfirmAppointment)
    await mutations.confirmAppointmentFromModal()
    if (!mutations.updatingStatus) {
      modals.setShowConfirmAppointmentModal(false)
      modals.setPendingConfirmAppointment(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!modals.selectedAppointment || !form.editData.clientId || !form.editData.serviceId || !form.editData.employeeId || !form.editData.time) return
    const orig = formatTime(modals.selectedAppointment.start_time)
    if (orig !== form.editData.time && !form.showTimeWarning) { form.setShowTimeWarning(true); return }
    const success = await mutations.handleSaveEdit()
    if (success) { closeEdit(); modals.setSelectedAppointment(null) }
  }

  const handleDelete = async () => {
    await mutations.handleDelete()
    if (!mutations.isDeleting) {
      modals.setShowDeleteConfirm(false)
      modals.setSelectedAppointment(null)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.surface, boxShadow: '0 4px 24px rgba(15,76,92,0.08)' }}>
      <CalendarToolbar
        COLORS={COLORS}
        weekDates={weekDates}
        employeesWithLoad={employeesWithLoad}
        selectedEmployeeId={selectedEmployeeId}
        userRole={userRole || ''}
        showScheduleWarning={showScheduleWarning}
        totalAppointments={totalAppointments}
        formatMonthYear={formatMonthYear}
        getWeekRange={getWeekRange}
        isToday={isToday}
        goToPrevWeek={goToPrevWeek}
        goToNextWeek={goToNextWeek}
        goToToday={goToToday}
        setSelectedEmployeeId={setSelectedEmployeeId}
        onNewAppointment={() => modals.setShowNewAppointmentModal(true)}
        onDismissWarning={() => setShowScheduleWarning(false)}
        onConfigureSchedule={() => router.push('/horarios')}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 md:min-h-[500px]">
        {weekDates.map((date, i) => {
          const dayKey = formatDateKey(date)
          const dayAppts = appointmentsByDay[dayKey] || []
          return (
            <div 
              key={i} 
              className={`${i !== 6 && i !== 0 ? 'md:border-r' : ''} p-2 md:p-4 transition-colors duration-200`}
              style={{ 
                borderColor: COLORS.border, 
                backgroundColor: isToday(date) ? `${COLORS.primary}05` : COLORS.surface 
              }}
            >
              {/* Mobile: Day header */}
              <div className="md:hidden mb-2 flex items-center justify-between">
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
                <div className="flex flex-col items-center justify-center h-full py-4 sm:py-10">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: COLORS.borderLight }}>
                    <Calendar className="w-5 h-5" style={{ color: COLORS.textMuted }} />
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Sin citas</p>
                </div>
              ) : (
                <AppointmentList
                  appointments={dayAppts}
                  COLORS={COLORS}
                  STATUS_CONFIG={STATUS_CONFIG}
                  formatTime={formatTime}
                  onAppointmentClick={modals.setSelectedAppointment}
                  showEmployeeDot={selectedEmployeeId === 'all'}
                  employeeColors={employeeColorMap}
                  isAllEmployees={selectedEmployeeId === 'all'}
                />
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
          {selectedEmployeeId === 'all' ? (
            <>
              <span className="font-semibold" style={{ color: COLORS.textPrimary }}>{visibleAppointmentsCount}</span> de {totalAppointments} cita{totalAppointments !== 1 ? 's' : ''} esta semana
            </>
          ) : (
            <>
              <span className="font-semibold" style={{ color: COLORS.textPrimary }}>{visibleAppointmentsCount}</span> cita{visibleAppointmentsCount !== 1 ? 's' : ''} esta semana
            </>
          )}
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
          {/* Purge button */}
          {mounted && (
            <button
              onClick={() => modals.setShowPurgeModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-[1.02] hover:brightness-110 cursor-pointer"
              style={{
                backgroundColor: COLORS.warning + '14',
                border: `1px solid ${COLORS.warning}30`,
                color: COLORS.warning,
              }}
              aria-label="Limpiar citas completadas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AppointmentDetailModal
        appointment={modals.selectedAppointment}
        COLORS={COLORS}
        STATUS_CONFIG={STATUS_CONFIG}
        userRole={userRole || ''}
        updatingStatus={mutations.updatingStatus}
        formatTime={formatTime}
        onClose={handleCloseAppointmentModal}
        onConfirmAppointment={() => modals.selectedAppointment && handleConfirmAppointment(modals.selectedAppointment)}
        onAdminConfirmService={() => modals.selectedAppointment && handleAdminConfirmService(modals.selectedAppointment)}
        onDelete={() => modals.setShowDeleteConfirm(true)}
        onEdit={openEdit}
        onCompleted={() => { modals.setSelectedAppointment(null); setCurrentDate(new Date(currentDate)) }}
        organizationId={organizationId}
      />

      {/* New Appointment Modal - Wizard */}
      {modals.showNewAppointmentModal && (
        <NewAppointmentWizard
          COLORS={COLORS}
          wizardStep={form.wizardStep}
          newAppointmentData={form.newAppointmentData}
          clients={clients}
          services={services}
          employees={employees}
          availableSlots={form.availableSlots}
          loadingSlots={form.loadingSlots}
          slotsError={form.slotsError}
          clientSearch={form.clientSearch}
          serviceSearch={form.serviceSearch}
          employeeSearch={form.employeeSearch}
          showClientDropdown={form.showClientDropdown}
          showServiceDropdown={form.showServiceDropdown}
          showEmployeeDropdown={form.showEmployeeDropdown}
          isCreating={mutations.isCreating}
          organizationId={organizationId}
          onNextStep={form.nextStep}
          onPrevStep={form.prevStep}
          onClose={() => { modals.setShowNewAppointmentModal(false); form.resetNewForm() }}
          onSetClientSearch={form.setClientSearch}
          onSetServiceSearch={form.setServiceSearch}
          onSetEmployeeSearch={form.setEmployeeSearch}
          onSetShowClientDropdown={form.setShowClientDropdown}
          onSetShowServiceDropdown={form.setShowServiceDropdown}
          onSetShowEmployeeDropdown={form.setShowEmployeeDropdown}
          onSetNewAppointmentData={(data) => form.setNewAppointmentData({...form.newAppointmentData, ...data})}
          onFetchSlots={form.fetchSlots}
          onCreate={handleCreate}
        />
      )}

      {/* Edit Modal */}
      <EditAppointmentModal
        isEditing={form.editData.clientId !== ''}
        editData={form.editData}
        editSearch={form.editSearch}
        showEditDropdowns={form.showEditDropdowns}
        editSlots={form.editSlots}
        loadingEditSlots={form.loadingEditSlots}
        showTimeWarning={form.showTimeWarning}
        isSavingEdit={mutations.isSavingEdit}
        clients={clients}
        services={services}
        employees={employees}
        COLORS={COLORS}
        formatTime={formatTime}
        onClose={closeEdit}
        onSetEditData={(data) => form.setEditData({...form.editData, ...data})}
        onSetEditSearch={(data) => form.setEditSearch({...form.editSearch, ...data})}
        onSetShowEditDropdowns={(d) => form.setShowEditDropdowns({...form.showEditDropdowns, ...d})}
        onFetchEditSlots={form.fetchEditSlots}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirm */}
      {modals.showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,43,50,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => modals.setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: COLORS.surface, boxShadow: '0 24px 48px rgba(15,76,92,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center"><div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: COLORS.errorLight }}><AlertCircle className="w-8 h-8" style={{ color: COLORS.error }} /></div><h3 className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>¿Eliminar?</h3><p className="text-sm" style={{ color: COLORS.textSecondary }}>Esta acción no se puede deshacer.</p></div>
            <div className="px-6 py-4 flex gap-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
              <button onClick={() => modals.setShowDeleteConfirm(false)} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}>Cancelar</button>
              <button onClick={handleDelete} disabled={mutations.isDeleting} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: COLORS.error, color: '#FFF' }}>{mutations.isDeleting ? <Spinner size="sm" className="inline" /> : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modals (service + appointment) */}
      <ConfirmActionModal
        isOpen={modals.showConfirmServiceModal}
        title="Confirmar Servicio"
        description="El empleado no ha confirmado el servicio. ¿Estás seguro que fue realizado?"
        note="Esta acción quedará registrada en el historial."
        placeholder="Razón (opcional): Ej: Empleado se fue temprano"
        confirmLabel="Confirmar Servicio"
        iconColor={COLORS.warning}
        iconBg={COLORS.warningLight || '#FEF3C7'}
        confirmBg={COLORS.warning}
        loading={mutations.updatingStatus}
        COLORS={COLORS}
        onConfirm={confirmServiceFromModal}
        onClose={() => { modals.setShowConfirmServiceModal(false); modals.setPendingConfirmService(null) }}
      />

      <ConfirmActionModal
        isOpen={modals.showConfirmAppointmentModal}
        title="Confirmar Cita"
        description="El cliente no ha confirmado la cita. ¿Estás seguro que el cliente asistirá?"
        note="Esta acción quedará registrada en el historial."
        placeholder="Razón (opcional): Ej: Cliente llamó para confirmar"
        confirmLabel="Confirmar Cita"
        iconColor={COLORS.warning}
        iconBg={COLORS.warningLight || '#FEF3C7'}
        confirmBg={COLORS.success}
        loading={mutations.updatingStatus}
        COLORS={COLORS}
        onConfirm={confirmAppointmentFromModal}
        onClose={() => { modals.setShowConfirmAppointmentModal(false); modals.setPendingConfirmAppointment(null) }}
      />
      {modals.showPurgeModal && (
        <PurgeModal
          organizationId={organizationId}
          initialTab="selection"
          onClose={() => modals.setShowPurgeModal(false)}
          onSuccess={() => {
            fetchAppointmentsData()
            setTimeout(() => {
              modals.setShowPurgeModal(false)
            }, 2000)
          }}
        />
      )}
    </div>
  )
}

export default CalendarView
