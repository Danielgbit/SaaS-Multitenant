export const AdminAuditAction = {
  CREATE_PROMO_CODE: 'CREATE_PROMO_CODE',
  SUSPEND_ORGANIZATION: 'SUSPEND_ORGANIZATION',
  REACTIVATE_ORGANIZATION: 'REACTIVATE_ORGANIZATION',
} as const

export type AdminAuditActionType = typeof AdminAuditAction[keyof typeof AdminAuditAction]
