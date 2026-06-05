import { getOrganizationSummary } from '@/lib/admin/queries'
import Link from 'next/link'
import { BuildingIcon } from 'lucide-react'

export const metadata = {
  title: 'Organizaciones - Admin',
  description: 'Ver todas las organizaciones registradas',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function StatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    trial: { label: 'Trial', className: 'bg-[#0EA5E9]/10 dark:bg-sky-400/10 text-[#0EA5E9] dark:text-sky-400' },
    active: { label: 'Activo', className: 'bg-[#16A34A]/10 dark:bg-emerald-400/10 text-[#16A34A] dark:text-emerald-400' },
    grace_period: { label: 'Grace Period', className: 'bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400' },
    past_due: { label: 'Vencido', className: 'bg-[#DC2626]/10 dark:bg-red-400/10 text-[#DC2626] dark:text-red-400' },
    canceled: { label: 'Cancelado', className: 'bg-slate-100 text-[#475569] dark:bg-slate-700 dark:text-slate-400' },
  }

  if (!status) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#475569] dark:bg-slate-700 dark:text-slate-400">
        Sin suscripción
      </span>
    )
  }

  const { label, className } = config[status] ?? { label: status, className: 'bg-slate-100 dark:bg-slate-700 text-[#475569] dark:text-slate-400' }

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function OrgStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    active: { label: 'Activo', className: 'bg-[#16A34A]/10 dark:bg-emerald-400/10 text-[#16A34A] dark:text-emerald-400' },
    suspended: { label: 'Suspendido', className: 'bg-[#DC2626]/10 dark:bg-red-400/10 text-[#DC2626] dark:text-red-400' },
    maintenance: { label: 'Mantenimiento', className: 'bg-[#F59E0B]/10 dark:bg-amber-400/10 text-[#F59E0B] dark:text-amber-400' },
  }

  const { label, className } = config[status] ?? { label: status, className: 'bg-slate-100 dark:bg-slate-700 text-[#475569] dark:text-slate-400' }

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizationSummary()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white font-heading">
          Organizaciones
        </h1>
        <p className="text-[#475569] dark:text-slate-400 mt-2">
          Todas las organizaciones registradas en Prügressy
        </p>
      </div>

      {organizations && organizations.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAF9] dark:bg-slate-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Estado Org
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Suscripción
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Trial expira
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Owner
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Miembros
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-[#FAFAF9] dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="flex items-center gap-3 hover:text-[#0F4C5C] dark:hover:text-[#38BDF8] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#0F4C5C]/10 dark:bg-[#38BDF8]/10 flex items-center justify-center">
                          <BuildingIcon className="w-4 h-4 text-[#0F4C5C] dark:text-[#38BDF8]" />
                        </div>
                        <div>
                          <span className="font-medium text-[#0F172A] dark:text-white">
                            {org.name}
                          </span>
                          <p className="text-xs text-[#94A3B8] dark:text-slate-500">{org.slug}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {org.planName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <OrgStatusBadge status={org.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={org.subscriptionStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {org.trialEndsAt ? formatDate(org.trialEndsAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {org.ownerEmail || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400 text-center">
                      {org.memberCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {formatDate(org.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-12 text-center">
          <BuildingIcon className="w-12 h-12 mx-auto text-[#94A3B8] dark:text-slate-500" />
          <h3 className="mt-4 text-lg font-medium text-[#0F172A] dark:text-white">
            No hay organizaciones
          </h3>
          <p className="text-[#475569] dark:text-slate-400 mt-2">
            Las organizaciones aparecerán aquí cuando se registren
          </p>
        </div>
      )}
    </div>
  )
}
