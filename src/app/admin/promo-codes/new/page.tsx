'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { createCode, type CreateCodeState } from '@/actions/admin/promoCodes/createCode'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const CODE_TYPES = [
  { value: 'trial_extension', label: 'Extensión de Trial (+días)', description: 'Agrega días extra al trial' },
  { value: 'grace_period', label: 'Período de Gracia (+días)', description: 'Días extra para pagar' },
  { value: 'free_month', label: 'Mes Gratis', description: 'Primer mes sin costo' },
  { value: 'discount', label: 'Descuento (%)', description: 'Porcentaje de descuento' },
] as const

const initialState: CreateCodeState = {}

export default function NewPromoCodePage() {
  const [state, formAction] = useFormState(createCode, initialState)
  const router = useRouter()
  const { pending } = useFormStatus()

  useEffect(() => {
    if (state.success) {
      router.push('/admin/promo-codes')
    }
  }, [state.success, router])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/promo-codes"
          className="inline-flex items-center gap-2 text-sm text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Volver a códigos
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-6">
        <h1
          className="text-2xl font-semibold text-[#0F172A] dark:text-white mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Crear Código Promocional
        </h1>

        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Código
              </label>
              <input
                type="text"
                id="code"
                name="code"
                required
                minLength={3}
                maxLength={50}
                placeholder="Ej: PRUEBA30"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-md text-sm font-mono uppercase bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Nombre descriptivo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={255}
                placeholder="Ej: Demo cliente XYZ"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-3">
              Tipo de código
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CODE_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-start gap-3 p-3 border border-[#E2E8F0] dark:border-slate-600 rounded-lg cursor-pointer hover:bg-[#FAFAF9] dark:hover:bg-slate-900 transition-colors has-[:checked]:border-[#0F4C5C] has-[:checked]:bg-[#0F4C5C]/5"
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    required
                    className="mt-1 w-4 h-4 text-[#0F4C5C] cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-medium text-[#0F172A] dark:text-white">{type.label}</p>
                    <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Valor (días o porcentaje)
              </label>
              <input
                type="number"
                id="value"
                name="value"
                required
                min={1}
                placeholder="Ej: 30"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="maxUses" className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Usos máximos (vacío = ilimitado)
              </label>
              <input
                type="number"
                id="maxUses"
                name="maxUses"
                min={1}
                placeholder="Ej: 10"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Fecha de expiración del código (opcional)
              </label>
              <input
                type="datetime-local"
                id="expiresAt"
                name="expiresAt"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                Válido hasta (opcional)
              </label>
              <input
                type="datetime-local"
                id="validUntil"
                name="validUntil"
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-transparent"
              />
            </div>
          </div>

          {state.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0] dark:border-slate-700">
            <Link
              href="/admin/promo-codes"
              className="px-4 py-2 text-sm font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 bg-[#0F4C5C] text-white rounded-md text-sm font-medium hover:bg-[#0C3E4A] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {pending ? 'Creando...' : 'Crear código'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}