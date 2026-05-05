import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusIcon, TicketIcon } from 'lucide-react'

export const metadata = {
  title: 'Códigos Promocionales - Admin',
  description: 'Gestiona códigos promocionales de Prügressy',
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function BadgeType({
  type,
  value,
}: {
  type: string
  value: number
}) {
  const config: Record<string, { label: string; className: string }> = {
    trial_extension: { label: `+${value} días`, className: 'bg-[#0EA5E9]/10 text-[#0EA5E9]' },
    grace_period: { label: `+${value} días gracia`, className: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
    free_month: { label: 'Mes gratis', className: 'bg-[#16A34A]/10 text-[#16A34A]' },
    discount: { label: `${value}% off`, className: 'bg-[#0F4C5C]/10 text-[#0F4C5C]' },
  }

  const { label, className } = config[type] ?? { label: type, className: 'bg-slate-100 text-slate-600' }

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default async function PromoCodesPage() {
  const supabase = await createClient()

  const { data: promoCodes } = await supabase
    .from('promo_codes')
    .select(
      `
      id,
      code,
      name,
      type,
      value,
      max_uses,
      used_count,
      expires_at,
      is_active,
      created_at
    `
    )
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-semibold text-[#0F172A] dark:text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Códigos Promocionales
          </h1>
          <p className="text-[#475569] dark:text-slate-400 mt-2">
            Crea y gestiona códigos para tus clientes
          </p>
        </div>
        <Link
          href="/admin/promo-codes/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#0F4C5C] text-white rounded-md text-sm font-medium hover:bg-[#0C3E4A] transition-colors cursor-pointer gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Crear código
        </Link>
      </div>

      {promoCodes && promoCodes.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAF9] dark:bg-slate-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Código
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Usado
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Expira
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {promoCodes.map((code) => (
                  <tr
                    key={code.id}
                    className="hover:bg-[#FAFAF9] dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-[#0F172A] dark:text-white">
                        {code.code}
                      </span>
                      {code.name && (
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
                          {code.name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <BadgeType type={code.type} value={code.value} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {code.max_uses ? `${code.used_count}/${code.max_uses}` : `${code.used_count}/∞`}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {formatDate(code.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          code.is_active
                            ? 'bg-[#16A34A]/10 text-[#16A34A]'
                            : 'bg-slate-100 text-[#475569] dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {code.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-12 text-center">
          <TicketIcon className="w-12 h-12 mx-auto text-[#94A3B8]" />
          <h3 className="mt-4 text-lg font-medium text-[#0F172A] dark:text-white">
            No hay códigos
          </h3>
          <p className="text-[#475569] dark:text-slate-400 mt-2">
            Crea tu primer código promocional para comenzar
          </p>
          <Link
            href="/admin/promo-codes/new"
            className="inline-flex items-center mt-6 px-4 py-2 bg-[#0F4C5C] text-white rounded-md text-sm font-medium hover:bg-[#0C3E4A] transition-colors cursor-pointer gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Crear código
          </Link>
        </div>
      )}
    </div>
  )
}