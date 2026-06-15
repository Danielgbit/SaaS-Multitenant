'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal, Button } from '@/components/ui'
import { captureError } from '@/lib/error-logger'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { deleteInventoryItem } from '@/actions/inventory/deleteInventoryItem'
import { useThemeColors } from '@/hooks/useThemeColors'

interface DeleteInventoryModalProps {
  item: InventoryItem
  organizationId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteInventoryModal({ item, organizationId, isOpen, onClose, onSuccess }: DeleteInventoryModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [error, setError] = useState('')
  const COLORS = useThemeColors()
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  if (!isOpen) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')
    try {
      const result = await deleteInventoryItem({ id: item.id, organization_id: organizationId })
      if (result.error) {
        setError(result.error)
        setIsDeleting(false)
      } else {
        setIsDeleted(true)
        successTimeoutRef.current = setTimeout(() => {
          onSuccess()
          onClose()
          resetTimeoutRef.current = setTimeout(() => setIsDeleted(false), 300)
        }, 800)
      }
    } catch (error) {
      captureError('inventory_delete_modal_error', error, { itemId: item.id, organizationId })
      setError('Error inesperado al eliminar.')
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isDeleted ? 'Producto eliminado' : 'Eliminar producto'}>
      {isDeleted ? (
        <p className="text-sm text-center" style={{ color: COLORS.textSecondary }}>El producto ha sido eliminado correctamente.</p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ backgroundColor: COLORS.surfaceSubtle, border: `1px solid ${COLORS.border}` }}>
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs" style={{ color: COLORS.textSecondary }}>SKU: {item.sku || 'N/A'} • Stock: {item.quantity}</p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting} className="flex-1">Eliminar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
