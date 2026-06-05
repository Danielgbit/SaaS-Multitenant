'use client'
import { useState, useEffect } from 'react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { Plus, Users, Minus, X, Download, RefreshCw, Loader2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface CashSessionFABProps {
  onNewEntry: () => void
  onPayEmployee: () => void
  onCloseSession: () => void | Promise<void>
  onExport: () => void
  onRefresh: () => void
  canManage: boolean
  canAdmin: boolean
  isOpen: boolean
  isClosing: boolean
  isExporting?: boolean
}

export function CashSessionFAB({
  onNewEntry,
  onPayEmployee,
  onCloseSession,
  onExport,
  onRefresh,
  canManage,
  canAdmin,
  isOpen,
  isClosing,
  isExporting = false,
}: CashSessionFABProps) {
  const COLORS = useThemeColors()
  const [open, setOpen] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setShowCloseConfirm(false) } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  if (!canManage) return null

  const handleCloseConfirm = () => {
    setOpen(false)
    setShowCloseConfirm(false)
    onCloseSession()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
        style={{ backgroundColor: COLORS.primary, color: '#fff' }}
        aria-label="Abrir menu de acciones"
      >
        <Plus className="w-6 h-6" />
      </button>

      {open && (
        <div
          className="sm:hidden fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: COLORS.overlay }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-md rounded-t-2xl p-4 pb-8 max-h-[70vh] overflow-y-auto scrollbar-hide animate-slide-up"
            style={{ backgroundColor: COLORS.surface, boxShadow: COLORS.shadow.xl }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: COLORS.textPrimary }}>Acciones</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSubtle }}
                aria-label="Cerrar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { setOpen(false); onNewEntry() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                style={{ backgroundColor: COLORS.primary, color: '#fff' }}
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Nuevo gasto</span>
              </button>

              {canAdmin && (
                <button
                  onClick={() => { setOpen(false); onPayEmployee() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all hover:bg-opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                  style={{ borderColor: COLORS.border, color: COLORS.textPrimary, backgroundColor: COLORS.surface }}
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Pagar empleado</span>
                </button>
              )}

              <button
                onClick={() => { setOpen(false); onExport() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all hover:bg-opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8] disabled:opacity-50"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary, backgroundColor: COLORS.surface }}
                disabled={isExporting}
                aria-busy={isExporting}
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span className="text-sm font-medium">Exportar CSV</span>
              </button>

              <button
                onClick={() => { setOpen(false); onRefresh() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all hover:bg-opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary, backgroundColor: COLORS.surface }}
              >
                <RefreshCw className="w-5 h-5" />
                <span className="text-sm font-medium">Actualizar</span>
              </button>

              {isOpen && (
                <button
                  onClick={() => { setOpen(false); setShowCloseConfirm(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] focus-visible:ring-offset-2 dark:focus-visible:ring-[#38BDF8]"
                  style={{ backgroundColor: COLORS.warning, color: '#fff' }}
                  disabled={isClosing}
                >
                  <Minus className="w-5 h-5" />
                  <span className="text-sm font-medium">{isClosing ? 'Cerrando...' : 'Cerrar caja'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCloseConfirm && (
        <ConfirmModal
          isOpen={showCloseConfirm}
          title="Cerrar caja"
          description="¿Cerrar la caja del día? Asegúrate de haber contado el efectivo y registrado todos los gastos."
          confirmText="Cerrar caja"
          variant="warning"
          onConfirm={async () => { handleCloseConfirm() }}
          onClose={() => setShowCloseConfirm(false)}
          loading={isClosing}
        />
      )}
    </>
  )
}
