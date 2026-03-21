'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2, Package, CheckCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { deleteInventoryItem } from '@/actions/inventory/deleteInventoryItem'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'

function useColors() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  return {
    primary: isDark ? '#38BDF8' : '#0F4C5C',
    primaryGradient: isDark 
      ? 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)'
      : 'linear-gradient(135deg, #0F4C5C 0%, #0C3E4A 100%)',
    surface: isDark ? '#0F172A' : '#FFFFFF',
    surfaceSubtle: isDark ? '#1E293B' : '#F8FAFC',
    border: isDark ? '#334155' : '#E2E8F0',
    textPrimary: isDark ? '#F1F5F9' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    success: '#16A34A',
    successLight: isDark ? '#064E3B' : '#D1FAE5',
    danger: '#DC2626',
    dangerLight: isDark ? '#450A0A' : '#FEE2E2',
    overlay: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
    isDark,
  }
}

interface DeleteInventoryModalProps {
  item: InventoryItem
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  const COLORS = useColors()

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
        backgroundColor: COLORS.overlay, 
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
          backgroundColor: COLORS.surface,
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${COLORS.border}`,
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div 
          className="relative p-6 pb-4 overflow-hidden"
          style={{ 
            background: COLORS.primaryGradient,
            borderRadius: '16px 16px 0 0'
          }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="relative">
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)',
                animation: isDeleted ? 'pulse 0.5s ease-in-out' : 'none'
              }}
            >
              {isDeleted ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-white" />
              )}
            </div>

            <h2 
              className="text-xl font-bold text-center"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                color: '#FFFFFF' 
              }}
            >
              {isDeleted ? 'Producto eliminado' : 'Eliminar producto'}
            </h2>

            <p 
              className="text-sm text-center mt-2"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: 'rgba(255,255,255,0.8)' 
              }}
            >
              {isDeleted 
                ? 'El producto ha sido eliminado correctamente.' 
                : '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'}
            </p>
          </div>
        </div>

        {/* Product Info */}
        {!isDeleted && (
          <div 
            className="mx-6 p-4 rounded-xl"
            style={{ 
              backgroundColor: COLORS.surfaceSubtle,
              border: `1px solid ${COLORS.border}`
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: COLORS.primary + '15' }}
              >
                <Package className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="font-semibold truncate"
                  style={{ 
                    fontFamily: "'Cormorant Garamond', serif",
                    color: COLORS.textPrimary 
                  }}
                >
                  {item.name}
                </p>
                {item.sku && (
                  <p 
                    className="text-xs"
                    style={{ 
                      color: COLORS.textMuted,
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

        {error && (
          <div 
            className="mx-6 mt-4 p-3 rounded-lg text-sm"
            style={{ 
              backgroundColor: COLORS.dangerLight,
              color: COLORS.danger,
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
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90 cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: COLORS.textSecondary,
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.surface,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backgroundColor: COLORS.danger,
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
              className="w-full py-3 px-4 rounded-xl font-medium transition-all hover:opacity-90 cursor-pointer"
              style={{ 
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: COLORS.primaryGradient,
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
