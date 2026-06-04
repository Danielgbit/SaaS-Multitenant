import { AdminNav } from '@/components/admin/AdminNav'
import { requirePlatformAdmin } from '@/lib/auth/platform-auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requirePlatformAdmin()

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#151b1d]">
      <AdminNav userEmail={user.email} />
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}