'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2, Package, CheckCircle } from 'lucide-react'
import { deleteInventoryItem } from '@/actions/inventory/deleteInventoryItem'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

interface DeleteInventoryModalProps {
  item: InventoryItem
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const DS = {
  primary: '#0F4C5C',
  surface: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  dangerDark: '#B91C1C',
  radius: {
    lg: '16px',
    md: '10px',
  },
}

export function DeleteInventoryModal({ 
  item, 
  organizationId, 
  isOpen, 
  onClose, 
  onSuccess 
}: DeleteInventoryModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    const result = await deleteInventoryItem({
      id: item.id,
      organization_id: organizationId,
    })

    if (result.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      setIsDeleted(true)
      setTimeout(() => {
        onSuccess()
        onClose()
        // Reset state after close
        setTimeout(() => {
          setIsDeleted(false)
        }, 300)
      }, 800)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      <div 
        className="w-full max-w-md"
        style={{ 
          backgroundColor: DS.surface,
          borderRadius: DS.radius.lg,
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: DS.textMuted }} />
          </button>

          {/* Icon */}
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: DS.dangerLight,
              animation: isDeleted ? 'pulse 0.5s ease-in-out' : 'none'
            }}
          >
            {isDeleted ? (
              <CheckCircle className="w-8 h-8" style={{ color: DS.danger }} />
            ) : (
              <AlertTriangle className="w-8 h-8" style={{ color: DS.danger }} />
            )}
          </div>

          {/* Title */}
          <h2 
            className="text-xl font-bold text-center"
            style={{ 
              fontFamily: "'Cormorant Garamond', serif",
              color: DS.textPrimary 
            }}
          >
            {isDeleted ? 'Producto eliminado' : 'Eliminar producto'}
          </h2>

          {/* Description */}
          <p 
            className="text-sm text-center mt-2"
            style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: DS.textSecondary 
            }}
          >
            {isDeleted 
              ? 'El producto ha sido eliminado correctamente.' 
              : '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'}
          </p>
        </div>

        {/* Product Info */}
        {!isDeleted && (
          <div 
            className="mx-6 p-4 rounded-xl"
            style={{ 
              backgroundColor: '#F8FAFC',
              border: `1px solid ${DS.border}`
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#E0F2FE' }}
              >
                <Package className="w-5 h-5" style={{ color: DS.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="font-semibold truncate"
                  style={{ 
                    fontFamily: "'Cormorant Garamond', serif",
                    color: DS.textPrimary 
                  }}
                >
                  {item.name}
                </p>
                {item.sku && (
                  <p 
                    className="text-xs"
                    style={{ 
                      color: DS.textMuted,
                      fontFamily: "'Plus Jakarta Sans', sans-serif" 
                    }}
                  >
                    SKU: {item.sku}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div 
            className="mx-6 mt-4 p-3 rounded-lg text-sm"
            style={{ 
              backgroundColor: DS.dangerLight,
              color: DS.danger,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-4">
          {!isDeleted ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:bg-slate-50"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: DS.textSecondary,
                  border: `1px solid ${DS.border}`,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backgroundColor: DS.danger,
                  color: '#FFFFFF',
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Eliminar producto
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSuccess()
                onClose()
                setIsDeleted(false)
              }}
              className="w-full py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                backgroundColor: DS.primary,
                color: '#FFFFFF',
              }}
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
