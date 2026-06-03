import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#151b1d]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {children}
      </div>
    </div>
  )
}
