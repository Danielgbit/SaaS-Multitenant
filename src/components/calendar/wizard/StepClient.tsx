'use client'

import { useState, useMemo } from 'react'
import { User, Search, X, ChevronRight, Phone, Plus } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { createClientAction } from '@/actions/clients/createClient'
import type { CalendarColors, Client } from '@/types/calendar'

interface StepClientProps {
  COLORS: CalendarColors
  clientSearch: string
  showClientDropdown: boolean
  clients: Client[]
  organizationId: string
  clientInputRef: React.RefObject<HTMLInputElement | null>
  onSetClientSearch: (search: string) => void
  onSetShowClientDropdown: (show: boolean) => void
  onClientCreated: (clientId: string, clientName: string) => void
  onClientSelected: (client: Client) => void
}

export function StepClient({
  COLORS,
  clientSearch,
  showClientDropdown,
  clients,
  organizationId,
  clientInputRef,
  onSetClientSearch,
  onSetShowClientDropdown,
  onClientCreated,
  onClientSelected,
}: StepClientProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickPhone, setQuickPhone] = useState('')
  const [quickCreating, setQuickCreating] = useState(false)
  const [quickError, setQuickError] = useState<string | null>(null)

  const filteredClients = useMemo(
    () => clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clients, clientSearch]
  )

  const showCreateOption = clientSearch.length >= 2 && filteredClients.length === 0 && !showQuickAdd

  const handleQuickCreate = async () => {
    if (!quickName.trim()) {
      setQuickError('El nombre es requerido')
      return
    }
    setQuickCreating(true)
    setQuickError(null)
    try {
      const result = await createClientAction({
        organization_id: organizationId,
        name: quickName.trim(),
        phone: quickPhone.trim() || undefined,
        confirmation_method: 'in_person',
        confirmations_enabled: false,
      })
      if (result.error) {
        setQuickError(result.error)
        return
      }
      if (result.clientId) {
        onClientCreated(result.clientId, quickName.trim())
        setShowQuickAdd(false)
        setQuickName('')
        setQuickPhone('')
      }
    } catch {
      setQuickError('Error al crear cliente')
    } finally {
      setQuickCreating(false)
    }
  }

  return (
    <div
      className="space-y-5 animate-in slide-in-from-right-2 duration-200"
    >
      <div className="text-center">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: COLORS.primary + '15' }}
        >
          <User className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: COLORS.primary }} />
        </div>
        <h4 className="text-lg sm:text-xl font-semibold mb-1 font-heading" style={{ color: COLORS.textPrimary }}>
          ¿Para quién?
        </h4>
        <p className="text-xs sm:text-sm" style={{ color: COLORS.textSecondary }}>
          Selecciona o crea el cliente de la reserva
        </p>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
          <Search className="w-4 h-4" />
          Buscar cliente
        </label>
        <div className="relative">
          <input
            ref={clientInputRef}
            type="text"
            placeholder="Nombre del cliente..."
            value={clientSearch}
            onChange={e => { onSetClientSearch(e.target.value); onSetShowClientDropdown(true); setShowQuickAdd(false) }}
            onFocus={() => onSetShowClientDropdown(true)}
            className="w-full px-4 py-3 sm:py-3.5 pl-11 rounded-xl border-2 transition-all duration-200 focus:outline-none"
            style={{
              borderColor: showClientDropdown ? COLORS.primary : COLORS.border,
              backgroundColor: COLORS.surface,
              color: COLORS.textPrimary,
              boxShadow: showClientDropdown ? `0 0 0 3px ${COLORS.primary}20` : 'none'
            }}
          />
          <User className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLORS.textMuted }} />
          {clientSearch && (
            <button
              onClick={() => { onSetClientSearch(''); onSetShowClientDropdown(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: COLORS.textMuted }} />
            </button>
          )}
        </div>

        {showClientDropdown && (
          <div className="mt-2 rounded-xl border-2 overflow-hidden shadow-xl max-h-64 overflow-y-auto" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            {filteredClients.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                  Clientes existentes
                </div>
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onClientSelected(c)}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: COLORS.textPrimary }}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0" style={{ backgroundColor: COLORS.primary + '20', color: COLORS.primary }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{c.name}</p>
                      {c.phone && (
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.textMuted }}>
                          <Phone className="w-3 h-3" /> {c.phone}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.textMuted }} />
                  </button>
                ))}
              </div>
            )}

            {showCreateOption && (
              <button
                onClick={() => { setShowQuickAdd(true); setQuickName(clientSearch) }}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5 border-t"
                style={{ borderColor: COLORS.border }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.success + '20' }}>
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.success }} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: COLORS.success }}>Crear &ldquo;{clientSearch}&rdquo;</p>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>Cliente nuevo con este nombre</p>
                </div>
              </button>
            )}

            {!filteredClients.length && !showCreateOption && clientSearch.length >= 2 && (
              <div className="px-4 py-8 text-center">
                <User className="w-8 h-8 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                <p className="text-sm" style={{ color: COLORS.textMuted }}>Escribe para buscar o crear un cliente</p>
              </div>
            )}

            {clientSearch.length < 2 && (
              <div className="px-4 py-3 text-xs" style={{ color: COLORS.textMuted }}>
                Escribe al menos 2 caracteres para buscar
              </div>
            )}
          </div>
        )}
      </div>

      {showQuickAdd && (
        <div className="rounded-xl border-2 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200" style={{ borderColor: COLORS.success + '40', backgroundColor: COLORS.success + '08' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.success }} />
            <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>Nuevo cliente</span>
          </div>
          <input
            type="text"
            value={quickName}
            onChange={e => setQuickName(e.target.value)}
            placeholder="Nombre completo *"
            className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary, boxShadow: `0 0 0 1px ${COLORS.success}20` }}
            autoFocus
          />
          <input
            type="tel"
            value={quickPhone}
            onChange={e => setQuickPhone(e.target.value)}
            placeholder="Teléfono (opcional)"
            className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface, color: COLORS.textPrimary }}
          />
          {quickError && (
            <p className="text-xs font-medium" style={{ color: COLORS.error }}>{quickError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowQuickAdd(false); setQuickError(null) }}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}
            >
              Cancelar
            </button>
            <button
              onClick={handleQuickCreate}
              disabled={quickCreating || !quickName.trim()}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: COLORS.success, color: '#FFF', opacity: (quickCreating || !quickName.trim()) ? 0.6 : 1 }}
            >
              {quickCreating ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
              {quickCreating ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
