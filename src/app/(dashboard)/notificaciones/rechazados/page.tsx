import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeadLetterTable } from '@/components/dashboard/notifications/DeadLetterTable'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dead Letters | Prügressy',
  description: 'Gestión de notificaciones fallidas permanentemente',
}

async function fetchDeadLetters(organizationId: string) {
  const supabase = await createClient()

  const { data } = await (supabase as any)
    .from('dead_letter_notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .order('moved_at', { ascending: false })
    .limit(100)

  return data || []
}

export default async function DeadLetterPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember?.organization_id) {
    redirect('/dashboard')
  }

  const deadLetters = await fetchDeadLetters(orgMember.organization_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dead Letters</h1>
        <p className="text-muted-foreground">
          Notificaciones fallidas permanentemente - revisar y decidir si reintentar o descartar
        </p>
      </div>

      <DeadLetterTable deadLetters={deadLetters} />
    </div>
  )
}
