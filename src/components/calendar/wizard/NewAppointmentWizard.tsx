'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  User,
  Sparkles,
  Calendar,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  HelpCircle,
  Clock,
  Phone,
  Plus,
  Search,
  Building2,
  FileText,
  AlertTriangle
} from 'lucide-react'
import {
  CalendarColors,
  Employee,
  Client,
  Service,
  TimeSlot,
  NewAppointmentData
} from '@/types/calendar'
import { formatTime, formatDuration, convertTo24Hour, formatDate } from '@/lib/utils/formatTime'
import { createClientAction } from '@/actions/clients/createClient'

interface NewAppointmentWizardProps {
  COLORS: CalendarColors
  wizardStep: number
  newAppointmentData: NewAppointmentData
  clients: Client[]
  services: Service[]
  employees: Employee[]
  availableSlots: TimeSlot[]
  loadingSlots: boolean
  slotsError: string | null
  clientSearch: string
  serviceSearch: string
  employeeSearch: string
  showClientDropdown: boolean
  showServiceDropdown: boolean
  showEmployeeDropdown: boolean
  isCreating: boolean
  organizationId: string
  categorizeSlots: (slots: TimeSlot[]) => { morning: TimeSlot[]; afternoon: TimeSlot[] }
  onNextStep: () => void
  onPrevStep: () => void
  onClose: () => void
  onSetClientSearch: (search: string) => void
  onSetServiceSearch: (search: string) => void
  onSetEmployeeSearch: (search: string) => void
  onSetShowClientDropdown: (show: boolean) => void
  onSetShowServiceDropdown: (show: boolean) => void
  onSetShowEmployeeDropdown: (show: boolean) => void
  onSetNewAppointmentData: (data: Partial<NewAppointmentData>) => void
  onFetchSlots: () => Promise<void>
  onCreate: () => Promise<void>
}

const STEP_LABELS = ['Cliente', 'Servicio', 'Profesional', 'Programar']
const TOTAL_STEPS = 4

export function NewAppointmentWizard({
  COLORS,
  wizardStep,
  newAppointmentData,
  clients,
  services,
  employees,
  availableSlots,
  loadingSlots,
  slotsError,
  clientSearch,
  serviceSearch,
  employeeSearch,
  showClientDropdown,
  showServiceDropdown,
  showEmployeeDropdown,
  isCreating,
  organizationId,
  categorizeSlots,
  onNextStep,
  onPrevStep,
  onClose,
  onSetClientSearch,
  onSetServiceSearch,
  onSetEmployeeSearch,
  onSetShowClientDropdown,
  onSetShowServiceDropdown,
  onSetShowEmployeeDropdown,
  onSetNewAppointmentData,
  onFetchSlots,
  onCreate
}: NewAppointmentWizardProps) {
  const { morning: mornSlots, afternoon: aftSlots } = categorizeSlots(availableSlots)

  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickCreating, setQuickCreating] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)

  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const clientInputRef = useRef<HTMLInputElement>(null)
  const serviceInputRef = useRef<HTMLInputElement>(null)
  const employeeInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  const canGoToStep2 = newAppointmentData.clientId !== ''
  const canGoToStep3 = newAppointmentData.serviceId !== ''
  const canGoToStep4 = newAppointmentData.employeeId !== ''
  const canCreate = newAppointmentData.time !== '' && newAppointmentData.date !== ''

  const selectedClient = useMemo(
    () => clients.find(c => c.id === newAppointmentData.clientId),
    [clients, newAppointmentData.clientId]
  )
  const selectedService = useMemo(
    () => services.find(s => s.id === newAppointmentData.serviceId),
    [services, newAppointmentData.serviceId]
  )
  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === newAppointmentData.employeeId),
    [employees, newAppointmentData.employeeId]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (wizardStep === 1) clientInputRef.current?.focus()
    if (wizardStep === 2) setTimeout(() => serviceInputRef.current?.focus(), 300)
    if (wizardStep === 3) setTimeout(() => employeeInputRef.current?.focus(), 300)
  }, [wizardStep])

  const filteredClients = useMemo(
    () => clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  )

  const showCreateOption = clientSearch.length >= 2 && filteredClients.length === 0 && !showQuickAdd

  const handleNextClick = useCallback(() => {
    if (wizardStep === 1 && canGoToStep2) { setDirection('next'); onNextStep() }
    else if (wizardStep === 2 && canGoToStep3) { setDirection('next'); onNextStep() }
    else if (wizardStep === 3 && canGoToStep4) {
      setDirection('next')
      onNextStep()
      if (!availableSlots.length && newAppointmentData.date && newAppointmentData.employeeId && newAppointmentData.serviceId) {
        onFetchSlots()
      }
    }
  }, [wizardStep, canGoToStep2, canGoToStep3, canGoToStep4, onNextStep, availableSlots.length, newAppointmentData.date, newAppointmentData.employeeId, newAppointmentData.serviceId, onFetchSlots])

  const handleBackClick = useCallback(() => {
    setDirection('prev')
    onPrevStep()
  }, [onPrevStep])

  const handleQuickCreate = async () => {
    if (!quickName.trim()) {
      setQuickError('El nombre es requerido')
      return
    }
    setQuickCreating(true)
    setQuickError(null)
    try {
      const result = await createClientAction({
        organization_id: organizationId,
        name: quickName.trim(),
        phone: quickPhone.trim() || undefined,
        confirmation_method: 'in_person',
        confirmations_enabled: false,
      })
      if (result.error) {
        setQuickError(result.error)
        return
      }
      if (result.clientId) {
        onSetNewAppointmentData({ clientId: result.clientId })
        onSetClientSearch(quickName.trim())
        setShowQuickAdd(false)
        setQuickName('')
        setQuickPhone('')
        setDirection('next')
        onNextStep()
      }
    } catch {
      setQuickError('Error al crear cliente')
    } finally {
      setQuickCreating(false)
    }
  }

  const handleClientSelect = (c: Client) => {
    onSetNewAppointmentData({ clientId: c.id })
    onSetClientSearch(c.name)
    onSetShowClientDropdown(false)
    setDirection('next')
    onNextStep()
  }

  const handleServiceSelect = (s: Service) => {
    onSetNewAppointmentData({ serviceId: s.id, time: '' })
    onSetServiceSearch(s.name)
    onSetShowServiceDropdown(false)
  }

  const handleEmployeeSelect = (e: Employee) => {
    onSetNewAppointmentData({ employeeId: e.id, time: '' })
    onSetEmployeeSearch(e.name)
    onSetShowEmployeeDropdown(false)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const quickDates = useMemo(() => {
    const dates: { label: string; value: string }[] = []
    const now = new Date()
    dates.push({ label: 'Hoy', value: now.toISOString().split('T')[0] })
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    dates.push({ label: 'Mañana', value: tomorrow.toISOString().split('T')[0] })
    for (let i = 2; i <= 6; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' })
      dates.push({ label: dayName, value: d.toISOString().split('T')[0] })
    }
    return dates
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nueva cita"
        className="w-full sm:max-w-xl rounded-2xl overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[90vh] transition-all duration-300"
        style={{
          backgroundColor: COLORS.surface,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header with gradient ── */}
        <div
          className="px-5 sm:px-6 py-4 sm:py-5 relative overflow-hidden flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
            color: '#FFF'
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Nueva Cita
              </h3>
              <button
                ref={closeRef}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-between mb-2">
              {STEP_LABELS.map((label, idx) => {
                const step = idx + 1
                const isCompleted = wizardStep > step
                const isActive = wizardStep === step
                const isFuture = wizardStep < step
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ${
                          isActive
                            ? 'bg-white text-[#0F4C5C] shadow-lg scale-110'
                            : isCompleted
                            ? 'bg-white text-[#0F4C5C]'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                      </div>
                      <span
                        className={`hidden sm:block text-[10px] mt-1 transition-all duration-300 ${
                          isActive || isCompleted ? 'text-white font-medium' : 'text-white/60'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < STEP_LABELS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] sm:mt-[-1.5rem] transition-colors duration-300 ${
                          isCompleted ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
            {/* ===== STEP 1: Cliente ===== */}
            {wizardStep === 1 && (
              <div
                className="space-y-5 animate-in slide-in-from-right-2 duration-200"
                style={{ animationName: direction === 'next' ? 'slideInRight' : 'slideInLeft' }}
              >
                <div className="text-center">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <User className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
                  </div>
                  <h4
                    className="text-lg sm:text-xl font-semibold mb-1"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    ¿Para quién?
                  </h4>
                  <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
                    Selecciona o crea el cliente de la reserva
                  </p>
                </div>

                <div className="relative">
                  <label
                    className="block text-sm font-medium mb-2 flex items-center gap-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    <Search className="w-4 h-4" />
                    Buscar cliente
                  </label>
                  <div className="relative">
                    <input
                      ref={clientInputRef}
                      type="text"
                      placeholder="Nombre del cliente..."
                      value={clientSearch}
                      onChange={e => { onSetClientSearch(e.target.value); onSetShowClientDropdown(true); setShowQuickAdd(false) }}
                      onFocus={() => onSetShowClientDropdown(true)}
                      className="w-full px-4 py-3 sm:py-3.5 pl-11 rounded-xl border-2 transition-all duration-200 focus:outline-none"
                      style={{
                        borderColor: showClientDropdown ? COLORS.primary : COLORS.border,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary,
                        boxShadow: showClientDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
                      }}
                    />
                    <User
                      className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: COLORS.textMuted }}
                    />
                    {clientSearch && (
                      <button
                        onClick={() => { onSetClientSearch(''); onSetShowClientDropdown(false) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                      </button>
                    )}
                  </div>

                  {/* Client dropdown */}
                  {showClientDropdown && (
                    <div
                      className="mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-64 overflow-y-auto"
                      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                    >
                      {filteredClients.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                            Clientes existentes
                          </div>
                          {filteredClients.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleClientSelect(c)}
                              className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150 hover:bg-black/5"
                              style={{ color: COLORS.textPrimary }}
                            >
                              <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                                style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                              >
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{c.name}</p>
                                {c.phone && (
                                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.textMuted }}>
                                    <Phone className="w-3 h-3" /> {c.phone}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.textMuted }} />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Create option */}
                      {showCreateOption && (
                        <button
                          onClick={() => { setShowQuickAdd(true); setQuickName(clientSearch) }}
                          className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 border-t"
                          style={{ borderColor: COLORS.border }}
                        >
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: COLORS.success + '20' }}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.success }} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium" style={{ color: COLORS.success }}>
                              Crear &ldquo;{clientSearch}&rdquo;
                            </p>
                            <p className="text-xs" style={{ color: COLORS.textMuted }}>
                              Cliente nuevo con este nombre
                            </p>
                          </div>
                        </button>
                      )}

                      {!filteredClients.length && !showCreateOption && clientSearch.length >= 2 && (
                        <div className="px-4 py-8 text-center">
                          <User className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                          <p className="text-sm" style={{ color: COLORS.textMuted }}>Escribe para buscar o crear un cliente</p>
                        </div>
                      )}

                      {clientSearch.length < 2 && (
                        <div className="px-4 py-3 text-xs" style={{ color: COLORS.textMuted }}>
                          Escribe al menos 2 caracteres para buscar
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick-add form */}
                {showQuickAdd && (
                  <div
                    className="rounded-xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ borderColor: COLORS.success + '40', backgroundColor: COLORS.success + '08' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
                      <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                        Nuevo cliente
                      </span>
                    </div>
                    <input
                      type="text"
                      value={quickName}
                      onChange={e => setQuickName(e.target.value)}
                      placeholder="Nombre completo *"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{
                        borderColor: COLORS.border,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary,
                        boxShadow: `0 0 0 1px ${COLORS.success}20`,
                      }}
                      autoFocus
                    />
                    <input
                      type="tel"
                      value={quickPhone}
                      onChange={e => setQuickPhone(e.target.value)}
                      placeholder="Teléfono (opcional)"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                    />
                    {quickError && (
                      <p className="text-xs font-medium" style={{ color: COLORS.error }}>{quickError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowQuickAdd(false); setQuickError(null) }}
                        className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleQuickCreate}
                        disabled={quickCreating || !quickName.trim()}
                        className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: COLORS.success,
                          color: '#FFF',
                          opacity: (quickCreating || !quickName.trim()) ? 0.6 : 1
                        }}
                      >
                        {quickCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {quickCreating ? 'Creando...' : 'Crear cliente'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 2: Servicio ===== */}
            {wizardStep === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
                <div className="text-center">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
                  </div>
                  <h4
                    className="text-lg sm:text-xl font-semibold mb-1"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    ¿Qué servicio?
                  </h4>
                  <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
                    Selecciona el tratamiento o servicio
                  </p>
                </div>

                <div className="relative">
                  <label
                    className="block text-sm font-medium mb-2 flex items-center gap-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    <Search className="w-4 h-4" />
                    Servicio
                  </label>
                  <div className="relative">
                    <input
                      ref={serviceInputRef}
                      type="text"
                      placeholder="Buscar servicio..."
                      value={serviceSearch}
                      onChange={e => { onSetServiceSearch(e.target.value); onSetShowServiceDropdown(true) }}
                      onFocus={() => onSetShowServiceDropdown(true)}
                      className="w-full px-4 py-3 sm:py-3.5 pl-11 rounded-xl border-2 transition-all duration-200 focus:outline-none"
                      style={{
                        borderColor: showServiceDropdown ? COLORS.primary : COLORS.border,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary,
                        boxShadow: showServiceDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
                      }}
                    />
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textMuted }} />
                  </div>

                  {showServiceDropdown && (
                    <div
                      className="mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-64 overflow-y-auto"
                      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                    >
                      {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleServiceSelect(s)}
                          className="w-full px-4 py-3 sm:py-3.5 text-left flex items-center justify-between gap-3 transition-colors hover:bg-black/5"
                          style={{ color: COLORS.textPrimary }}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: COLORS.primary + '15' }}
                            >
                              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.primary }} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{s.name}</p>
                              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                                {formatDuration(s.duration)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                              ${s.price.toFixed(2)}
                            </span>
                            <span
                              className="text-xs px-2 py-1 rounded-lg whitespace-nowrap"
                              style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
                            >
                              {formatDuration(s.duration)}
                            </span>
                          </div>
                        </button>
                      ))}
                      {services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                          <p className="text-sm" style={{ color: COLORS.textMuted }}>No se encontraron servicios</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected service chip */}
                {selectedService && !showServiceDropdown && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '08' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '20' }}>
                      <Sparkles className="w-4 h-4" style={{ color: COLORS.primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>{selectedService.name}</p>
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        {formatDuration(selectedService.duration)} &middot; ${selectedService.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => { onSetNewAppointmentData({ serviceId: '' }); onSetServiceSearch('') }}
                      className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                    >
                      <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 3: Profesional ===== */}
            {wizardStep === 3 && (
              <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
                <div className="text-center">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <Building2 className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
                  </div>
                  <h4
                    className="text-lg sm:text-xl font-semibold mb-1"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    ¿Quién lo hará?
                  </h4>
                  <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
                    Selecciona el profesional
                  </p>
                </div>

                <div className="relative">
                  <label
                    className="block text-sm font-medium mb-2 flex items-center gap-2"
                    style={{ color: COLORS.textPrimary }}
                  >
                    <Search className="w-4 h-4" />
                    Profesional
                  </label>
                  <div className="relative">
                    <input
                      ref={employeeInputRef}
                      type="text"
                      placeholder="Buscar profesional..."
                      value={employeeSearch}
                      onChange={e => { onSetEmployeeSearch(e.target.value); onSetShowEmployeeDropdown(true) }}
                      onFocus={() => onSetShowEmployeeDropdown(true)}
                      className="w-full px-4 py-3 sm:py-3.5 pl-11 rounded-xl border-2 transition-all duration-200 focus:outline-none"
                      style={{
                        borderColor: showEmployeeDropdown ? COLORS.primary : COLORS.border,
                        backgroundColor: COLORS.surface,
                        color: COLORS.textPrimary,
                        boxShadow: showEmployeeDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
                      }}
                    />
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textMuted }} />
                  </div>

                  {showEmployeeDropdown && (
                    <div
                      className="mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-64 overflow-y-auto"
                      style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                    >
                      {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).map(e => (
                        <button
                          key={e.id}
                          onClick={() => handleEmployeeSelect(e)}
                          className="w-full px-4 py-3 sm:py-3.5 text-left flex items-center gap-3 transition-colors hover:bg-black/5"
                          style={{ color: COLORS.textPrimary }}
                        >
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                            style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                          >
                            {e.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{e.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.textMuted }} />
                        </button>
                      ))}
                      {employees.filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                          <p className="text-sm" style={{ color: COLORS.textMuted }}>No se encontraron profesionales</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected employee chip */}
                {selectedEmployee && !showEmployeeDropdown && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-2"
                    style={{ borderColor: COLORS.primary + '30', backgroundColor: COLORS.primary + '08' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                    >
                      {selectedEmployee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.textPrimary }}>{selectedEmployee.name}</p>
                    </div>
                    <button
                      onClick={() => { onSetNewAppointmentData({ employeeId: '' }); onSetEmployeeSearch('') }}
                      className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                    >
                      <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 4: Programar + Resumen ===== */}
            {wizardStep === 4 && (
              <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
                <div className="text-center">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary + '15' }}
                  >
                    <Calendar className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
                  </div>
                  <h4
                    className="text-lg sm:text-xl font-semibold mb-1"
                    style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    ¿Cuándo?
                  </h4>
                  <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
                    Selecciona fecha, horario y añade notas
                  </p>
                </div>

                {/* Quick date chips */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                    Fecha rápida
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                    {quickDates.map(qd => {
                      const isSelected = newAppointmentData.date === qd.value
                      return (
                        <button
                          key={qd.value}
                          onClick={() => { onSetNewAppointmentData({ date: qd.value, time: '' }) }}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-offset-2' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSubtle,
                            color: isSelected ? '#FFF' : COLORS.textPrimary,
                            borderColor: isSelected ? COLORS.primary : COLORS.border,
                            boxShadow: isSelected ? `0 4px 12px ${COLORS.primary}30` : 'none'
                          }}
                        >
                          {qd.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date picker */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                    O elige una fecha
                  </label>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={newAppointmentData.date}
                    min={todayStr}
                    onChange={e => onSetNewAppointmentData({ date: e.target.value, time: '' })}
                    className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2"
                    style={{
                      borderColor: COLORS.border,
                      backgroundColor: COLORS.surface,
                      color: COLORS.textPrimary
                    }}
                  />
                </div>

                {/* Available slots */}
                {newAppointmentData.date && newAppointmentData.employeeId && newAppointmentData.serviceId && (
                  <div>
                    {!loadingSlots && availableSlots.length === 0 && (
                      <button
                        onClick={onFetchSlots}
                        className="w-full px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
                        style={{
                          backgroundColor: COLORS.primary,
                          color: '#FFF',
                          boxShadow: `0 4px 12px ${COLORS.primary}40`
                        }}
                      >
                        <Clock className="w-4 h-4" />
                        Ver horarios disponibles
                      </button>
                    )}

                    {loadingSlots && (
                      <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.primary }} />
                        <span className="text-sm" style={{ color: COLORS.textMuted }}>Buscando horarios...</span>
                      </div>
                    )}

                    {slotsError && !loadingSlots && (
                      <div
                        className="rounded-xl border-2 p-4"
                        style={{
                          backgroundColor: COLORS.warningLight,
                          borderColor: COLORS.warning + '40'
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.warning }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>Sin disponibilidad</p>
                            <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{slotsError}</p>
                            <button
                              onClick={onFetchSlots}
                              className="mt-3 text-xs font-semibold underline"
                              style={{ color: COLORS.primary }}
                            >
                              Reintentar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {availableSlots.length > 0 && (
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                        {mornSlots.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 pb-1" style={{ backgroundColor: COLORS.surface }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
                              <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                                Mañana
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textMuted }}>
                                Antes de 1 PM
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {mornSlots.filter(s => s.available).map((s, idx) => {
                                const isSelected = newAppointmentData.time === formatTime(s.start_time)
                                return (
                                  <button
                                    key={s.start_time}
                                    onClick={() => onSetNewAppointmentData({ time: formatTime(s.start_time) })}
                                    className={`relative px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                      isSelected ? 'ring-2 ring-offset-2' : 'hover:scale-[1.02]'
                                    }`}
                                    style={{
                                      backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSubtle,
                                      color: isSelected ? '#FFF' : COLORS.textPrimary,
                                      border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                                      boxShadow: isSelected ? `0 4px 12px ${COLORS.primary}30` : 'none',
                                      animationDelay: `${idx * 50}ms`,
                                    }}
                                  >
                                    <span className="font-semibold">{formatTime(s.start_time)}</span>
                                    {isSelected && (
                                      <CheckCircle2 className="w-3.5 h-3.5 absolute -top-1 -right-1 text-white" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {aftSlots.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 pb-1" style={{ backgroundColor: COLORS.surface }}>
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
                              <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                                Tarde
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS.surfaceHover, color: COLORS.textMuted }}>
                                Desde 1 PM
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {aftSlots.filter(s => s.available).map((s, idx) => {
                                const isSelected = newAppointmentData.time === formatTime(s.start_time)
                                return (
                                  <button
                                    key={s.start_time}
                                    onClick={() => onSetNewAppointmentData({ time: formatTime(s.start_time) })}
                                    className={`relative px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                      isSelected ? 'ring-2 ring-offset-2' : 'hover:scale-[1.02]'
                                    }`}
                                    style={{
                                      backgroundColor: isSelected ? COLORS.primary : COLORS.surfaceSubtle,
                                      color: isSelected ? '#FFF' : COLORS.textPrimary,
                                      border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                                      boxShadow: isSelected ? `0 4px 12px ${COLORS.primary}30` : 'none',
                                      animationDelay: `${idx * 50}ms`,
                                    }}
                                  >
                                    <span className="font-semibold">{formatTime(s.start_time)}</span>
                                    {isSelected && (
                                      <CheckCircle2 className="w-3.5 h-3.5 absolute -top-1 -right-1 text-white" />
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                            <span className="text-xs" style={{ color: COLORS.textSecondary }}>Seleccionado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.surfaceHover, border: `1px solid ${COLORS.border}` }} />
                            <span className="text-xs" style={{ color: COLORS.textSecondary }}>Disponible</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                    <FileText className="w-4 h-4" />
                    Notas
                    <span className="text-xs font-normal" style={{ color: COLORS.textMuted }}>(opcional)</span>
                  </label>
                  <textarea
                    ref={notesRef}
                    value={newAppointmentData.notes}
                    onChange={e => onSetNewAppointmentData({ notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 resize-none transition-all duration-200 focus:outline-none focus:ring-2 text-sm"
                    rows={3}
                    placeholder="Alguna nota adicional para la cita..."
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                  />
                </div>

                {/* Summary Card */}
                <div
                  className="rounded-xl border-2 p-4 space-y-3"
                  style={{ borderColor: COLORS.primary + '20', backgroundColor: COLORS.primary + '08' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.primary }}>
                    Resumen de la cita
                  </p>
                  <div className="space-y-2">
                    {selectedClient && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                        >
                          {selectedClient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                            {selectedClient.name}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Cliente</p>
                        </div>
                      </div>
                    )}
                    {selectedService && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: COLORS.primary + '15' }}
                        >
                          <Sparkles className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                            {selectedService.name}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>
                            {formatDuration(selectedService.duration)} &middot; ${selectedService.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedEmployee && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                        >
                          {selectedEmployee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                            {selectedEmployee.name}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>Profesional</p>
                        </div>
                      </div>
                    )}
                    {newAppointmentData.date && newAppointmentData.time && (
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: COLORS.primary + '15' }}
                        >
                          <Clock className="w-3.5 h-3.5" style={{ color: COLORS.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: COLORS.textPrimary }}>
                            {newAppointmentData.time} &middot; {formatDate(newAppointmentData.date, { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p className="text-xs" style={{ color: COLORS.textMuted } }>Fecha y hora</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-5 sm:px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}
        >
          {wizardStep > 1 ? (
            <button
              onClick={handleBackClick}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:opacity-80"
              style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}
            >
              Cancelar
            </button>
          )}

          {wizardStep < TOTAL_STEPS ? (
            <button
              ref={nextRef}
              onClick={handleNextClick}
              disabled={(wizardStep === 1 && !canGoToStep2) || (wizardStep === 2 && !canGoToStep3) || (wizardStep === 3 && !canGoToStep4)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.primary,
                color: '#FFF',
                boxShadow: `0 4px 12px ${COLORS.primary}40`
              }}
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onCreate}
              disabled={!canCreate || isCreating}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.success,
                color: '#FFF',
                boxShadow: `0 4px 12px ${COLORS.success}40`
              }}
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Crear Cita</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
