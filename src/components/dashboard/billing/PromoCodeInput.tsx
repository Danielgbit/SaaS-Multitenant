'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { applyCode, type ApplyCodeState } from '@/actions/promoCodes/applyCode'
import { validateCode, type ValidateCodeResult } from '@/actions/promoCodes/validateCode'
import { TicketIcon, CheckCircleIcon, XCircleIcon, Loader2 } from 'lucide-react'

const initialState: ApplyCodeState = {}

export function PromoCodeInput() {
  const [state, formAction] = useFormState(applyCode, initialState)
  const [code, setCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [preview, setPreview] = useState<ValidateCodeResult['promoCode'] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

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
        return `+${value} días de trial extra`
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TicketIcon className="w-5 h-5 text-[#0F4C5C]" />
        <h3 className="font-medium text-[#0F172A] dark:text-white">
          ¿Tienes un código de prueba?
        </h3>
      </div>

      <p className="text-sm text-[#475569] dark:text-slate-400 mb-4">
        Ingresa tu código promocional para obtener días extra de prueba o descuentos.
      </p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="Ej: PRUEBA30"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-slate-600 rounded-lg text-sm font-mono uppercase bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent transition-all"
            aria-label="Código promocional"
          />
          {validating && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F4C5C] animate-spin" />
          )}
        </div>
        <button
          type="button"
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="px-4 py-2.5 border border-[#E2E8F0] dark:border-slate-600 rounded-lg text-sm font-medium text-[#0F172A] dark:text-white hover:bg-[#FAFAF9] dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Validar
        </button>
      </div>

      {validationError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
          <XCircleIcon className="w-4 h-4" />
          {validationError}
        </div>
      )}

      {preview && (
        <div className="mt-3 p-3 bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[#16A34A]" />
            <p className="text-sm font-medium text-[#16A34A]">Código válido</p>
          </div>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
            {getTypeLabel(preview.type, preview.value)}
          </p>
          <form action={formAction} className="mt-3">
            <input type="hidden" name="code" value={code} />
            <ApplyButton />
          </form>
        </div>
      )}

      {state.error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
          <XCircleIcon className="w-4 h-4" />
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#16A34A]">
          <CheckCircleIcon className="w-4 h-4" />
          ¡Código aplicado exitosamente!
        </div>
      )}
    </div>
  )
}

function ApplyButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-[#0F4C5C] text-white rounded-lg text-sm font-medium hover:bg-[#0C3E4A] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
    >
      {pending ? 'Aplicando...' : 'Aplicar código'}
    </button>
  )
}