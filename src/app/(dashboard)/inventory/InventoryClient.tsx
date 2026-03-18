'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Search, AlertTriangle, FolderOpen, ChevronDown, X, Loader2 } from 'lucide-react'
import { InventoryCard } from './InventoryCard'
import { InventoryFormModal } from './InventoryFormModal'
import { DeleteInventoryModal } from './DeleteInventoryModal'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

interface InventoryClientProps {
  items: InventoryItem[]
  categories: string[]
  organizationId: string
}

const DS = {
  primary: '#0F4C5C',
  primaryHover: '#0C3E4A',
  surface: '#FFFFFF',
  surfaceDark: '#1E293B',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderDark: '#334155',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#10B981',
  successLight: '#D1FAE5',
  radius: {
    lg: '16px',
    md: '10px',
    sm: '8px',
  },
}

type FilterType = 'all' | 'lowStock' | 'criticalStock' | 'category'

export function InventoryClient({ items, categories, organizationId }: InventoryClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const isModalOpen = isCreating || editingItem !== null

  // Calcular estadísticas
  const totalItems = items.length
  const lowStockCount = items.filter((item) => item.quantity > 0 && item.quantity <= item.min_quantity).length
  const criticalStockCount = items.filter((item) => item.quantity === 0).length

  // Filtrar items
  const filtered = items.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.sku ?? '').toLowerCase().includes(query.toLowerCase())
    
    if (!matchesSearch) return false

    if (filter === 'lowStock') {
      return item.quantity > 0 && item.quantity <= item.min_quantity
    }

    if (filter === 'criticalStock') {
      return item.quantity === 0
    }

    if (filter === 'category' && selectedCategory) {
      return item.category === selectedCategory
    }

    return true
  })

  // Debounce para búsqueda
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [query, filter, selectedCategory])

  function handleSuccess() {
    router.refresh()
  }

  function handleFilterChange(newFilter: FilterType, category?: string) {
    setFilter(newFilter)
    if (category) {
      setSelectedCategory(category)
    } else {
      setSelectedCategory('')
    }
    setIsCategoryOpen(false)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p 
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.primary 
            }}
          >
            Gestión de inventario
          </p>
          <h1 
            className="text-3xl font-bold tracking-tight"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: 'var(--text-primary, #0F172A)' 
            }}
          >
            Inventario
          </h1>
          <p 
            className="text-sm mt-1"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
          >
            {totalItems} producto{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                • {lowStockCount} con stock bajo
              </span>
            )}
            {criticalStockCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                • {criticalStockCount} sin stock
              </span>
            )}
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
          className="font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#0F4C5C]/20 hover:shadow-xl hover:shadow-[#0F4C5C]/30 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search 
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" 
            style={{ color: query ? DS.primary : DS.textSecondary }} 
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-3 h-3" style={{ color: DS.textSecondary }} />
            </button>
          )}
          <input
            type="text"
            placeholder="Buscar productos por nombre o SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: DS.radius.md,
              borderColor: query ? DS.primary : DS.border,
              padding: '12px 40px 12px 44px',
              color: DS.textPrimary,
            }}
            className="w-full border-2 focus:outline-none transition-all duration-200"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {/* All */}
          <button
            type="button"
            onClick={() => handleFilterChange('all')}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: DS.radius.md,
              padding: '10px 16px',
              backgroundColor: filter === 'all' ? DS.primary : 'transparent',
              color: filter === 'all' ? '#FFFFFF' : DS.textSecondary,
              border: filter === 'all' ? 'none' : `1px solid ${DS.border}`,
            }}
            className="text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:border-slate-300"
          >
            <Package className="w-4 h-4" />
            Todos
            <span 
              className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: filter === 'all' ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: filter === 'all' ? '#FFFFFF' : DS.textSecondary
              }}
            >
              {totalItems}
            </span>
          </button>

          {/* Low Stock */}
          <button
            type="button"
            onClick={() => handleFilterChange('lowStock')}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: DS.radius.md,
              padding: '10px 16px',
              backgroundColor: filter === 'lowStock' ? DS.warning : 'transparent',
              color: filter === 'lowStock' ? '#FFFFFF' : DS.warning,
              border: filter === 'lowStock' ? 'none' : `1px solid ${DS.warning}40`,
            }}
            className="text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:bg-amber-50"
          >
            <AlertTriangle className="w-4 h-4" />
            Stock bajo
            {lowStockCount > 0 && (
              <span 
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: filter === 'lowStock' ? 'rgba(255,255,255,0.2)' : DS.warningLight,
                  color: filter === 'lowStock' ? '#FFFFFF' : DS.warning
                }}
              >
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Critical Stock */}
          <button
            type="button"
            onClick={() => handleFilterChange('criticalStock')}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: DS.radius.md,
              padding: '10px 16px',
              backgroundColor: filter === 'criticalStock' ? DS.danger : 'transparent',
              color: filter === 'criticalStock' ? '#FFFFFF' : DS.danger,
              border: filter === 'criticalStock' ? 'none' : `1px solid ${DS.danger}40`,
            }}
            className="text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:bg-red-50"
          >
            <AlertTriangle className="w-4 h-4" />
            Sin stock
            {criticalStockCount > 0 && (
              <span 
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: filter === 'criticalStock' ? 'rgba(255,255,255,0.2)' : DS.dangerLight,
                  color: filter === 'criticalStock' ? '#FFFFFF' : DS.danger
                }}
              >
                {criticalStockCount}
              </span>
            )}
          </button>

          {/* Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: DS.radius.md,
                padding: '10px 16px',
                backgroundColor: filter === 'category' ? DS.primary : 'transparent',
                color: filter === 'category' ? '#FFFFFF' : DS.textSecondary,
                border: filter === 'category' ? 'none' : `1px solid ${DS.border}`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:border-slate-300"
            >
              <FolderOpen className="w-4 h-4" />
              {selectedCategory || 'Categoría'}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryOpen && (
              <div 
                className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl border z-50 overflow-hidden"
                style={{ 
                  backgroundColor: DS.surface,
                  borderColor: DS.border,
                }}
              >
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange('all', '')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
                    style={{ color: DS.textPrimary }}
                  >
                    Todas las categorías
                  </button>
                  {categories.length === 0 ? (
                    <p 
                      className="px-3 py-2 text-sm"
                      style={{ color: DS.textMuted }}
                    >
                      No hay categorías
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleFilterChange('category', cat)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                        style={{ 
                          color: selectedCategory === cat ? DS.primary : DS.textPrimary,
                          backgroundColor: selectedCategory === cat ? '#F0F9FF' : 'transparent'
                        }}
                      >
                        {cat}
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: DS.border,
                            color: DS.textSecondary
                          }}
                        >
                          {items.filter(i => i.category === cat).length}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      {query && (
        <p className="text-sm mb-4" style={{ color: DS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
        </p>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: DS.primary }} />
        </div>
      ) : items.length === 0 ? (
        /* Empty State - No products */
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ 
            backgroundColor: DS.surface,
            border: `1px solid ${DS.border}`
          }}
        >
          <div 
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#F0F9FF' }}
          >
            <Package className="w-10 h-10" style={{ color: DS.primary }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: DS.textPrimary 
            }}
          >
            Inventario vacío
          </h3>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
            className="text-sm mb-6 max-w-sm mx-auto"
          >
            Comienza agregando productos a tu inventario para llevar el control de stock.
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              backgroundColor: DS.primary,
              color: '#FFFFFF',
            }}
          >
            <Plus className="w-4 h-4" />
            Agregar primer producto
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State - No results */
        <div 
          className="text-center py-16 rounded-2xl"
          style={{ 
            backgroundColor: DS.surface,
            border: `1px solid ${DS.border}`
          }}
        >
          <Search 
            className="w-12 h-12 mx-auto mb-4" 
            style={{ color: DS.textMuted }} 
          />
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: DS.textPrimary 
            }}
          >
            No se encontraron productos
          </h3>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
            className="text-sm mb-4"
          >
            Intenta con otros términos de búsqueda o verifica los filtros.
          </p>
          <div className="flex gap-2 justify-center">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.primary,
                  border: `1px solid ${DS.primary}`
                }}
              >
                Limpiar búsqueda
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                backgroundColor: DS.primary,
                color: '#FFFFFF',
              }}
            >
              Ver todos los productos
            </button>
          </div>
        </div>
      ) : (
        /* Products Grid */
        <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
          }}
        >
          {filtered.map((item, index) => (
            <div 
              key={item.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <InventoryCard
                item={item}
                onEdit={setEditingItem}
                onDelete={setDeletingItem}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {(isCreating || editingItem) && (
        <InventoryFormModal
          item={editingItem}
          categories={categories}
          organizationId={organizationId}
          isOpen={isModalOpen}
          onClose={() => {
            setEditingItem(null)
            setIsCreating(false)
          }}
          onSuccess={handleSuccess}
        />
      )}

      {deletingItem && (
        <DeleteInventoryModal
          item={deletingItem}
          organizationId={organizationId}
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onSuccess={handleSuccess}
        />
      )}

      {/* Click outside to close dropdown */}
      {isCategoryOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsCategoryOpen(false)} 
        />
      )}
    </>
  )
}
