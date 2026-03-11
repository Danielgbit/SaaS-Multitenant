'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserCircle, Search } from 'lucide-react'
import { ClientCard } from './ClientCard'
import { EditClientModal } from './EditClientModal'
import { DeleteClientModal } from './DeleteClientModal'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientsClientProps {
  clients: Client[]
  organizationId: string
}

// Design system tokens (light mode only)
const DS = {
  primary: '#0F4C5C',
  primaryHover: '#0C3E4A',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  radius: {
    lg: '16px',
    md: '10px',
  },
}

export function ClientsClient({ clients, organizationId }: ClientsClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active'>('all')
  
  // Modal states
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Combined modal open state
  const isModalOpen = isCreating || editingClient !== null

  // Filter clients
  const filtered = clients
    .filter((c) => {
      const matchesSearch = 
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.phone ?? '').includes(query) ||
        (c.email ?? '').toLowerCase().includes(query.toLowerCase())
      
      if (filter === 'active') {
        // Since there's no active field, we show all
        return matchesSearch
      }
      
      return matchesSearch
    })

  // Refresh handler (revalidates page)
  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p 
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.primary 
            }}
          >
            Gestión de clientes
          </p>
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: DS.textPrimary 
            }}
          >
            Clientes
          </h1>
          <p 
            className="text-sm mt-1"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
          >
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: DS.radius.md,
            backgroundColor: DS.primary,
            color: '#FFFFFF',
            padding: '12px 24px',
          }}
          className="font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-[#0F4C5C]/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: DS.textSecondary }} 
          />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: DS.radius.md,
              borderColor: DS.border,
              padding: '12px 16px 12px 44px',
              color: DS.textPrimary,
            }}
            className="w-full border focus:outline-none focus:ring-2 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div 
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: DS.radius.md,
            border: `1px solid ${DS.border}`,
          }}
          className="flex overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '12px 16px',
              backgroundColor: filter === 'all' ? DS.primary : 'transparent',
              color: filter === 'all' ? '#FFFFFF' : DS.textSecondary,
            }}
            className="text-sm font-medium transition-colors"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            style={{
              padding: '12px 16px',
              backgroundColor: filter === 'active' ? DS.primary : 'transparent',
              color: filter === 'active' ? '#FFFFFF' : DS.textSecondary,
            }}
            className="text-sm font-medium transition-colors"
          >
            Activos
          </button>
        </div>
      </div>

      {/* ── Clients Grid ── */}
      {clients.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ 
            backgroundColor: DS.surface,
            border: `1px solid ${DS.border}`
          }}
        >
          <UserCircle 
            className="w-12 h-12 mx-auto mb-4" 
            style={{ color: DS.textSecondary, opacity: 0.5 }} 
          />
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
            className="font-medium mb-2"
          >
            No hay clientes todavía
          </p>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
            className="text-sm opacity-80"
          >
            Los clientes se crearán automáticamente cuando reserves una cita.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ 
            backgroundColor: DS.surface,
            border: `1px solid ${DS.border}`
          }}
        >
          <Search 
            className="w-10 h-10 mx-auto mb-4" 
            style={{ color: DS.textSecondary, opacity: 0.5 }} 
          />
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
            className="font-medium"
          >
            No se encontraron clientes
          </p>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
            className="text-sm mt-1 opacity-80"
          >
            Intenta con otros términos de búsqueda.
          </p>
        </div>
      ) : (
        <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
          }}
        >
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={setEditingClient}
              onDelete={setDeletingClient}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {(isCreating || editingClient) && (
        <EditClientModal
          client={editingClient}
          organizationId={organizationId}
          isOpen={isModalOpen}
          onClose={() => {
            setEditingClient(null)
            setIsCreating(false)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {deletingClient && (
        <DeleteClientModal
          client={deletingClient}
          organizationId={organizationId}
          isOpen={!!deletingClient}
          onClose={() => setDeletingClient(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
