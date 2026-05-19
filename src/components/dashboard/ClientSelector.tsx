'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X, User } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { searchClients } from '@/services/clients/getClients'
import { createClientAction } from '@/actions/clients/createClient'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientSelectorProps {
  organizationId: string
  value?: string // client ID
  onChange: (clientId: string, clientName: string) => void
  placeholder?: string
}

export function ClientSelector({
  organizationId,
  value,
  onChange,
  placeholder = 'Buscar cliente...',
}: ClientSelectorProps) {
  const [query, setQuery] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const COLORS = useThemeColors()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Buscar clientes cuando cambia el query
  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setClients([])
        return
      }

      setIsLoading(true)
      try {
        const results = await searchClients(organizationId, query)
        setClients(results)
      } catch (err) {
        console.error('Error searching:', err)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [query, organizationId])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Seleccionar cliente
  function handleSelect(client: Client) {
    onChange(client.id, client.name)
    setQuery(client.name)
    setIsOpen(false)
    setShowCreate(false)
    setError(null)
  }

  // Crear nuevo cliente
  async function handleCreate() {
    if (!newClientName.trim()) {
      setError('El nombre es requerido')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await createClientAction({
        organization_id: organizationId,
        name: newClientName.trim(),
        phone: newClientPhone.trim() || undefined,
        confirmation_method: 'in_person',
        confirmations_enabled: false,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.clientId) {
        onChange(result.clientId, newClientName.trim())
        setQuery(newClientName.trim())
        setNewClientName('')
        setNewClientPhone('')
        setShowCreate(false)
        setIsOpen(false)
      }
    } catch (err) {
      setError('Error al crear cliente')
    } finally {
      setIsCreating(false)
    }
  }

  // Mostrar opción de crear si no hay resultados y hay query
  const showCreateOption = query.length >= 2 && clients.length === 0 && !showCreate

  return (
    <div ref={containerRef} className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
          style={{ color: COLORS.textSecondary }} 
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setShowCreate(false)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            borderRadius: '10px',
            borderColor: COLORS.border,
            padding: '12px 40px 12px 40px',
            backgroundColor: COLORS.surface,
            color: COLORS.textPrimary,
          }}
          className="w-full border focus:outline-none focus:ring-2 transition-all placeholder:text-opacity-60"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setClients([])
              setShowCreate(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            style={{ color: COLORS.textSecondary }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 shadow-lg max-h-64 overflow-y-auto"
          style={{
            borderRadius: COLORS.radius.lg,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Spinner size="sm" className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
          )}

          {!isLoading && clients.length > 0 && (
            <ul>
              {clients.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(client)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left hover:bg-slate-50"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.primaryLight }}
                    >
                      <User 
                        className="w-4 h-4" 
                        style={{ color: COLORS.primary }} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p 
                        className="font-medium truncate"
                        style={{ color: COLORS.textPrimary }}
                      >
                        {client.name}
                      </p>
                      {(client.phone || client.email) && (
                        <p 
                          className="text-xs truncate"
                          style={{ color: COLORS.textSecondary }}
                        >
                          {client.phone || client.email}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Opción de crear nuevo */}
          {showCreateOption && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-t border-slate-100 dark:border-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Crear &quot;{query}&quot;
              </span>
            </button>
          )}

          {/* Formulario de creación */}
          {showCreate && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nuevo cliente
              </p>
              
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Nombre completo *"
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: COLORS.border, '--tw-ring-color': COLORS.primary } as React.CSSProperties}
                autoFocus
              />

              <input
                type="tel"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: COLORS.border, '--tw-ring-color': COLORS.primary } as React.CSSProperties}
              />

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating || !newClientName.trim()}
                  className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: COLORS.primary, color: 'white' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  {isCreating && <Spinner size="sm" className="w-3 h-3" />}
                  Crear
                </button>
              </div>
            </div>
          )}

          {/* Sin resultados */}
          {!isLoading && query.length >= 2 && clients.length === 0 && !showCreateOption && (
            <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron clientes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
