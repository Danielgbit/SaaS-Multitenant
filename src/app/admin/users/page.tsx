import { getPlatformUsers } from '@/lib/admin/queries'
import { UsersIcon, BuildingIcon } from 'lucide-react'

export const metadata = {
  title: 'Usuarios - Prügressy Admin',
  description: 'Gestión global de usuarios de la plataforma',
}

function UserStatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-[#16A34A]/10 text-[#16A34A]">
        Activo
      </span>
    )
  }
  return (
    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-[#475569] dark:bg-slate-700 dark:text-slate-400">
      Inactivo
    </span>
  )
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Nunca'
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <span className="text-sm text-[#94A3B8]">—</span>

  const config: Record<string, { label: string; className: string }> = {
    owner: { label: 'Propietario', className: 'bg-[#0F4C5C]/10 text-[#0F4C5C]' },
    admin: { label: 'Admin', className: 'bg-[#DC2626]/10 text-[#DC2626]' },
    staff: { label: 'Staff', className: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
    empleado: { label: 'Empleado', className: 'bg-[#0EA5E9]/10 text-[#0EA5E9]' },
  }

  const { label, className } = config[role] ?? { label: role, className: 'bg-slate-100 text-[#475569]' }

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

export default async function UsersPage() {
  const users = await getPlatformUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white font-heading">
          Usuarios
        </h1>
        <p className="text-[#475569] dark:text-slate-400 mt-2">
          Todos los usuarios registrados en Prügressy
        </p>
      </div>

      {users.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAF9] dark:bg-slate-900/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Organizaciones</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Rol Principal</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Último Acceso</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[#475569] dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#FAFAF9] dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center">
                          <UsersIcon className="w-4 h-4 text-[#0F4C5C]" />
                        </div>
                        <div>
                          <span className="font-medium text-[#0F172A] dark:text-white">
                            {user.email}
                          </span>
                          {user.primaryOrgName && (
                            <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
                              <BuildingIcon className="w-3 h-3" />
                              {user.primaryOrgName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {user.organizationCount}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.primaryRole} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] dark:text-slate-400">
                      {formatDate(user.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge isActive={user.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-[#E2E8F0] dark:border-slate-700 p-12 text-center">
          <UsersIcon className="w-12 h-12 mx-auto text-[#94A3B8]" />
          <h3 className="mt-4 text-lg font-medium text-[#0F172A] dark:text-white">No hay usuarios</h3>
          <p className="text-[#475569] dark:text-slate-400 mt-2">
            Los usuarios aparecerán aquí cuando se registren
          </p>
        </div>
      )}
    </div>
  )
}
