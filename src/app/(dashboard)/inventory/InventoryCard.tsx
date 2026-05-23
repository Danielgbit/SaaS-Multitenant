'use client'

import { useState } from 'react'
import { Pencil, Trash2, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

interface InventoryCardProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export function InventoryCard({ item, onEdit, onDelete }: InventoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const COLORS = useThemeColors()

  const isCriticalStock = item.quantity === 0
  const isLowStock = item.quantity > 0 && item.quantity <= item.min_quantity
  const hasMargin = item.price && item.cost_price && item.price > item.cost_price
  const marginPercent = hasMargin 
    ? Math.round(((item.price! - item.cost_price!) / item.cost_price!) * 100)
    : 0

  const getStockStatus = () => {
    if (isCriticalStock) return { label: 'Sin stock', color: COLORS.danger, bg: COLORS.dangerLight, icon: AlertTriangle }
    if (isLowStock) return { label: 'Stock bajo', color: COLORS.warning, bg: COLORS.warningLight, icon: AlertTriangle }
    return { label: 'En stock', color: COLORS.success, bg: COLORS.successLight, icon: null }
  }

  const status = getStockStatus()
  const StatusIcon = status.icon

  const handleDelete = () => {
    setIsDeleting(true)
    onDelete(item)
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group transition-all duration-300 cursor-default"
      style={{
        backgroundColor: COLORS.surfaceGlass,
        borderRadius: '16px',
        border: `1px solid ${isHovered ? COLORS.primary + '40' : COLORS.border}`,
        overflow: 'hidden',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 20px 40px -12px rgba(15, 76, 92, 0.15), 0 0 0 1px rgba(15, 76, 92, 0.05)' 
          : '0 4px 24px rgba(15, 76, 92, 0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div 
        className="relative px-5 pt-5 pb-3"
        style={{
          background: isHovered 
            ? `linear-gradient(135deg, ${COLORS.primary}08 0%, transparent 100%)` 
            : 'transparent'
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3
              className="font-semibold text-lg truncate leading-tight font-heading"
              style={{ color: COLORS.textPrimary }}
            >
              {item.name}
            </h3>
            {item.sku && (
              <p
                className="text-xs mt-1"
                style={{ color: COLORS.textMuted }}
              >
                SKU: {item.sku}
              </p>
            )}
          </div>

          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            {StatusIcon && <StatusIcon className="w-3 h-3" />}
            {status.label}
          </div>
        </div>

        {item.category && (
          <div
            className="text-xs font-medium inline-block px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: COLORS.surfaceSubtle, color: COLORS.textSecondary }}
          >
            {item.category}
          </div>
        )}
      </div>

      {/* Stock & Price Section */}
      <div className="px-5 py-4">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: COLORS.textMuted }}
            >
              Stock actual
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p
                className="text-3xl font-bold font-heading"
                style={{ color: isCriticalStock ? COLORS.danger : isLowStock ? COLORS.warning : COLORS.textPrimary }}
              >
                {item.quantity}
              </p>
              <span
                className="text-sm font-medium"
                style={{ color: COLORS.textSecondary }}
              >
                {item.unit}
              </span>
            </div>
            <div 
              className="h-1.5 rounded-full mt-2 overflow-hidden"
              style={{ backgroundColor: COLORS.surfaceSubtle }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((item.quantity / (item.min_quantity * 3)) * 100, 100)}%`,
                  backgroundColor: isCriticalStock ? COLORS.danger : isLowStock ? COLORS.warning : COLORS.success
                }}
              />
            </div>
            {isLowStock && (
              <p className="text-xs mt-1" style={{ color: COLORS.warning }}>
                Mín: {item.min_quantity} {item.unit}
              </p>
            )}
          </div>

          <div className="text-right">
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: COLORS.textMuted }}
            >
              Precio
            </p>
            <p
              className="text-2xl font-bold font-heading"
              style={{ color: COLORS.primary }}
            >
              {item.price ? `$${item.price.toLocaleString('es-CO')}` : '-'}
            </p>
            {hasMargin && (
              <div className="flex items-center justify-end gap-1 mt-1">
                {marginPercent > 0 ? (
                  <TrendingUp className="w-3 h-3" style={{ color: COLORS.success }} />
                ) : (
                  <TrendingDown className="w-3 h-3" style={{ color: COLORS.danger }} />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: marginPercent > 0 ? COLORS.success : COLORS.danger }}
                >
                  {marginPercent > 0 ? '+' : ''}{marginPercent}%
                </span>
              </div>
            )}
            {item.cost_price && (
              <p
                className="text-xs"
                style={{ color: COLORS.textMuted, textDecoration: 'line-through' }}
              >
                Costo: ${item.cost_price.toLocaleString('es-CO')}
              </p>
            )}
          </div>
        </div>

          {item.description && (
            <p
              className="text-sm mt-4 line-clamp-2 leading-relaxed"
              style={{ color: COLORS.textSecondary }}
            >
              {item.description}
            </p>
          )}
      </div>

      {/* Actions */}
      <div 
        className="flex gap-2 px-5 py-3 border-t"
        style={{ 
          borderColor: COLORS.border,
          backgroundColor: isHovered ? COLORS.surfaceSubtle + '80' : 'transparent',
          transition: 'background-color 0.2s ease'
        }}
      >
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{ color: COLORS.textSecondary, backgroundColor: COLORS.surfaceSubtle }}
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
          style={{ color: COLORS.danger, backgroundColor: COLORS.dangerLight }}
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}
