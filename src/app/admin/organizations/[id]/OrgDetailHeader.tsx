'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import { suspendOrganization } from '@/actions/admin/organizations/suspendOrganization'
import { reactivateOrganization } from '@/actions/admin/organizations/reactivateOrganization'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { OrganizationDetail, OrganizationStatus } from '@/lib/admin/types'

interface OrgDetailHeaderProps {
  org: OrganizationDetail
}

const STATUS_CONFIG: Record<OrganizationStatus, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-[#16A34A]/10 dark:bg-emerald-400/10 text-[#16A34A] dark:text-emerald-400' },
  suspended: { label: 'Suspendido', className: 'bg-[#DC2626]/10 dark:bg-red-400/10 text-[#DC2626] dark:text-red-400' },
  maintenance: { label: 'Mantenimiento', className: 'bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400' },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function OrgDetailHeader({ org }: OrgDetailHeaderProps) {
  const router = useRouter()
  const [suspendModalOpen, setSuspendModalOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [reactivating, setReactivating] = useState(false)

  const [, suspendAction] = useActionState(suspendOrganization, {})
  const [reactivateState, reactivateAction] = useActionState(reactivateOrganization, {})

  if (reactivateState.success) {
    router.refresh()
    return null
  }

  const statusConfig = STATUS_CONFIG[org.status]

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/organizations"
          className="flex items-center gap-2 text-sm text-[#475569] hover:text-[#0F172A] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#0F4C5C] dark:text-[#38BDF8]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-white font-heading">
                {org.name}
              </h1>
              <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
                {org.slug} · Creada el {formatDate(org.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.className}`}>
              {statusConfig.label}
            </span>

            {org.status === 'active' && (
              <button
                onClick={() => setSuspendModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-[#DC2626] dark:text-red-400 border border-[#DC2626] dark:border-red-400 rounded-lg hover:bg-[#DC2626]/5 dark:hover:bg-red-400/10 transition-colors cursor-pointer"
              >
                Suspender
              </button>
            )}

            {org.status === 'suspended' && (
              <button
                onClick={() => setReactivating(true)}
                className="px-4 py-2 text-sm font-medium text-[#16A34A] dark:text-emerald-400 border border-[#16A34A] dark:border-emerald-400 rounded-lg hover:bg-[#16A34A]/5 dark:hover:bg-emerald-400/10 transition-colors cursor-pointer"
              >
                Reactivar
              </button>
            )}
          </div>
        </div>

        {org.statusReason && (
          <div className="mt-4 p-3 bg-[#DC2626]/5 dark:bg-red-400/5 border border-[#DC2626]/20 dark:border-red-400/20 rounded-lg">
            <p className="text-sm text-[#DC2626] dark:text-red-400">
              <span className="font-medium">Motivo:</span> {org.statusReason}
            </p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={suspendModalOpen}
        onClose={() => { setSuspendModalOpen(false); setSuspendReason('') }}
        onConfirm={async () => {
          const fd = new FormData()
          fd.set('organizationId', org.id)
          fd.set('reason', suspendReason)
          await suspendAction(fd)
          router.push('/admin/organizations')
        }}
        title="Suspender organización"
        description={
          <div className="space-y-3">
            <p>¿Estás seguro de que quieres suspender <strong>{org.name}</strong>?</p>
            <input
              type="text"
              placeholder="Motivo de la suspensión"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] dark:focus:ring-[#38BDF8]"
            />
          </div>
        }
        confirmText="Suspender"
        cancelText="Cancelar"
        variant="danger"
        confirmDisabled={!suspendReason.trim()}
      />

      <ConfirmModal
        isOpen={reactivating}
        onClose={() => setReactivating(false)}
        onConfirm={async () => {
          const fd = new FormData()
          fd.set('organizationId', org.id)
          await reactivateAction(fd)
        }}
        title="Reactivar organización"
        description={`¿Reactivar ${org.name}? La organización volverá a estar activa.`}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  )
}
