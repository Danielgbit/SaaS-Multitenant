'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Search, AlertTriangle, FolderOpen, X, ArrowUpDown, LayoutGrid, List } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useHydratedValue } from '@/hooks/useHydratedValue'
import { computeInventoryStats } from '@/lib/inventory/inventory-stats'
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { InventoryCard } from './InventoryCard'
import { InventoryFormModal } from './InventoryFormModal'
import { DeleteInventoryModal } from './DeleteInventoryModal'
import { InventoryKPIRow } from './InventoryKPIRow'
import { InventoryListItem } from './InventoryListItem'

interface InventoryClientProps {
  items: InventoryItem[]
  categories: string[]
  organizationId: string
}

type FilterType = 'all' | 'lowStock' | 'criticalStock' | 'category'
type SortOption = 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc'
type ViewMode = 'grid' | 'list'

export function InventoryClient({ items, categories, organizationId }: InventoryClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [viewMode, setViewMode] = useHydratedValue<ViewMode>('grid', 'inventory-view-mode')
  const [clearBtnHovered, setClearBtnHovered] = useState(false)
  const COLORS = useThemeColors()

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const isModalOpen = isCreating || editingItem !== null

  const stats = useMemo(() => computeInventoryStats(items), [items])

  const sortOptions: DropdownOption<SortOption>[] = [
    { value: 'name-asc', label: 'Nombre A-Z' },
    { value: 'name-desc', label: 'Nombre Z-A' },
    { value: 'stock-desc', label: 'Stock mayor' },
    { value: 'stock-asc', label: 'Stock menor' },
    { value: 'price-desc', label: 'Precio mayor' },
    { value: 'price-asc', label: 'Precio menor' },
  ]

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      if (item.category) {
        map.set(item.category, (map.get(item.category) ?? 0) + 1)
      }
    }
    return map
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (q) {
        const nameMatch = item.name.toLowerCase().includes(q)
        const skuMatch = item.sku ? item.sku.toLowerCase().includes(q) : false
        if (!nameMatch && !skuMatch) return false
      }
      if (filter === 'lowStock') return item.quantity > 0 && item.quantity <= item.min_quantity
      if (filter === 'criticalStock') return item.quantity === 0
      if (filter === 'category' && selectedCategory) return item.category === selectedCategory
      return true
    })
  }, [items, query, filter, selectedCategory])

  const sortedAndFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'stock-asc') return a.quantity - b.quantity
      if (sortBy === 'stock-desc') return b.quantity - a.quantity
      if (sortBy === 'price-asc') return (a.price ?? 0) - (b.price ?? 0)
      if (sortBy === 'price-desc') return (b.price ?? 0) - (a.price ?? 0)
      return 0
    })
  }, [filtered, sortBy])

  const categoryOptions: DropdownOption<string>[] = categories.map((cat) => ({
    value: cat,
    label: cat,
    count: categoryCounts.get(cat) ?? 0,
  }))

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
  }

  return (
    <>
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
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Gestion de inventario</p>
              <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Inventario</h1>
              <p className="text-sm mt-1 text-white/80">
                {stats.total} producto{stats.total !== 1 ? 's' : ''} registrado{stats.total !== 1 ? 's' : ''}
                {stats.lowStock > 0 && (
                  <span className="ml-2">• {stats.lowStock} con stock bajo</span>
                )}
                {stats.criticalStock > 0 && (
                  <span className="ml-2">• {stats.criticalStock} sin stock</span>
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

      <InventoryKPIRow items={items} />

      <div
        className="p-4 rounded-2xl mb-6 relative z-[1]"
        style={{
          backgroundColor: COLORS.surfaceGlass,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
              style={{ color: query ? COLORS.primary : COLORS.textMuted }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                onMouseEnter={() => setClearBtnHovered(true)}
                onMouseLeave={() => setClearBtnHovered(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors"
                style={{
                  backgroundColor: clearBtnHovered ? COLORS.surfaceHover : 'transparent',
                }}
              >
                <X className="w-3 h-3" style={{ color: COLORS.textMuted }} />
              </button>
            )}
            <input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
              aria-label="Buscar productos por nombre o SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                borderRadius: '10px',
                borderColor: COLORS.border,
                padding: '12px 40px 12px 44px',
                color: COLORS.textPrimary,
                backgroundColor: COLORS.surface,
              }}
              className="w-full border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filter === 'all'}
              onClick={() => handleFilterChange('all')}
              style={{
                borderRadius: '10px',
                padding: '10px 16px',
                backgroundColor: filter === 'all' ? COLORS.primary : 'transparent',
                color: filter === 'all' ? COLORS.textOnPrimary : COLORS.textSecondary,
                border: filter === 'all' ? 'none' : `1px solid ${COLORS.border}`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Todos
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: filter === 'all' ? 'rgba(255,255,255,0.2)' : COLORS.surfaceSubtle,
                  color: filter === 'all' ? COLORS.textOnPrimary : COLORS.textSecondary,
                }}
              >
                {stats.total}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={filter === 'lowStock'}
              onClick={() => handleFilterChange('lowStock')}
              style={{
                borderRadius: '10px',
                padding: '10px 16px',
                backgroundColor: filter === 'lowStock' ? COLORS.warning : 'transparent',
                color: filter === 'lowStock' ? COLORS.textOnWarning : COLORS.warning,
                border: filter === 'lowStock' ? 'none' : `1px solid ${COLORS.warning}40`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Stock bajo
              {stats.lowStock > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: filter === 'lowStock' ? 'rgba(255,255,255,0.2)' : COLORS.warningLight,
                    color: filter === 'lowStock' ? COLORS.textOnWarning : COLORS.warning,
                  }}
                >
                  {stats.lowStock}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-pressed={filter === 'criticalStock'}
              onClick={() => handleFilterChange('criticalStock')}
              style={{
                borderRadius: '10px',
                padding: '10px 16px',
                backgroundColor: filter === 'criticalStock' ? COLORS.error : 'transparent',
                color: filter === 'criticalStock' ? COLORS.textOnError : COLORS.error,
                border: filter === 'criticalStock' ? 'none' : `1px solid ${COLORS.error}40`,
              }}
              className="text-sm font-medium transition-all duration-200 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Sin stock
              {stats.criticalStock > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: filter === 'criticalStock' ? 'rgba(255,255,255,0.2)' : COLORS.errorLight,
                    color: filter === 'criticalStock' ? COLORS.textOnError : COLORS.error,
                  }}
                >
                  {stats.criticalStock}
                </span>
              )}
            </button>

            <Dropdown<string>
              options={categoryOptions}
              value={selectedCategory}
              onChange={(v) => handleFilterChange('category', v)}
              placeholder="Categoria"
              triggerIcon={<FolderOpen className="w-4 h-4" />}
              align="left"
              size="md"
              ariaLabel="Filtrar por categoria"
              showCount
              emptyMessage="No hay categorias"
            />
          </div>
        </div>
      </div>

      {query && (
        <p className="text-sm mb-4" style={{ color: COLORS.textSecondary }} aria-live="polite" aria-atomic="true">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &quot;{query}&quot;
        </p>
      )}

      {items.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl animate-in fade-in duration-300"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            border: `1px solid ${COLORS.border}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.primary}15` }}
          >
            <Package className="w-10 h-10" style={{ color: COLORS.primary }} />
          </div>
          <h3 className="text-lg font-semibold mb-2 font-heading" style={{ color: COLORS.textPrimary }}>
            Inventario vacio
          </h3>
          <p style={{ color: COLORS.textSecondary }} className="text-sm mb-6 max-w-sm mx-auto">
            Comienza agregando productos a tu inventario para llevar el control de stock.
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg cursor-pointer"
            style={{
              background: COLORS.primaryGradient,
              color: COLORS.textOnPrimary,
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
            backdropFilter: 'blur(12px)',
          }}
        >
          <Search className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.textMuted }} />
          <h3 className="text-lg font-semibold mb-2 font-heading" style={{ color: COLORS.textPrimary }}>
            No se encontraron productos
          </h3>
          <p style={{ color: COLORS.textSecondary }} className="text-sm mb-4">
            Intenta con otros terminos de busqueda o verifica los filtros.
          </p>
          <div className="flex gap-2 justify-center">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                style={{
                  color: COLORS.primary,
                  border: `1px solid ${COLORS.primary}`,
                }}
              >
                Limpiar busqueda
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFilterChange('all')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                background: COLORS.primaryGradient,
                color: COLORS.textOnPrimary,
              }}
            >
              Ver todos los productos
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl"
          style={{
            backgroundColor: COLORS.surfaceGlass,
            backdropFilter: 'blur(12px)',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            className="flex items-center justify-between px-6 py-3.5 border-b"
            style={{
              borderColor: COLORS.border,
              backgroundColor: `${COLORS.surfaceSubtle}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                Catalogo
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Dropdown<SortOption>
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                placeholder="Ordenar"
                triggerIcon={<ArrowUpDown className="w-3.5 h-3.5" />}
                align="right"
                size="sm"
                ariaLabel="Cambiar orden de productos"
                showCount={false}
              />

              <div
                className="flex items-center overflow-hidden"
                style={{ borderRadius: '8px', border: `1px solid ${COLORS.border}` }}
              >
                <button
                  type="button"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className="p-1.5 transition-colors duration-200 cursor-pointer"
                  style={{
                    backgroundColor: viewMode === 'grid' ? COLORS.primary : 'transparent',
                    color: viewMode === 'grid' ? COLORS.textOnPrimary : COLORS.textMuted,
                  }}
                  aria-label="Vista cuadricula"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className="p-1.5 transition-colors duration-200 cursor-pointer"
                  style={{
                    backgroundColor: viewMode === 'list' ? COLORS.primary : 'transparent',
                    color: viewMode === 'list' ? COLORS.textOnPrimary : COLORS.textMuted,
                  }}
                  aria-label="Vista lista"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                {sortedAndFiltered.length} resultado{sortedAndFiltered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-b-2xl">
            {viewMode === 'grid' ? (
              <div
                className="grid gap-4 p-4"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
              >
                {sortedAndFiltered.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                  >
                    <InventoryCard
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={setDeletingItem}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: COLORS.border }}>
                {sortedAndFiltered.map((item, index) => (
                  <li
                    key={item.id}
                    className="animate-in fade-in"
                    style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
                  >
                    <InventoryListItem
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={setDeletingItem}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {(isCreating || editingItem) && (
        <InventoryFormModal
          key={editingItem?.id ?? 'new'}
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
    </>
  )
}
