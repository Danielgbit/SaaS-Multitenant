'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Plus, UserCircle, Search, Users, Sparkles } from 'lucide-react'
import { ClientCard } from './ClientCard'
import { EditClientModal } from './EditClientModal'
import { DeleteClientModal } from './DeleteClientModal'
import type { Database } from '@/../types/supabase'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientsClientProps {
  clients: Client[]
  organizationId: string
}

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
    isDark,
  }
}

export function ClientsClient({ clients, organizationId }: ClientsClientProps) {
  const router = useRouter()
  const COLORS = useColors()
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
        return matchesSearch
      }
      
      return matchesSearch
    })

  // Refresh handler
  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      {/* Header with gradient */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
        style={{ 
          background: COLORS.primaryGradient,
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p 
                className="text-xs font-semibold uppercase tracking-widest text-white/80"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Gestión de clientes
              </p>
              <h1 
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Clientes
              </h1>
              <p 
                className="text-sm mt-1 text-white/80"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: '#FFFFFF',
              color: COLORS.primary,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </button>
        </div>
      </div>

      {/* Search & Filters with glassmorphism */}
      <div 
        className="flex flex-col lg:flex-row gap-4 mb-6 p-4 rounded-2xl"
        style={{ 
          backgroundColor: COLORS.surfaceGlass,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${COLORS.border}`
        }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" 
            style={{ color: COLORS.textMuted }} 
          />
          <input
            type="text"
            placeholder="Buscar clientes por nombre, teléfono o email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: '10px',
              borderColor: COLORS.border,
              padding: '12px 16px 12px 44px',
              color: COLORS.textPrimary,
              backgroundColor: COLORS.surface,
            }}
            className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div 
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: '10px',
            border: `1px solid ${COLORS.border}`,
          }}
          className="flex overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              padding: '12px 20px',
              backgroundColor: filter === 'all' ? COLORS.primary : 'transparent',
              color: filter === 'all' ? '#FFFFFF' : COLORS.textSecondary,
            }}
            className="text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            style={{
              padding: '12px 20px',
              backgroundColor: filter === 'active' ? COLORS.primary : 'transparent',
              color: filter === 'active' ? '#FFFFFF' : COLORS.textSecondary,
            }}
            className="text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            Activos
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ 
            backgroundColor: COLORS.surfaceGlass,
            border: `1px solid ${COLORS.border}`,
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.primary + '15' }}>
            <UserCircle 
              className="w-10 h-10" 
              style={{ color: COLORS.primary }} 
            />
          </div>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textPrimary 
            }}
            className="font-semibold text-lg mb-2"
          >
            No hay clientes todavía
          </p>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textSecondary 
            }}
            className="text-sm mb-6"
          >
            Los clientes se crearán automáticamente cuando reserves una cita.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: COLORS.primary,
              color: '#FFFFFF'
            }}
          >
            <Plus className="w-4 h-4" />
            Crear primer cliente
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ 
            backgroundColor: COLORS.surfaceGlass,
            border: `1px solid ${COLORS.border}`,
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: COLORS.surfaceSubtle }}>
            <Search 
              className="w-10 h-10" 
              style={{ color: COLORS.textMuted }} 
            />
          </div>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textPrimary 
            }}
            className="font-semibold text-lg mb-2"
          >
            No se encontraron clientes
          </p>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textSecondary 
            }}
            className="text-sm"
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
          {filtered.map((client, index) => (
            <div 
              key={client.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ClientCard
                client={client}
                onEdit={setEditingClient}
                onDelete={setDeletingClient}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
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
