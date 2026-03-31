'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Link2, Copy, Check, Mail, Clock, AlertTriangle, Loader2, Send } from 'lucide-react'
import type { Employee } from '@/types/employees'
import type { Invitation } from '@/types/invitations'

interface InvitationLinkModalProps {
  employee: Employee
  invitation: Invitation
  onClose: () => void
  onResend: () => Promise<void>
}

function formatDate(dateString: string): { formatted: string; daysLeft: number; isExpiringSoon: boolean } {
  const expiresDate = new Date(dateString)
  const now = new Date()
  const diffTime = expiresDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const formatted = expiresDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  
  return {
    formatted,
    daysLeft: diffDays,
    isExpiringSoon: diffDays <= 3 && diffDays > 0
  }
}

export function InvitationLinkModal({
  employee,
  invitation,
  onClose,
  onResend,
}: InvitationLinkModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const baseUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
    : 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/invite/${invitation.token}`
  
  const dateInfo = formatDate(invitation.expires_at)
  const isExpired = dateInfo.daysLeft <= 0

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  function handleCopy() {
    navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleResend() {
    setIsResending(true)
    try {
      await onResend()
    } finally {
      setIsResending(false)
    }
  }

  if (!isMounted) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invitation-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-slate-100/60 dark:border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#0F4C5C] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h2
                id="invitation-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
              >
                Invitación para {employee.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparte este link para que pueda acceder
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status info */}
          <div className="flex flex-wrap items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            {invitation.email ? (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Enviado a: <span className="font-medium">{invitation.email}</span></span>
                <Check className="w-4 h-4 text-emerald-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Sin email - comparte el link manualmente</span>
              </div>
            )}
            
            <div className={`flex items-center gap-2 text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : dateInfo.isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <Clock className="w-4 h-4" />
              {isExpired ? (
                <span className="font-medium">Esta invitación ha expirado</span>
              ) : dateInfo.daysLeft === 1 ? (
                <span>Expira mañana</span>
              ) : dateInfo.daysLeft <= 7 ? (
                <span>Expira en {dateInfo.daysLeft} días - {dateInfo.formatted}</span>
              ) : (
                <span>Expira: {dateInfo.formatted}</span>
              )}
            </div>
          </div>

          {/* Link section */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Link para compartir
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={invitationUrl}
                  className="
                    w-full px-4 py-3 pr-12 rounded-xl
                    border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-900
                    text-sm text-slate-700 dark:text-slate-200
                    font-mono
                    focus:outline-none
                    truncate
                  "
                />
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={copied}
                className={`
                  px-4 py-3 rounded-xl font-medium text-sm
                  transition-all duration-200 cursor-pointer
                  flex items-center gap-2
                  ${copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-[#0F4C5C] hover:bg-[#0C3E4A] text-white active:scale-[0.98]'
                  }
                `}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compártelo por WhatsApp, SMS o cualquier otra vía
            </p>
          </div>

          {/* Warning for expired/expiring */}
          {dateInfo.isExpiringSoon && !isExpired && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Esta invitación expira pronto. Si el empleado no la recibe, considera crear una nueva.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100/60 dark:border-slate-700/40 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || !invitation.email}
              className="
                flex-1 px-4 py-2.5 rounded-xl font-medium text-sm
                border border-[#0F4C5C]/20 dark:border-[#38BDF8]/20
                bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10
                text-[#0F4C5C] dark:text-[#38BDF8]
                hover:bg-[#0F4C5C]/20 dark:hover:bg-[#38BDF8]/20
                transition-all duration-200 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Reenviar email</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 px-4 py-2.5 rounded-xl font-medium text-sm
                border border-slate-200 dark:border-slate-700
                text-slate-700 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition-all duration-200 cursor-pointer
              "
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
