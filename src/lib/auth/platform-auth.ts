import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin, error } = await supabase
    .from('platform_admins')
    .select('user_id, is_active')
    .eq('user_id', user.id)
    .single()

  if (error || !admin?.is_active) redirect('/dashboard')

  return user
}
