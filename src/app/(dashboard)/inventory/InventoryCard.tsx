'use client'

import { useState } from 'react'
import { Pencil, Trash2, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

interface InventoryCardProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

const DS = {
  primary: '#0F4C5C',
  primaryLight: '#E0F2FE',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
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

export function InventoryCard({ item, onEdit, onDelete }: InventoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isCriticalStock = item.quantity === 0
  const isLowStock = item.quantity > 0 && item.quantity <= item.min_quantity
  const hasMargin = item.price && item.cost_price && item.price > item.cost_price
  const marginPercent = hasMargin 
    ? Math.round(((item.price! - item.cost_price!) / item.cost_price!) * 100)
    : 0

  const getStockStatus = () => {
    if (isCriticalStock) return { label: 'Sin stock', color: DS.danger, bg: DS.dangerLight, icon: AlertTriangle }
    if (isLowStock) return { label: 'Stock bajo', color: DS.warning, bg: DS.warningLight, icon: AlertTriangle }
    return { label: 'En stock', color: DS.success, bg: DS.successLight, icon: null }
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
      style={{
        backgroundColor: DS.surface,
        borderRadius: DS.radius.lg,
        border: `1px solid ${isHovered ? DS.primary : DS.border}`,
        padding: '0',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 20px 40px -12px rgba(15, 76, 92, 0.15), 0 0 0 1px rgba(15, 76, 92, 0.05)' 
          : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header con gradiente sutil */}
      <div 
        className="relative px-5 pt-5 pb-3"
        style={{
          background: isHovered 
            ? 'linear-gradient(135deg, rgba(15, 76, 92, 0.03) 0%, transparent 100%)' 
            : 'transparent'
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 
              className="font-semibold text-lg truncate leading-tight"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: DS.textPrimary 
              }}
            >
              {item.name}
            </h3>
            {item.sku && (
              <p 
                className="text-xs mt-1 font-mono"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.textMuted 
                }}
              >
                SKU: {item.sku}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
            style={{ 
              backgroundColor: status.bg,
              color: status.color,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {StatusIcon && <StatusIcon className="w-3 h-3" />}
            {status.label}
          </div>
        </div>

        {/* Category */}
        {item.category && (
          <div 
            className="text-xs font-medium inline-block px-2.5 py-1 rounded-lg"
            style={{ 
              backgroundColor: '#F8FAFC',
              color: DS.textSecondary,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {item.category}
          </div>
        )}
      </div>

      {/* Stock & Price Section */}
      <div className="px-5 py-4">
        <div className="flex items-end justify-between">
          {/* Stock */}
          <div className="flex-1">
            <p 
              className="text-xs font-medium uppercase tracking-wide"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.textMuted 
              }}
            >
              Stock actual
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p 
                className="text-3xl font-bold"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  color: isCriticalStock ? DS.danger : isLowStock ? DS.warning : DS.textPrimary 
                }}
              >
                {item.quantity}
              </p>
              <span 
                className="text-sm font-medium"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.textSecondary 
                }}
              >
                {item.unit}
              </span>
            </div>
            {/* Stock bar */}
            <div 
              className="h-1.5 rounded-full mt-2 overflow-hidden"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((item.quantity / (item.min_quantity * 3)) * 100, 100)}%`,
                  backgroundColor: isCriticalStock ? DS.danger : isLowStock ? DS.warning : DS.success
                }}
              />
            </div>
            {isLowStock && (
              <p className="text-xs mt-1" style={{ color: DS.warning, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Mín: {item.min_quantity} {item.unit}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <p 
              className="text-xs font-medium uppercase tracking-wide"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: DS.textMuted 
              }}
            >
              Precio
            </p>
            <p 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: DS.primary 
              }}
            >
              {item.price ? `$${item.price.toLocaleString('es-CO')}` : '-'}
            </p>
            {hasMargin && (
              <div className="flex items-center justify-end gap-1 mt-1">
                {marginPercent > 0 ? (
                  <TrendingUp className="w-3 h-3" style={{ color: DS.success }} />
                ) : (
                  <TrendingDown className="w-3 h-3" style={{ color: DS.danger }} />
                )}
                <span 
                  className="text-xs font-medium"
                  style={{ 
                    color: marginPercent > 0 ? DS.success : DS.danger,
                    fontFamily: "'Plus Jakarta Sans', sans-serif" 
                  }}
                >
                  {marginPercent > 0 ? '+' : ''}{marginPercent}%
                </span>
              </div>
            )}
            {item.cost_price && (
              <p 
                className="text-xs"
                style={{ 
                  color: DS.textMuted, 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textDecoration: 'line-through'
                }}
              >
                Costo: ${item.cost_price.toLocaleString('es-CO')}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p 
            className="text-sm mt-4 line-clamp-2 leading-relaxed"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div 
        className="flex gap-2 px-5 py-3 border-t"
        style={{ 
          borderColor: DS.border,
          backgroundColor: isHovered ? '#F8FAFC' : 'transparent',
          transition: 'background-color 0.2s ease'
        }}
      >
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-slate-100"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: DS.textSecondary,
            backgroundColor: '#F1F5F9'
          }}
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-red-50 disabled:opacity-50"
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: DS.danger,
            backgroundColor: '#FEF2F2'
          }}
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  )
}
