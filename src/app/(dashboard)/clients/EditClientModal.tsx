'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { X, Loader2, UserCircle, Check, AlertCircle, HelpCircle, MessageCircle, Mail, Phone, PhoneCall, User, BellOff } from 'lucide-react'
import { createClient } from '@/actions/clients/createClient'
import { updateClient } from '@/actions/clients/updateClient'
import type { Database } from '@/../types/supabase'
import { isValidPhone, getPhoneErrorMessage } from '@/lib/validators/phone'

type Client = Database['public']['Tables']['clients']['Row']

type ConfirmationMethod = 'whatsapp' | 'phone_call' | 'in_person' | 'none'

interface EditClientModalProps {
  client: Client | null
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryLight: isDark ? '#0EA5E9' : '#1A6B7C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
    border: isDark ? '#334155' : '#E2E8F0',
    borderFocus: isDark ? '#38BDF8' : '#0F4C5C',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEF2F2',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#ECFDF5',
    warning: '#F59E0B',
    warningLight: isDark ? '#78350F' : '#FEF3C7',
    overlay: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.5)',
    radius: {
      lg: '20px',
      md: '12px',
      sm: '8px',
    },
    shadow: '0 25px 60px -12px rgba(0, 0, 0, 0.35)',
    shadowInput: '0 2px 8px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    isDark,
  }
}

function FloatingInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled,
  required,
  autoComplete,
  icon: Icon,
  hint,
  isDark,
  COLORS,
  inputRef,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  autoComplete?: string
  icon?: React.ElementType
  hint?: string
  isDark: boolean
  COLORS: ReturnType<typeof useColors>
  inputRef?: React.RefObject<HTMLInputElement | null>
}) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className="relative">
      <div 
        className="relative rounded-xl transition-all duration-200"
        style={{
          backgroundColor: COLORS.surface,
          border: `1.5px solid ${error ? COLORS.error : isFocused ? COLORS.borderFocus : COLORS.border}`,
          boxShadow: isFocused ? `0 0 0 3px ${COLORS.primary}15` : COLORS.shadowInput,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {Icon && (
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
            style={{ color: isFocused ? COLORS.primary : COLORS.textMuted }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        
        <input
          ref={inputRef}
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          placeholder={isFocused ? placeholder : ''}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: Icon ? '20px 44px 8px 44px' : '20px 44px 8px 16px',
            color: COLORS.textPrimary,
            backgroundColor: 'transparent',
          }}
          className="w-full border-0 focus:outline-none focus:ring-0 text-sm"
        />
        
        <label
          htmlFor={name}
          className="absolute left-4 transition-all duration-200 pointer-events-none"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: error 
              ? COLORS.error 
              : isFocused 
                ? COLORS.primary 
                : COLORS.textMuted,
            fontSize: isFocused || hasValue ? '11px' : '14px',
            fontWeight: isFocused || hasValue ? '600' : '400',
            top: isFocused || hasValue ? '10px' : '50%',
            transform: isFocused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
          {required && <span style={{ color: COLORS.error }}> *</span>}
        </label>

        {hasValue && !error && Icon && (
          <div 
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: COLORS.success }}
          >
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {error && (
        <p 
          className="flex items-center gap-1 mt-1.5"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: COLORS.error,
            fontSize: '12px',
          }}
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p 
          className="flex items-center gap-1 mt-1.5"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: COLORS.textMuted,
            fontSize: '12px',
          }}
        >
          💡 {hint}
        </p>
      )}
    </div>
  )
}

function FloatingTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  maxLength,
  rows,
  isDark,
  COLORS,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  maxLength?: number
  rows?: number
  isDark: boolean
  COLORS: ReturnType<typeof useColors>
}) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className="relative">
      <div 
        className="relative rounded-xl transition-all duration-200"
        style={{
          backgroundColor: COLORS.surface,
          border: `1.5px solid ${error ? COLORS.error : isFocused ? COLORS.borderFocus : COLORS.border}`,
          boxShadow: isFocused ? `0 0 0 3px ${COLORS.primary}15` : COLORS.shadowInput,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <textarea
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          rows={rows || 3}
          maxLength={maxLength}
          placeholder={isFocused ? placeholder : ''}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            padding: '28px 44px 8px 16px',
            color: COLORS.textPrimary,
            backgroundColor: 'transparent',
            resize: 'none',
          }}
          className="w-full border-0 focus:outline-none focus:ring-0 text-sm"
        />
        
        <label
          htmlFor={name}
          className="absolute left-4 transition-all duration-200 pointer-events-none"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: error 
              ? COLORS.error 
              : isFocused 
                ? COLORS.primary 
                : COLORS.textMuted,
            fontSize: isFocused || hasValue ? '11px' : '14px',
            fontWeight: isFocused || hasValue ? '600' : '400',
            top: isFocused || hasValue ? '12px' : '16px',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>

        {maxLength && (
          <div 
            className="absolute right-4 bottom-3"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '11px',
              color: value.length > maxLength * 0.9 ? COLORS.error : COLORS.textMuted,
            }}
          >
            {value.length}/{maxLength}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          className="flex items-center gap-1 mt-1.5"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: COLORS.error,
            fontSize: '12px',
          }}
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function ConfirmationTooltip({ COLORS }: { COLORS: ReturnType<typeof useColors> }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        style={{ color: COLORS.textMuted }}
        aria-label="Ayuda sobre confirmaciones"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 p-4 rounded-xl z-50 min-w-[280px]"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div className="space-y-3">
            <p 
              className="text-sm font-medium"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }}
            >
              💡 Recuerda preguntar al cliente:
            </p>
            <p 
              className="text-xs"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}
            >
              "¿Desea recibir confirmaciones de sus citas por WhatsApp?"
            </p>
            
            <div className="border-t" style={{ borderColor: COLORS.border }} />
            
            <p 
              className="text-xs font-medium"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textPrimary }}
            >
              Si dice NO, selecciona:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px' }}>📞</span>
                <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}>
                  "Ya lo llamé" → Confirmado por llamada
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px' }}>👤</span>
                <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}>
                  "Confirmó aquí" → En persona
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '14px' }}>⏸️</span>
                <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: COLORS.textSecondary }}>
                  "No desea" → Sin confirmación
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmationToggle({ 
  enabled, 
  onChange, 
  COLORS 
}: { 
  enabled: boolean
  onChange: (enabled: boolean) => void
  COLORS: ReturnType<typeof useColors>
}) {
  return (
    <div 
      className="flex items-start gap-3 p-4 rounded-xl border"
      style={{
        backgroundColor: enabled ? COLORS.primary + '08' : COLORS.surfaceSubtle,
        borderColor: enabled ? COLORS.primary + '30' : COLORS.border,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className="mt-0.5 relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer"
        style={{ 
          backgroundColor: enabled ? COLORS.primary : COLORS.border,
        }}
        role="switch"
        aria-checked={enabled}
      >
        <div 
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ 
            left: enabled ? '26px' : '4px',
            transition: 'left 0.2s ease-out',
          }}
        />
      </button>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              color: COLORS.textPrimary 
            }}
          >
            Activar confirmaciones automáticas
          </span>
          <ConfirmationTooltip COLORS={COLORS} />
        </div>
        <p 
          className="text-xs mt-0.5"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            color: COLORS.textSecondary 
          }}
        >
          {enabled 
            ? 'Se enviarán recordatorios y confirmaciones por WhatsApp'
            : 'No se enviarán mensajes automáticos'
          }
        </p>
      </div>
    </div>
  )
}

function MethodSelector({ 
  method, 
  onChange, 
  disabled,
  COLORS 
}: { 
  method: ConfirmationMethod
  onChange: (method: ConfirmationMethod) => void
  disabled?: boolean
  COLORS: ReturnType<typeof useColors>
}) {
  const methods: { value: ConfirmationMethod; label: string; icon: React.ElementType; description: string }[] = [
    { 
      value: 'phone_call', 
      label: 'Ya lo llamé', 
      icon: PhoneCall,
      description: 'Confirmado por llamada del staff' 
    },
    { 
      value: 'in_person', 
      label: 'Confirmó aquí', 
      icon: User,
      description: 'Confirmado presencialmente' 
    },
    { 
      value: 'none', 
      label: 'No desea', 
      icon: BellOff,
      description: 'No quiere recibir mensajes' 
    },
  ]

  return (
    <div className="space-y-2">
      <p 
        className="text-sm font-medium"
        style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          color: COLORS.textPrimary 
        }}
      >
        ¿Cómo se confirmó la cita?
      </p>
      
      <div className="space-y-2">
        {methods.map(({ value, label, icon: Icon, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            disabled={disabled}
            className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: method === value ? COLORS.primary + '10' : COLORS.surface,
              borderColor: method === value ? COLORS.primary : COLORS.border,
            }}
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: method === value ? COLORS.primary + '20' : COLORS.surfaceSubtle,
              }}
            >
              <Icon 
                className="w-4 h-4" 
                style={{ color: method === value ? COLORS.primary : COLORS.textMuted }} 
              />
            </div>
            <div className="flex-1 text-left">
              <p 
                className="text-sm font-medium"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif", 
                  color: COLORS.textPrimary 
                }}
              >
                {label}
              </p>
              <p 
                className="text-xs"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif", 
                  color: COLORS.textMuted 
                }}
              >
                {description}
              </p>
            </div>
            <div 
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: method === value ? COLORS.primary : COLORS.border,
                backgroundColor: method === value ? COLORS.primary : 'transparent',
              }}
            >
              {method === value && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export function EditClientModal({
  client,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: EditClientModalProps) {
  const COLORS = useColors()
  const isNewClient = !client

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmationsEnabled, setConfirmationsEnabled] = useState(true)
  const [confirmationMethod, setConfirmationMethod] = useState<ConfirmationMethod>('whatsapp')
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsSubmitted(false)
      setFormErrors({})
      
      if (client) {
        setName(client.name || '')
        setEmail(client.email || '')
        setPhone(client.phone || '')
        setNotes(client.notes || '')
        setConfirmationsEnabled(client.confirmations_enabled ?? true)
        setConfirmationMethod((client.confirmation_method as ConfirmationMethod) || 'whatsapp')
      } else {
        setName('')
        setEmail('')
        setPhone('')
        setNotes('')
        setConfirmationsEnabled(true)
        setConfirmationMethod('whatsapp')
      }
      
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, client])

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setIsClosing(false)
        setIsVisible(false)
        onClose()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isClosing, onClose])

  const handleClose = () => {
    setIsClosing(true)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`
    return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!name.trim()) {
      errors.name = 'El nombre es requerido'
    } else if (name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres'
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un email válido'
    }

    if (confirmationsEnabled && confirmationMethod === 'whatsapp') {
      if (!phone) {
        errors.phone = 'El teléfono es requerido para confirmaciones por WhatsApp'
      } else if (!isValidPhone(phone)) {
        errors.phone = getPhoneErrorMessage(phone) || 'El teléfono no es válido'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)

    if (!validateForm()) {
      setIsSubmitted(false)
      return
    }

    const formData = new FormData()
    formData.append('organization_id', organizationId)
    formData.append('name', name.trim())
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('notes', notes)
    formData.append('confirmations_enabled', String(confirmationsEnabled))
    formData.append('confirmation_method', confirmationMethod)

    if (!isNewClient && client) {
      formData.append('id', client.id)
    }

    const action = isNewClient ? createClient : updateClient
    const state = await action({ success: false, error: undefined, fieldErrors: undefined }, formData)

    if (state.success) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 400)
    } else {
      setIsSubmitted(false)
      if (state.error) {
        setFormErrors({ _form: state.error })
      }
      if (state.fieldErrors?.phone) {
        setFormErrors(prev => ({ ...prev, phone: state.fieldErrors!.phone![0] }))
      }
    }
  }

  if (!isVisible && !isClosing) return null

  const isLoading = isSubmitted

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        opacity: isClosing ? 0 : isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-out',
        pointerEvents: isClosing ? 'none' : 'auto'
      }}
    >
      <div 
        className="absolute inset-0"
        style={{ 
          backgroundColor: COLORS.overlay,
          backdropFilter: 'blur(12px)',
        }}
        onClick={handleClose}
      />

      <div
        style={{
          backgroundColor: COLORS.surfaceGlass,
          borderRadius: COLORS.radius.lg,
          boxShadow: COLORS.shadow,
          border: `1px solid ${COLORS.border}`,
          backdropFilter: 'blur(20px)',
          opacity: isClosing ? 0 : 1,
          transform: isClosing ? 'scale(0.95) translateY(10px)' : 'scale(1) translateY(0)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        <div 
          className="relative p-6 border-b"
          style={{ 
            borderColor: COLORS.border,
            background: COLORS.primaryGradient,
          }}
        >
          <div 
            className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"
            style={{ filter: 'blur(40px)' }}
          />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
              >
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 
                  style={{ 
                    fontFamily: "'Cormorant Garamond', serif",
                    color: '#FFFFFF',
                  }}
                  className="text-2xl font-semibold"
                >
                  {isNewClient ? 'Nuevo Cliente' : 'Editar Cliente'}
                </h2>
                <p 
                  style={{ 
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '13px'
                  }}
                >
                  {isNewClient ? 'Añade la información del cliente' : 'Actualiza la información'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2.5 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 200px)' }}
        >
          {formErrors._form && (
            <div 
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ 
                backgroundColor: COLORS.errorLight,
                border: `1px solid ${COLORS.error}30`,
                color: COLORS.error,
              }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px' }}>
                {formErrors._form}
              </span>
            </div>
          )}

          <FloatingInput
            label="Nombre completo"
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (formErrors.name) setFormErrors({ ...formErrors, name: '' })
            }}
            placeholder="Ej: María García"
            error={formErrors.name}
            disabled={isLoading}
            required
            autoComplete="name"
            isDark={COLORS.isDark}
            COLORS={COLORS}
            inputRef={nameInputRef}
          />

          <ConfirmationToggle 
            enabled={confirmationsEnabled}
            onChange={setConfirmationsEnabled}
            COLORS={COLORS}
          />

          {confirmationsEnabled ? (
            <FloatingInput
              label="Teléfono"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                handlePhoneChange(e)
                if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' })
              }}
              placeholder="300 123 4567 o +1 234 567 8900"
              error={formErrors.phone}
              disabled={isLoading}
              autoComplete="tel"
              icon={Phone}
              hint="Para enviar confirmaciones por WhatsApp"
              isDark={COLORS.isDark}
              COLORS={COLORS}
            />
          ) : (
            <MethodSelector
              method={confirmationMethod}
              onChange={setConfirmationMethod}
              disabled={isLoading}
              COLORS={COLORS}
            />
          )}

          <FloatingInput
            label="Correo electrónico"
            name="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (formErrors.email) setFormErrors({ ...formErrors, email: '' })
            }}
            placeholder="Ej: maria@email.com"
            error={formErrors.email}
            disabled={isLoading}
            autoComplete="email"
            icon={Mail}
            isDark={COLORS.isDark}
            COLORS={COLORS}
          />

          <FloatingTextarea
            label="Notas"
            name="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              if (formErrors.notes) setFormErrors({ ...formErrors, notes: '' })
            }}
            placeholder="Información adicional sobre el cliente..."
            maxLength={500}
            rows={3}
            isDark={COLORS.isDark}
            COLORS={COLORS}
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: COLORS.radius.md,
                padding: '14px 20px',
                color: COLORS.textSecondary,
                backgroundColor: COLORS.surfaceSubtle,
                border: `1.5px solid ${COLORS.border}`,
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.6 : 1,
                transition: COLORS.transition,
              }}
              className="flex-1 hover:opacity-80 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: COLORS.radius.md,
                padding: '14px 24px',
                backgroundColor: COLORS.primary,
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isLoading ? 0.7 : 1,
                transition: COLORS.transition,
                boxShadow: `0 4px 14px ${COLORS.primary}40`,
              }}
              className="flex-1 flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isNewClient ? 'Crear cliente' : 'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
