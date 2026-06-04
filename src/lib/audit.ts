import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminAuditActionType } from '@/lib/audit/types'
import type { Json } from '@/../types/supabase'

interface AuditParams {
  adminUserId: string
  action: AdminAuditActionType
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}

export async function logAudit({
  adminUserId,
  action,
  entityType,
  entityId,
  metadata,
}: AuditParams) {
  const admin = await createAdminClient()

  await admin.from('admin_audit_logs').insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: (metadata ?? {}) as Json,
  })
}
