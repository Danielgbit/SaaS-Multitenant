'use client'

import { useState } from 'react'
import { Pencil, Trash2, AlertTriangle, History } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { InventoryMovementModal } from './InventoryMovementModal'

interface InventoryListItemProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export function InventoryListItem({ item, onEdit, onDelete }: InventoryListItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const COLORS = useThemeColors()

  const isCriticalStock = item.quantity === 0
  const isLowStock = item.quantity > 0 && item.quantity <= item.min_quantity

  const stockDotColor = isCriticalStock
    ? COLORS.error
    : isLowStock
      ? COLORS.warning
      : COLORS.success

  const stockLabel = isCriticalStock
    ? 'Sin stock'
    : isLowStock
      ? 'Stock bajo'
      : null

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex items-center gap-4 px-6 py-3.5 transition-colors duration-200 cursor-default"
        style={{
          backgroundColor: isHovered ? COLORS.surfaceHover : 'transparent',
        }}
      >
        {/* Name + SKU */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: COLORS.textPrimary }}
          >
            {item.name}
          </p>
          {item.sku && (
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              SKU: {item.sku}
            </p>
          )}
        </div>

        {/* Category badge */}
        {item.category && (
          <div
            className="hidden sm:inline-flex text-xs font-medium px-2.5 py-1 rounded-lg shrink-0"
            style={{ backgroundColor: COLORS.accentTealSubtle, color: COLORS.textSecondary }}
          >
            {item.category}
          </div>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-2 shrink-0 w-28 justify-end">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: stockDotColor }}
            />
            <span
              className="text-sm font-bold font-heading tabular-nums"
              style={{ color: isCriticalStock ? COLORS.error : isLowStock ? COLORS.warning : COLORS.textPrimary }}
            >
              {item.quantity}
            </span>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {item.unit}
            </span>
          </div>
          {stockLabel && (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: stockDotColor }} />
          )}
        </div>

        {/* Price */}
        <div className="hidden md:block text-right shrink-0 w-24">
          <p
            className="text-sm font-bold font-heading"
            style={{ color: COLORS.primary }}
          >
            {item.price ? `$${item.price.toLocaleString('es-CO')}` : '-'}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-1 shrink-0 transition-opacity duration-200
                     opacity-100 md:opacity-0 md:group-hover:opacity-100
                     max-md:opacity-100 focus-within:opacity-100"
        >
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`Editar ${item.name}`}
            className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
            style={{
              color: COLORS.textSecondary,
              backgroundColor: isHovered ? COLORS.surfaceSubtle : 'transparent',
              minWidth: '36px',
              minHeight: '36px',
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            aria-label={`Historial de ${item.name}`}
            className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
            style={{
              color: COLORS.primary,
              backgroundColor: isHovered ? COLORS.primary + '10' : 'transparent',
              minWidth: '36px',
              minHeight: '36px',
            }}
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Eliminar ${item.name}`}
            className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
            style={{
              color: COLORS.error,
              backgroundColor: isHovered ? COLORS.errorLight : 'transparent',
              minWidth: '36px',
              minHeight: '36px',
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showHistory && (
        <InventoryMovementModal
          itemId={item.id}
          organizationId={item.organization_id}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  )
}
