import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TicketIcon, BuildingOfficeIcon, ArrowTrendingUpIcon } from 'lucide-react'

export const metadata = {
  title: 'Admin - Prügressy',
  description: 'Panel de administración de Prügressy',
}

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: orgCount }, { count: activeSubscriptions }, { count: promoCodesActive }] =
    await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('promo_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-semibold text-[#0F172A] dark:text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Panel de Administración
        </h1>
        <p className="text-[#475569] dark:text-slate-400 mt-2">
          Gestiona códigos promocionales y organizaciones
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Organizaciones"
          value={orgCount ?? 0}
          href="/admin/organizations"
          icon={BuildingOfficeIcon}
        />
        <StatCard
          label="Suscripciones Activas"
          value={activeSubscriptions ?? 0}
          href="/admin/organizations"
          icon={ArrowTrendingUpIcon}
        />
        <StatCard
          label="Códigos Activos"
          value={promoCodesActive ?? 0}
          href="/admin/promo-codes"
          icon={TicketIcon}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          title="Crear código promocional"
          description="Genera un nuevo código para clientes"
          href="/admin/promo-codes/new"
          icon={TicketIcon}
        />
        <ActionCard
          title="Ver organizaciones"
          description="Lista de todos los negocios registrados"
          href="/admin/organizations"
          icon={BuildingOfficeIcon}
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string
  value: number
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-lg bg-[#0F4C5C]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#0F4C5C]" />
      </div>
      <div>
        <p className="text-sm text-[#475569] dark:text-slate-400">{label}</p>
        <p className="text-3xl font-semibold text-[#0F172A] dark:text-white mt-1">
          {value}
        </p>
      </div>
    </Link>
  )
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-lg bg-[#0F4C5C]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#0F4C5C]" />
      </div>
      <div>
        <h3 className="font-medium text-[#0F172A] dark:text-white">{title}</h3>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>
    </Link>
  )
}