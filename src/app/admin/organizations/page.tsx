import { createClient } from '@/lib/supabase/server'
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
    trial: { label: 'Trial', className: 'bg-[#0EA5E9]/10 text-[#0EA5E9]' },
    active: { label: 'Activo', className: 'bg-[#16A34A]/10 text-[#16A34A]' },
    grace_period: { label: 'Grace Period', className: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
    past_due: { label: 'Vencido', className: 'bg-[#DC2626]/10 text-[#DC2626]' },
    canceled: { label: 'Cancelado', className: 'bg-slate-100 text-[#475569] dark:bg-slate-700 dark:text-slate-400' },
  }

  if (!status) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#475569] dark:bg-slate-700 dark:text-slate-400">
        Sin suscripción
      </span>
    )
  }

  const { label, className } = config[status] ?? { label: status, className: 'bg-slate-100 text-[#475569]' }

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default async function OrganizationsPage() {
  const supabase = await createClient()

  const { data: organizations } = await supabase
    .from('organizations')
    .select(
      `
      id,
      name,
      created_at,
      subscriptions (
        status,
        trial_ends_at,
        plans (
          name
        )
      )
    `
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-semibold text-[#0F172A] dark:text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
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
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Trial expira
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {organizations.map((org) => {
                  const subscription = (org.subscriptions as any)?.[0]
                  const status = subscription?.status ?? null
                  const trialEndsAt = subscription?.trial_ends_at

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-[#FAFAF9] dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center">
                            <BuildingIcon className="w-4 h-4 text-[#0F4C5C]" />
                          </div>
                          <span className="font-medium text-[#0F172A] dark:text-white">
                            {org.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                        {subscription?.plans?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                        {trialEndsAt ? formatDate(trialEndsAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                        {formatDate(org.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-12 text-center">
          <BuildingIcon className="w-12 h-12 mx-auto text-[#94A3B8]" />
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