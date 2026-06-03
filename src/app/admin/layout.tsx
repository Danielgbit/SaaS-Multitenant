import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgMember?.role !== 'owner_saas') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#151b1d]">
      <AdminNav userEmail={user.email} />
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}