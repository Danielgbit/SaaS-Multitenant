'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Search, AlertTriangle, FolderOpen, ChevronDown, X, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { InventoryCard } from './InventoryCard'
import { InventoryFormModal } from './InventoryFormModal'
import { DeleteInventoryModal } from './DeleteInventoryModal'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

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
    warning: '#F59E0B',
    warningLight: isDark ? '#451A03' : '#FEF3C7',
    danger: '#DC2626',
    dangerLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}

interface InventoryClientProps {
  items: InventoryItem[]
  categories: string[]
  organizationId: string
}

type FilterType = 'all' | 'lowStock' | 'criticalStock' | 'category'

export function InventoryClient({ items, categories, organizationId }: InventoryClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const COLORS = useColors()

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const isModalOpen = isCreating || editingItem !== null

  const totalItems = items.length
  const lowStockCount = items.filter((item) => item.quantity > 0 && item.quantity <= item.min_quantity).length
  const criticalStockCount = items.filter((item) => item.quantity === 0).length

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
      {/* Header con gradiente */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
        style={{ background: COLORS.primaryGradient }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Gestión de inventario</p>
              <h1 
                className="text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Inventario
              </h1>
              <p className="text-sm mt-1 text-white/80">
                {totalItems} producto{totalItems !== 1 ? 's' : ''} registrado{totalItems !== 1 ? 's' : ''}
                {lowStockCount > 0 && (
                  <span className="ml-2">• {lowStockCount} con stock bajo</span>
                )}
                {criticalStockCount > 0 && (
                  <span className="ml-2">• {criticalStockCount} sin stock</span>
                )}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* Search & Filters - Glassmorphism */}
      <div 
        className="p-4 rounded-2xl mb-6"
        style={{ 
          backgroundColor: COLORS.surfaceGlass,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${COLORS.border}`
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search 
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" 
              style={{ color: query ? COLORS.primary : COLORS.textMuted }} 
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3 h-3" style={{ color: COLORS.textMuted }} />
              </button>
            )}
            <input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '10px',
                borderColor: COLORS.border,
                padding: '12px 40px 12px 44px',
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '10px',
                padding: '10px 16px',
                backgroundColor: filter === 'all' ? COLORS.primary : 'transparent',
                color: filter === 'all' ? '#FFFFFF' : COLORS.textSecondary,
                border: filter === 'all' ? 'none' : `1px solid ${COLORS.border}`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:border-slate-300 dark:hover:border-slate-600"
            >
              <Package className="w-4 h-4" />
              Todos
              <span 
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                style={{ 
                  backgroundColor: filter === 'all' ? 'rgba(255,255,255,0.2)' : COLORS.surfaceSubtle,
                  color: filter === 'all' ? '#FFFFFF' : COLORS.textSecondary
                }}
              >
                {totalItems}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('lowStock')}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '10px',
                padding: '10px 16px',
                backgroundColor: filter === 'lowStock' ? COLORS.warning : 'transparent',
                color: filter === 'lowStock' ? '#FFFFFF' : COLORS.warning,
                border: filter === 'lowStock' ? 'none' : `1px solid ${COLORS.warning}40`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Stock bajo
              {lowStockCount > 0 && (
                <span 
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ 
                    backgroundColor: filter === 'lowStock' ? 'rgba(255,255,255,0.2)' : COLORS.warningLight,
                    color: filter === 'lowStock' ? '#FFFFFF' : COLORS.warning
                  }}
                >
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('criticalStock')}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                borderRadius: '10px',
                padding: '10px 16px',
                backgroundColor: filter === 'criticalStock' ? COLORS.danger : 'transparent',
                color: filter === 'criticalStock' ? '#FFFFFF' : COLORS.danger,
                border: filter === 'criticalStock' ? 'none' : `1px solid ${COLORS.danger}40`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Sin stock
              {criticalStockCount > 0 && (
                <span 
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ 
                    backgroundColor: filter === 'criticalStock' ? 'rgba(255,255,255,0.2)' : COLORS.dangerLight,
                    color: filter === 'criticalStock' ? '#FFFFFF' : COLORS.danger
                  }}
                >
                  {criticalStockCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  borderRadius: '10px',
                  padding: '10px 16px',
                  backgroundColor: filter === 'category' ? COLORS.primary : 'transparent',
                  color: filter === 'category' ? '#FFFFFF' : COLORS.textSecondary,
                  border: filter === 'category' ? 'none' : `1px solid ${COLORS.border}`,
                }}
                className="text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                {selectedCategory || 'Categoría'}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl border z-50 overflow-hidden"
                  style={{ 
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                  }}
                >
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('all', '')}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Todas las categorías
                    </button>
                    {categories.length === 0 ? (
                      <p 
                        className="px-3 py-2 text-sm"
                        style={{ color: COLORS.textMuted }}
                      >
                        No hay categorías
                      </p>
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleFilterChange('category', cat)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                          style={{ 
                            color: selectedCategory === cat ? COLORS.primary : COLORS.textPrimary,
                            backgroundColor: selectedCategory === cat ? COLORS.primary + '10' : 'transparent'
                          }}
                        >
                          {cat}
                          <span 
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: COLORS.border,
                              color: COLORS.textSecondary
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
      </div>

      {query && (
        <p className="text-sm mb-4" style={{ color: COLORS.textSecondary, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: COLORS.primary }} />
        </div>
      ) : items.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl animate-in fade-in duration-300"
          style={{ 
            backgroundColor: COLORS.surfaceGlass,
            border: `1px solid ${COLORS.border}`,
            backdropFilter: 'blur(12px)'
          }}
        >
          <div 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary + '15' }}
          >
            <Package className="w-10 h-10" style={{ color: COLORS.primary }} />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: COLORS.textPrimary 
            }}
          >
            Inventario vacío
          </h3>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textSecondary 
            }}
            className="text-sm mb-6 max-w-sm mx-auto"
          >
            Comienza agregando productos a tu inventario para llevar el control de stock.
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg cursor-pointer"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: COLORS.primaryGradient,
              color: '#FFFFFF',
            }}
          >
            <Plus className="w-4 h-4" />
            Agregar primer producto
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div 
          className="text-center py-16 rounded-2xl animate-in fade-in duration-300"
          style={{ 
            backgroundColor: COLORS.surfaceGlass,
            border: `1px solid ${COLORS.border}`,
            backdropFilter: 'blur(12px)'
          }}
        >
          <Search 
            className="w-12 h-12 mx-auto mb-4" 
            style={{ color: COLORS.textMuted }} 
          />
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: COLORS.textPrimary 
            }}
          >
            No se encontraron productos
          </h3>
          <p 
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: COLORS.textSecondary 
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
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: COLORS.primary,
                  border: `1px solid ${COLORS.primary}`
                }}
              >
                Limpiar búsqueda
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: COLORS.primaryGradient,
                color: '#FFFFFF',
              }}
            >
              Ver todos los productos
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="grid gap-4"
          style={{ 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
          }}
        >
          {filtered.map((item, index) => (
            <div 
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-4"
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

      {isCategoryOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsCategoryOpen(false)} 
        />
      )}
    </>
  )
}
