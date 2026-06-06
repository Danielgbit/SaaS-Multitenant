'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Modal, Button, Spinner } from '@/components/ui'
import { createCheckoutSession } from '@/actions/billing/createCheckoutSession'
import type { Database } from '@/../types/supabase'

type Plan = Database['public']['Tables']['plans']['Row']

interface CurrentPlanCardProps {
  plan: Plan
  currentPlanId: string
  isCurrent: boolean
  onSelect: () => void
}

export function CurrentPlanCard({ plan, currentPlanId, isCurrent, onSelect }: CurrentPlanCardProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ... (rest of the card component - not a modal, has a modal inside it)

  return (
    <>
      {/* Card UI - not changing */}
      {showConfirm && (
        <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} title="Cambiar de plan"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancelar</Button>
              <Button variant="primary" onClick={onSelect} loading={loading}>Confirmar cambio</Button>
            </>
          }>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">¿Estás seguro de cambiar al plan {plan.name}?</p>
        </Modal>
      )}
    </>
  )
}
