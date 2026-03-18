import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInventoryItems, getInventoryCategories } from '@/actions/inventory/getInventoryItems'
import { InventoryClient } from './InventoryClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventario — SaaS',
  description: 'Gestiona el inventario de tu negocio.',
}

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    redirect('/calendar')
  }

  const items = await getInventoryItems(orgMember.organization_id)
  const categories = await getInventoryCategories(orgMember.organization_id)

  return (
    <InventoryClient
      items={items}
      categories={categories}
      organizationId={orgMember.organization_id}
    />
  )
}
