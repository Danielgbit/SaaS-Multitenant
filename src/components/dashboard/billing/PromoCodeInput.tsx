'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { applyCode, type ApplyCodeState } from '@/actions/promoCodes/applyCode'
import { validateCode, type ValidateCodeResult } from '@/actions/promoCodes/validateCode'
import { TicketIcon, CheckCircle2, XCircle, Loader2, Gift, ArrowRight, Sparkles } from 'lucide-react'

const initialState: ApplyCodeState = {}

export function PromoCodeInput() {
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
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.05))',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <TicketIcon className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3
            className="font-semibold text-slate-800"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            ¿Tienes un código de prueba?
          </h3>
          <p className="text-xs text-slate-500">Obtén días extra o descuentos especiales</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div
            className="relative overflow-hidden rounded-xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: validationError
                ? '1px solid rgba(239, 68, 68, 0.4)'
                : preview
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : isFocused
                ? '1px solid rgba(15, 76, 92, 0.4)'
                : '1px solid rgba(15, 76, 92, 0.15)',
              boxShadow: isFocused
                ? '0 4px 16px rgba(15, 76, 92, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                : 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 76, 92, 0.02) 0%, transparent 50%)',
              }}
            />
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ej: PRUEBA30"
              className="relative w-full px-4 py-3.5 text-sm font-mono uppercase tracking-wider bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors"
              style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
              aria-label="Código promocional"
            />
            {validating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              </div>
            )}
            {!validating && preview && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="px-6 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2"
          style={{
            background: code.trim()
              ? 'linear-gradient(135deg, #0F4C5C, #1A6B7C)'
              : 'rgba(15, 76, 92, 0.1)',
            color: code.trim() ? '#FFFFFF' : 'rgba(15, 76, 92, 0.4)',
            boxShadow: code.trim() ? '0 4px 12px rgba(15, 76, 92, 0.2)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (code.trim() && !validating) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1A6B7C, #0F4C5C)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 76, 92, 0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (code.trim() && !validating) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #0F4C5C, #1A6B7C)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 76, 92, 0.2)'
            }
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
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239, 68, 68, 0.15)' }}
          >
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-sm text-red-600 font-medium">{validationError}</p>
        </div>
      )}

      {/* Code Preview - Success State */}
      {preview && (
        <div
          className="relative overflow-hidden rounded-2xl p-5 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04))',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold text-emerald-700"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Código válido
                  </p>
                  <p
                    className="text-xs text-emerald-600/70"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Listo para aplicar
                  </p>
                </div>
              </div>
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {code}
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1))',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                {getTypeIcon(preview.type)}
              </div>
              <div>
                <p
                  className="text-sm font-medium text-slate-700"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {preview.name}
                </p>
                <p
                  className="text-xs text-slate-500"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
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
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239, 68, 68, 0.15)' }}
          >
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-sm text-red-600 font-medium">{state.error}</p>
        </div>
      )}

      {/* Success Message */}
      {state.success && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl animate-fade-in"
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16, 185, 129, 0.15)' }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-sm text-emerald-700 font-medium">
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
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
      style={{
        background: pending ? 'rgba(15, 76, 92, 0.5)' : 'linear-gradient(135deg, #0F4C5C, #1A6B7C)',
        color: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
      onMouseEnter={(e) => {
        if (!pending) {
          e.currentTarget.style.background = 'linear-gradient(135deg, #1A6B7C, #0F4C5C)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        if (!pending) {
          e.currentTarget.style.background = 'linear-gradient(135deg, #0F4C5C, #1A6B7C)'
          e.currentTarget.style.transform = 'translateY(0)'
        }
      }}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
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