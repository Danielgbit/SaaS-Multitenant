import { CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface OrgSubscriptionCardProps {
  subscription: {
    planName: string | null
    planPrice: number | null
    status: string | null
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    stripeCustomerId: string | null
    cancelAtPeriodEnd: boolean | null
    canceledAt: string | null
  } | null
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatStatus(status: string | null): string {
  if (!status) return '—'
  const labels: Record<string, string> = {
    trial: 'Trial',
    active: 'Activa',
    past_due: 'Vencida',
    canceled: 'Cancelada',
    unpaid: 'Sin pagar',
  }
  return labels[status] || status
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0] dark:border-slate-700 last:border-0">
      <span className="text-sm text-[#475569] dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-[#0F172A] dark:text-white">{value}</span>
    </div>
  )
}

export function OrgSubscriptionCard({ subscription }: OrgSubscriptionCardProps) {
  if (!subscription) {
    return (
      <Card variant="surface" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-[#475569] dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white font-heading">Suscripción</h3>
        </div>
        <p className="text-sm text-[#94A3B8] text-center py-4">Sin suscripción activa</p>
      </Card>
    )
  }

  return (
    <Card variant="surface" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-5 h-5 text-[#475569] dark:text-slate-400" />
        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white font-heading">Suscripción</h3>
      </div>

      <div className="space-y-1">
        <InfoRow label="Plan" value={subscription.planName || '—'} />
        <InfoRow label="Precio" value={subscription.planPrice ? `$${subscription.planPrice.toLocaleString('es-CO')}` : '—'} />
        <InfoRow label="Estado" value={formatStatus(subscription.status)} />
        <InfoRow label="Trial expira" value={formatDate(subscription.trialEndsAt)} />
        <InfoRow label="Período actual" value={formatDate(subscription.currentPeriodEnd)} />
        <InfoRow label="Stripe ID" value={subscription.stripeCustomerId || '—'} />
        <InfoRow label="Cancela al fin" value={subscription.cancelAtPeriodEnd ? 'Sí' : 'No'} />
        <InfoRow label="Cancelada el" value={formatDate(subscription.canceledAt)} />
      </div>
    </Card>
  )
}
