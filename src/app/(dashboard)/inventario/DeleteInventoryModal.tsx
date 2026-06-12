'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui'
import { captureError } from '@/lib/error-logger'
import type { InventoryItem } from '@/actions/inventory/getInventoryItems'
import { deleteInventoryItem } from '@/actions/inventory/deleteInventoryItem'

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
        setTimeout(() => { onSuccess(); onClose(); setTimeout(() => setIsDeleted(false), 300) }, 800)
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
        <p className="text-sm text-center text-[#64748B] dark:text-[#94A3B8]">El producto ha sido eliminado correctamente.</p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">SKU: {item.sku || 'N/A'} • Stock: {item.quantity}</p>
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
