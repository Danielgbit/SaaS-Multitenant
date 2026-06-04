import { notFound } from 'next/navigation'
import { getOrganizationById } from '@/lib/admin/queries'
import { OrgDetailHeader } from './OrgDetailHeader'
import { OrgSubscriptionCard } from './OrgSubscriptionCard'
import { OrgMembersCard } from './OrgMembersCard'

export const metadata = {
  title: 'Organización - Prügressy Admin',
  description: 'Detalle de la organización',
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const org = await getOrganizationById(id)

  if (!org) notFound()

  return (
    <div className="space-y-6">
      <OrgDetailHeader org={org} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrgSubscriptionCard subscription={org.subscription} />
        <OrgMembersCard members={org.members} />
      </div>
    </div>
  )
}
