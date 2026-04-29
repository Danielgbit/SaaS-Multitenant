'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, Scissors, Clock, DollarSign, Loader2, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createService } from '@/actions/services/createService'
import { parseDuration, formatDurationDisplay, needsParsing, formatDurationInput } from '@/lib/utils/parseDuration'
import { formatPriceInput, parsePriceToNumber } from '@/lib/utils/parsePrice'

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
    surfaceGlass: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    error: '#DC2626',
    errorLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}

interface CreateServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateServiceModal({ isOpen, onClose }: CreateServiceModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [durationDisplay, setDurationDisplay] = useState<string | null>(null)
  const [durationValue, setDurationValue] = useState('')
  const [priceValue, setPriceValue] = useState('')
  const [priceDisplay, setPriceDisplay] = useState<string | null>(null)
  const COLORS = useColors()

  if (!isOpen) return null

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setDurationValue(value)

    if (!value) {
      setDurationDisplay(null)
      return
    }

    if (needsParsing(value)) {
      const parsed = parseDuration(value)
      if (parsed !== null) {
        setDurationDisplay(formatDurationDisplay(parsed))
      } else {
        setDurationDisplay(null)
      }
    } else {
      const numericValue = parseInt(value, 10)
      if (!isNaN(numericValue) && numericValue > 0) {
        setDurationDisplay(formatDurationDisplay(numericValue))
      } else {
        setDurationDisplay(null)
      }
    }
  }

  function handleDurationBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value
    if (!value) return

    const formatted = formatDurationInput(value)
    setDurationValue(formatted)

    if (formatted !== value) {
      const parsed = parseDuration(formatted)
      if (parsed !== null) {
        setDurationDisplay(formatDurationDisplay(parsed))
      }
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '')
    const formatted = formatPriceInput(raw)
    setPriceValue(formatted)

    if (formatted) {
      const num = parsePriceToNumber(formatted)
      setPriceDisplay(num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }))
    } else {
      setPriceDisplay(null)
    }
  }

  function handlePriceBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value
    if (!value) return

    const raw = value.replace(/[^\d]/g, '')
    if (!raw) return

    const num = parseInt(raw, 10)
    if (isNaN(num) || num === 0) return

    if (num < 100) {
      const multiplied = num * 1000
      const formatted = formatPriceInput(multiplied.toString())
      setPriceValue(formatted)
      setPriceDisplay(multiplied.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    const name = formData.get('name') as string

    const duration = parseDuration(durationValue)
    if (duration === null) {
      setError('La duración debe ser un número válido (ej: 90, 1:30, 2h, 2.5)')
      return
    }

    if (duration < 5) {
      setError('La duración mínima es 5 minutos.')
      return
    }

    const price = parsePriceToNumber(priceValue)

    if (price === 0) {
      setError('El precio debe ser un número válido.')
      return
    }

    if (price < 0) {
      setError('El precio no puede ser negativo.')
      return
    }

    startTransition(async () => {
      const result = await createService({
        name,
        duration,
        price
      })

      if (!result.error) {
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-service-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          backgroundColor: COLORS.overlay,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Panel */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${COLORS.border}`
        }}
      >
        {/* Header con gradiente */}
        <div
          className="relative p-5 border-b overflow-hidden"
          style={{
            borderColor: COLORS.border,
            background: COLORS.primaryGradient,
          }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  id="create-service-title"
                  className="text-xl font-semibold text-white"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Nuevo Servicio
                </h2>
                <p className="text-xs text-white/80">Completa los detalles del servicio</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 rounded-lg hover:bg-white/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Error Banner */}
          {error && (
            <div
              className="p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2"
              style={{
                backgroundColor: COLORS.errorLight,
                border: `1px solid ${COLORS.error}30`
              }}
            >
              <span style={{ color: COLORS.error }}>⚠️</span>
              <p className="text-sm font-medium" style={{ color: COLORS.isDark ? '#FCA5A5' : '#991B1B' }}>
                {error}
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Input: Name */}
            <div className="space-y-2">
              <label
                htmlFor="create-service-name"
                className="text-sm font-semibold tracking-wide"
                style={{ color: COLORS.textPrimary }}
              >
                Nombre del servicio <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative group">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-colors"
                  style={{ color: COLORS.textMuted }}
                >
                  <Scissors className="w-5 h-5" />
                </div>
                <input
                  id="create-service-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Ej. Corte de cabello, Spa facial"
                  className={`w-full pl-12 pr-4 min-h-[48px] rounded-xl border text-base transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${COLORS.isDark ? 'focus:ring-sky-400' : 'focus:ring-[#0F4C5C]'}`}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderRadius: '10px',
                    borderColor: COLORS.border,
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.surface,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Input: Duration */}
              <div className="space-y-2">
                <label
                  htmlFor="create-service-duration"
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: COLORS.textPrimary }}
                >
                  Duración <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative group">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-colors"
                    style={{ color: COLORS.textMuted }}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <input
                    id="create-service-duration"
                    name="duration"
                    type="text"
                    required
                    placeholder="90, 1:30, 2h"
                    autoComplete="off"
                    value={durationValue}
                    onChange={handleDurationChange}
                    onBlur={handleDurationBlur}
                    className="w-full pl-12 pr-4 min-h-[48px] rounded-xl border text-base transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderRadius: '10px',
                      borderColor: durationDisplay ? COLORS.success : COLORS.border,
                      color: COLORS.textPrimary,
                      backgroundColor: COLORS.surface,
                    }}
                  />
                </div>
                {/* Duration Helper */}
                {durationDisplay && (
                  <div className="flex items-center gap-1.5 text-xs animate-in fade-in duration-200" style={{ color: COLORS.success }}>
                    <Check className="w-3 h-3" />
                    <span>{durationDisplay}</span>
                  </div>
                )}
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  Ej: 90, 1:30, 2h, 2.5 hrs
                </p>
              </div>

              {/* Input: Price */}
              <div className="space-y-2">
                <label
                  htmlFor="create-service-price"
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: COLORS.textPrimary }}
                >
                  Costo <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <div className="relative group">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center transition-colors"
                    style={{ color: COLORS.textMuted }}
                  >
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    id="create-service-price"
                    name="price"
                    type="text"
                    required
                    placeholder="20"
                    value={priceValue}
                    onChange={handlePriceChange}
                    onBlur={handlePriceBlur}
                    autoComplete="off"
                    className="w-full pl-12 pr-4 min-h-[48px] rounded-xl border text-base transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      borderRadius: '10px',
                      borderColor: priceDisplay ? COLORS.success : COLORS.border,
                      color: COLORS.textPrimary,
                      backgroundColor: COLORS.surface,
                    }}
                  />
                </div>
                {/* Price Helper */}
                {priceDisplay && (
                  <div className="flex items-center gap-1.5 text-xs animate-in fade-in duration-200" style={{ color: COLORS.success }}>
                    <Check className="w-3 h-3" />
                    <span>= {priceDisplay}</span>
                  </div>
                )}
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  Ej: 20, 35.000, 100.000
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl border text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-1/2 px-5 min-h-[48px] rounded-xl text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                background: COLORS.primaryGradient,
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                'Crear servicio'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  )
}