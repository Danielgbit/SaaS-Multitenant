'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Spinner } from '@/components/ui'
import type { CalendarColors, Employee, Client, Service, TimeSlot, NewAppointmentData } from '@/types/calendar'
import { WizardHeader } from './WizardHeader'
import { StepClient } from './StepClient'
import { StepService } from './StepService'
import { StepEmployee } from './StepEmployee'
import { StepSchedule } from './StepSchedule'

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
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const modalRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const clientInputRef = useRef<HTMLInputElement>(null)

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
  }, [wizardStep])

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

  const handleClientSelect = (c: Client) => {
    onSetNewAppointmentData({ clientId: c.id })
    onSetClientSearch(c.name)
    onSetShowClientDropdown(false)
    setDirection('next')
    onNextStep()
  }

  const handleQuickCreated = (clientId: string, clientName: string) => {
    onSetNewAppointmentData({ clientId })
    onSetClientSearch(clientName)
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
        <WizardHeader
          COLORS={COLORS}
          currentStep={wizardStep}
          totalSteps={TOTAL_STEPS}
          stepLabels={STEP_LABELS}
          onClose={onClose}
          closeRef={closeRef}
        />

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
            {/* ===== STEP 1: Cliente ===== */}
            {wizardStep === 1 && (
              <StepClient
                COLORS={COLORS}
                clientSearch={clientSearch}
                showClientDropdown={showClientDropdown}
                clients={clients}
                organizationId={organizationId}
                clientInputRef={clientInputRef}
                onSetClientSearch={onSetClientSearch}
                onSetShowClientDropdown={onSetShowClientDropdown}
                onClientSelected={handleClientSelect}
                onClientCreated={handleQuickCreated}
              />
            )}

            {/* ===== STEP 2: Servicio ===== */}
            {wizardStep === 2 && (
              <StepService
                COLORS={COLORS}
                serviceSearch={serviceSearch}
                showServiceDropdown={showServiceDropdown}
                selectedService={selectedService}
                services={services}
                onSetServiceSearch={onSetServiceSearch}
                onSetShowServiceDropdown={onSetShowServiceDropdown}
                onSelect={handleServiceSelect}
                onClear={() => { onSetNewAppointmentData({ serviceId: '' }); onSetServiceSearch('') }}
              />
            )}

            {/* ===== STEP 3: Profesional ===== */}
            {wizardStep === 3 && (
              <StepEmployee
                COLORS={COLORS}
                employeeSearch={employeeSearch}
                showEmployeeDropdown={showEmployeeDropdown}
                selectedEmployee={selectedEmployee}
                employees={employees}
                onSetEmployeeSearch={onSetEmployeeSearch}
                onSetShowEmployeeDropdown={onSetShowEmployeeDropdown}
                onSelect={handleEmployeeSelect}
                onClear={() => { onSetNewAppointmentData({ employeeId: '' }); onSetEmployeeSearch('') }}
              />
            )}

            {/* ===== STEP 4: Programar + Resumen ===== */}
            {wizardStep === 4 && (
              <StepSchedule
                COLORS={COLORS}
                newAppointmentData={newAppointmentData}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                slotsError={slotsError}
                selectedClient={selectedClient}
                selectedService={selectedService}
                selectedEmployee={selectedEmployee}
                onSetNewAppointmentData={onSetNewAppointmentData}
                onFetchSlots={onFetchSlots}
              />
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
                <><Spinner size="sm" /> Creando...</>
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
