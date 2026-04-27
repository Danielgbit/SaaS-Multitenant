'use client'

import { useState, useEffect } from 'react'
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
  Clock
} from 'lucide-react'
import {
  CalendarColors,
  Employee,
  Client,
  Service,
  TimeSlot,
  NewAppointmentData
} from '@/types/calendar'
import { formatTime, formatDuration } from '@/lib/utils/formatTime'

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

  const canGoToStep2 = newAppointmentData.clientId !== ''
  const canGoToStep3 = newAppointmentData.serviceId !== '' && newAppointmentData.employeeId !== ''

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4" 
      style={{ backgroundColor: COLORS.overlay, backdropFilter: 'blur(8px)' }} 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto transition-all duration-300"
        style={{ backgroundColor: COLORS.surface, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div 
          className="px-6 py-5 relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`, 
            color: '#FFF' 
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Nueva Cita
              </h3>
              <button 
                onClick={onClose} 
                className="p-2 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Steps */}
            <div className="flex items-center justify-between mb-3">
              {[1, 2, 3].map(s => {
                const isCompleted = wizardStep > s
                const isActive = wizardStep >= s
                return (
                  <div key={s} className="flex items-center">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        isActive 
                          ? 'bg-white text-[#0F4C5C] shadow-lg' 
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div 
                        className={`w-16 h-0.5 mx-2 transition-colors duration-300 ${
                          isCompleted ? 'bg-white' : 'bg-white/30'
                        }`} 
                      />
                    )}
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

        {/* Contenido del wizard */}
        <div className="p-6 space-y-6">
          {/* Paso 1: Cliente */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: COLORS.primary + '15' }}
                >
                  <User className="w-8 h-8" style={{ color: COLORS.primary }} />
                </div>
                <h4 
                  className="text-xl font-semibold mb-2" 
                  style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                >
                  ¿Para quién?
                </h4>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Selecciona el cliente que realizará la reserva
                </p>
              </div>
              
              <div className="relative">
                <label 
                  className="block text-sm font-medium mb-2 flex items-center gap-2"
                  style={{ color: COLORS.textPrimary }}
                >
                  Cliente
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 cursor-help" style={{ color: COLORS.textMuted }} />
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                      style={{ backgroundColor: COLORS.textPrimary, color: COLORS.surface }}
                    >
                      Selecciona el cliente que reservó
                    </div>
                  </div>
                </label>
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  value={clientSearch} 
                  onChange={e => { onSetClientSearch(e.target.value); onSetShowClientDropdown(true) }} 
                  onFocus={() => onSetShowClientDropdown(true)} 
                  className="w-full px-4 py-3.5 pl-12 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                  style={{ 
                    borderColor: showClientDropdown ? COLORS.primary : COLORS.border, 
                    backgroundColor: COLORS.surface, 
                    color: COLORS.textPrimary,
                    boxShadow: showClientDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
                  }}
                />
                <User 
                  className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" 
                  style={{ color: COLORS.textMuted }} 
                />
              </div>
              
              {showClientDropdown && clients.length > 0 && (
                <div 
                  className="relative z-20 mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-56 overflow-y-auto"
                  style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                >
                  {clients
                    .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                    .map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => { 
                          onSetNewAppointmentData({ clientId: c.id })
                          onSetClientSearch(c.name)
                          onSetShowClientDropdown(false)
                          onNextStep()
                        }} 
                        className="w-full px-4 py-3.5 text-left flex items-center gap-3 transition-colors duration-150 hover:opacity-80"
                        style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          {c.phone && <p className="text-xs" style={{ color: COLORS.textMuted }}>{c.phone}</p>}
                        </div>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Servicio y Empleado */}
          {wizardStep === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: COLORS.primary + '15' }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: COLORS.primary }} />
                </div>
                <h4 
                  className="text-xl font-semibold mb-2"
                  style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                >
                  ¿Qué y quién?
                </h4>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Selecciona el servicio y el profesional
                </p>
              </div>
              
              {/* Servicio */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                  Servicio
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar servicio..." 
                    value={serviceSearch} 
                    onChange={e => { onSetServiceSearch(e.target.value); onSetShowServiceDropdown(true) }} 
                    onFocus={() => onSetShowServiceDropdown(true)}
                    className="w-full px-4 py-3.5 pl-12 rounded-xl border-2"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                  />
                  <Sparkles className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                </div>
                {showServiceDropdown && (
                  <div 
                    className="absolute z-20 w-full mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                    style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                  >
                    {services
                      .filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
                      .map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => { 
                            onSetNewAppointmentData({ serviceId: s.id, time: '' })
                            onSetServiceSearch(s.name)
                            onSetShowServiceDropdown(false)
                          }} 
                          className="w-full px-4 py-3.5 text-left flex items-center justify-between"
                          style={{ color: COLORS.textPrimary }}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span 
                            className="text-sm px-2 py-1 rounded-lg"
                            style={{ backgroundColor: COLORS.primary + '15', color: COLORS.primary }}
                          >
                            {formatDuration(s.duration)}
                          </span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Empleado */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                  Profesional
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar profesional..." 
                    value={employeeSearch} 
                    onChange={e => { onSetEmployeeSearch(e.target.value); onSetShowEmployeeDropdown(true) }} 
                    onFocus={() => onSetShowEmployeeDropdown(true)}
                    className="w-full px-4 py-3.5 pl-12 rounded-xl border-2"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                  />
                  <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.textMuted }} />
                </div>
                {showEmployeeDropdown && (
                  <div 
                    className="absolute z-20 w-full mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-48 overflow-y-auto"
                    style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                  >
                    {employees
                      .filter(e => e.name.toLowerCase().includes(employeeSearch.toLowerCase()))
                      .map(e => (
                        <button 
                          key={e.id} 
                          onClick={() => { 
                            onSetNewAppointmentData({ employeeId: e.id, time: '' })
                            onSetEmployeeSearch(e.name)
                            onSetShowEmployeeDropdown(false)
                          }} 
                          className="w-full px-4 py-3.5 text-left flex items-center gap-3"
                          style={{ color: COLORS.textPrimary }}
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                            style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}
                          >
                            {e.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{e.name}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 3: Fecha y Horario */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: COLORS.primary + '15' }}
                >
                  <Calendar className="w-8 h-8" style={{ color: COLORS.primary }} />
                </div>
                <h4 
                  className="text-xl font-semibold mb-2"
                  style={{ color: COLORS.textPrimary, fontFamily: 'Cormorant Garamond, serif' }}
                >
                  ¿Cuándo?
                </h4>
                <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                  Selecciona el horario disponible
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                  Fecha
                </label>
                <input 
                  type="date" 
                  value={newAppointmentData.date} 
                  min={new Date().toISOString().split('T')[0]} 
                  onChange={e => onSetNewAppointmentData({ date: e.target.value, time: '' })} 
                  className="w-full px-4 py-3.5 rounded-xl border-2"
                  style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                />
              </div>

              {newAppointmentData.date && newAppointmentData.employeeId && newAppointmentData.serviceId && (
                <div>
                  {!loadingSlots && availableSlots.length === 0 && (
                    <button 
                      onClick={onFetchSlots} 
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
                    <div 
                      className="p-4 rounded-xl border-2"
                      style={{ backgroundColor: COLORS.errorLight, borderColor: COLORS.error }}
                    >
                      <p className="text-sm font-medium" style={{ color: COLORS.error }}>No hay disponibilidad</p>
                      <p className="text-xs mt-1" style={{ color: COLORS.textSecondary }}>{slotsError}</p>
                      <button onClick={onFetchSlots} className="mt-3 text-xs font-medium underline" style={{ color: COLORS.primary }}>
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
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {mornSlots.filter(s => s.available).map(s => (
                              <button 
                                key={s.start_time} 
                                onClick={() => onSetNewAppointmentData({ time: formatTime(s.start_time) })}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                  newAppointmentData.time === formatTime(s.start_time) ? 'ring-2 ring-offset-2' : ''
                                }`}
                                style={{ 
                                  backgroundColor: newAppointmentData.time === formatTime(s.start_time) ? COLORS.primary : COLORS.surfaceSubtle,
                                  color: newAppointmentData.time === formatTime(s.start_time) ? '#FFF' : COLORS.textPrimary,
                                  borderColor: newAppointmentData.time === formatTime(s.start_time) ? COLORS.primary : 'transparent',
                                  boxShadow: newAppointmentData.time === formatTime(s.start_time) ? `0 4px 12px ${COLORS.primary}30` : 'none'
                                }}
                              >
                                {formatTime(s.start_time)}
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
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {aftSlots.filter(s => s.available).map(s => (
                              <button 
                                key={s.start_time} 
                                onClick={() => onSetNewAppointmentData({ time: formatTime(s.start_time) })}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                  newAppointmentData.time === formatTime(s.start_time) ? 'ring-2 ring-offset-2' : ''
                                }`}
                                style={{ 
                                  backgroundColor: newAppointmentData.time === formatTime(s.start_time) ? COLORS.primary : COLORS.surfaceSubtle,
                                  color: newAppointmentData.time === formatTime(s.start_time) ? '#FFF' : COLORS.textPrimary,
                                  borderColor: newAppointmentData.time === formatTime(s.start_time) ? COLORS.primary : 'transparent',
                                  boxShadow: newAppointmentData.time === formatTime(s.start_time) ? `0 4px 12px ${COLORS.primary}30` : 'none'
                                }}
                              >
                                {formatTime(s.start_time)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textPrimary }}>
                  Notas (opcional)
                </label>
                <textarea 
                  value={newAppointmentData.notes} 
                  onChange={e => onSetNewAppointmentData({ notes: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl border-2 resize-none"
                  rows={3}
                  placeholder="Alguna nota adicional..."
                  style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-6 py-5 flex items-center justify-between sticky bottom-0"
          style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}
        >
          {wizardStep > 1 ? (
            <button 
              onClick={onPrevStep}
              className="px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-medium"
              style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}
            >
              Cancelar
            </button>
          )}
          
          {wizardStep < 3 ? (
            <button 
              onClick={onNextStep}
              disabled={(wizardStep === 1 && !canGoToStep2) || (wizardStep === 2 && !canGoToStep3)}
              className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
              style={{ 
                backgroundColor: COLORS.primary, 
                color: '#FFF', 
                boxShadow: `0 4px 12px ${COLORS.primary}40`,
                opacity: ((wizardStep === 1 && !canGoToStep2) || (wizardStep === 2 && !canGoToStep3)) ? 0.5 : 1 
              }}
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={onCreate}
              disabled={!newAppointmentData.time || isCreating}
              className="px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
              style={{ 
                backgroundColor: COLORS.primary, 
                color: '#FFF', 
                boxShadow: `0 4px 12px ${COLORS.primary}40`,
                opacity: (!newAppointmentData.time || isCreating) ? 0.5 : 1 
              }}
            >
              {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" />Creando...</> : <><CheckCircle2 className="w-4 h-4" />Crear Cita</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
