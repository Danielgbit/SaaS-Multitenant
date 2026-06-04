'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { applyCode, type ApplyCodeState } from '@/actions/promoCodes/applyCode'
import { validateCode, type ValidateCodeResult } from '@/actions/promoCodes/validateCode'
import { TicketIcon, CheckCircle2, XCircle, Gift, ArrowRight, Sparkles } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { useThemeColors } from '@/hooks/useThemeColors'

const initialState: ApplyCodeState = {}

export function PromoCodeInput() {
  const COLORS = useThemeColors()
  const [state, formAction] = useActionState(applyCode, initialState)
  const [code, setCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [preview, setPreview] = useState<ValidateCodeResult['promoCode'] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  async function handleValidate() {
    if (!code.trim()) return
    setValidating(true)
    setValidationError(null)
    setPreview(null)

    const result = await validateCode(code)

    if (result.valid && result.promoCode) {
      setPreview(result.promoCode)
    } else {
      setValidationError(result.error || 'Código no válido')
    }

    setValidating(false)
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value.toUpperCase())
    setPreview(null)
    setValidationError(null)
  }

  function getTypeLabel(type: string, value: number) {
    switch (type) {
      case 'trial_extension':
        return `+${value} días de prueba extra`
      case 'grace_period':
        return `+${value} días de gracia`
      case 'free_month':
        return 'Primer mes gratis'
      case 'discount':
        return `${value}% de descuento`
      default:
        return type
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'trial_extension':
        return <Clock className="w-4 h-4" />
      case 'grace_period':
        return <AlertTriangle className="w-4 h-4" />
      case 'free_month':
        return <Gift className="w-4 h-4" />
      case 'discount':
        return <Percent className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: COLORS.amberLight,
            border: `1px solid ${COLORS.amber}30`,
          }}
        >
          <TicketIcon className="w-5 h-5" style={{ color: COLORS.amber }} />
        </div>
        <div>
          <h3
            className="font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            ¿Tienes un código de prueba?
          </h3>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>Obtén días extra o descuentos especiales</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div
            className="relative overflow-hidden rounded-xl transition-all duration-300"
            style={{
              backgroundColor: COLORS.surface,
              border: validationError
                ? `1px solid ${COLORS.error}40`
                : preview
                ? `1px solid ${COLORS.success}40`
                : isFocused
                ? `1px solid ${COLORS.primary}60`
                : `1px solid ${COLORS.border}`,
              boxShadow: isFocused ? `0 0 0 3px ${COLORS.primary}15` : 'none',
            }}
          >
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ej: PRUEBA30"
              className="w-full px-4 py-3.5 text-sm font-mono uppercase tracking-wider bg-transparent"
              style={{ color: COLORS.textPrimary }}
              aria-label="Código promocional"
            />
            {validating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" className="w-5 h-5" style={{ color: COLORS.amber }} />
              </div>
            )}
            {!validating && preview && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{
            backgroundColor: code.trim() ? COLORS.primary : COLORS.surfaceSubtle,
            color: code.trim() ? '#FFFFFF' : COLORS.textMuted,
            boxShadow: code.trim() ? '0 2px 8px rgba(15, 76, 92, 0.15)' : 'none',
          }}
        >
          Validar
        </button>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
          style={{
            backgroundColor: COLORS.errorLight,
            border: `1px solid ${COLORS.error}25`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${COLORS.error}15` }}
          >
            <XCircle className="w-4 h-4" style={{ color: COLORS.error }} />
          </div>
          <p className="text-sm font-medium" style={{ color: COLORS.error }}>{validationError}</p>
        </div>
      )}

      {/* Code Preview - Success State */}
      {preview && (
        <div
          className="relative overflow-hidden rounded-2xl p-5 animate-fade-in"
          style={{
            backgroundColor: COLORS.successLight,
            border: `1px solid ${COLORS.success}25`,
          }}
        >
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${COLORS.success}15`,
                    border: `1px solid ${COLORS.success}30`,
                  }}
                >
                  <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLORS.success }}>
                    Código válido
                  </p>
                  <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                    Listo para aplicar
                  </p>
                </div>
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono"
                style={{ backgroundColor: `${COLORS.success}15`, color: COLORS.success }}
              >
                {code}
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: COLORS.amberLight,
                  border: `1px solid ${COLORS.amber}20`,
                }}
              >
                <span style={{ color: COLORS.amber }}>{getTypeIcon(preview.type)}</span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                  {preview.name}
                </p>
                <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                  {getTypeLabel(preview.type, preview.value)}
                </p>
              </div>
            </div>

            <form action={formAction} className="flex gap-3">
              <input type="hidden" name="code" value={code} />
              <ApplyButton />
            </form>
          </div>
        </div>
      )}

      {/* Server Action Error */}
      {state.error && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
          style={{
            backgroundColor: COLORS.errorLight,
            border: `1px solid ${COLORS.error}25`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${COLORS.error}15` }}
          >
            <XCircle className="w-4 h-4" style={{ color: COLORS.error }} />
          </div>
          <p className="text-sm font-medium" style={{ color: COLORS.error }}>{state.error}</p>
        </div>
      )}

      {/* Success Message */}
      {state.success && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
          style={{
            backgroundColor: COLORS.successLight,
            border: `1px solid ${COLORS.success}25`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${COLORS.success}15` }}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.success }} />
          </div>
          <p className="text-sm font-medium" style={{ color: COLORS.success }}>
            ¡Código aplicado exitosamente!
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

function ApplyButton() {
  const COLORS = useThemeColors()
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
      style={{
        backgroundColor: pending ? COLORS.primaryLight : COLORS.primary,
        color: COLORS.textOnPrimary,
      }}
    >
      {pending ? (
        <>
          <Spinner size="sm" />
          Aplicando...
        </>
      ) : (
        <>
          Aplicar código
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  )
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function Percent({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  )
}

function Clock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}