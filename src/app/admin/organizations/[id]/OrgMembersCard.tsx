import { Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface OrgMembersCardProps {
  members: Array<{
    userId: string
    email: string
    role: string
  }>
}

const ROLE_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  owner: { label: 'Propietario', className: 'bg-[#0F4C5C]/10 text-[#0F4C5C]' },
  admin: { label: 'Admin', className: 'bg-[#DC2626]/10 text-[#DC2626]' },
  staff: { label: 'Staff', className: 'bg-[#F59E0B]/10 text-[#F59E0B]' },
  empleado: { label: 'Empleado', className: 'bg-[#0EA5E9]/10 text-[#0EA5E9]' },
}

export function OrgMembersCard({ members }: OrgMembersCardProps) {
  return (
    <Card variant="surface" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-5 h-5 text-[#475569] dark:text-slate-400" />
        <h3 className="text-lg font-semibold text-[#0F172A] dark:text-white font-heading">
          Miembros ({members.length})
        </h3>
      </div>

      {members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => {
            const badge = ROLE_BADGE_CONFIG[member.role] ?? { label: member.role, className: 'bg-slate-100 text-[#475569]' }
            return (
              <div
                key={member.userId}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#FAFAF9] dark:hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-sm text-[#0F172A] dark:text-white font-medium">
                  {member.email}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[#94A3B8] text-center py-4">Sin miembros</p>
      )}
    </Card>
  )
}
