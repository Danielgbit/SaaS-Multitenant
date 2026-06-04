import { getPlatformMetrics } from '@/lib/admin/queries'
import { MetricsGrid } from '@/components/admin/metrics/MetricsGrid'
import { GrowthChart } from '@/components/admin/metrics/GrowthChart'

export const metadata = {
  title: 'Métricas - Prügressy Admin',
  description: 'Métricas globales de la plataforma Prügressy',
}

export default async function MetricsPage() {
  const metrics = await getPlatformMetrics()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white font-heading">
          Métricas de Plataforma
        </h1>
        <p className="text-[#475569] dark:text-slate-400 mt-2">
          Visibilidad global del negocio SaaS
        </p>
      </div>

      <MetricsGrid metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrowthChart
          title="Crecimiento de Organizaciones"
          data={metrics.organizationGrowth}
          color="#0F4C5C"
        />
        <GrowthChart
          title="Crecimiento de Usuarios"
          data={metrics.userGrowth}
          color="#14B8A6"
        />
      </div>
    </div>
  )
}
