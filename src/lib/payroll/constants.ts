import type { PeriodStatus } from '@/types/payroll'

export const PAYROLL_STATUS_CONFIG: Record<PeriodStatus, {
  label: string
  description: string
  shortDesc: string
  tooltip: {
    whenUsed: string
    restrictions: string
  }
}> = {
  draft: {
    label: 'Borrador',
    description: 'Edición activa. Se calculan comisiones, deducciones y préstamos. Solo Owner/Admin puede modificarlo.',
    shortDesc: 'En edición',
    tooltip: {
      whenUsed: 'Al crear un período nuevo o mientras se editan valores',
      restrictions: 'Solo Owner/Admin puede modificar',
    },
  },
  approved: {
    label: 'Aprobado',
    description: 'Aprobado y congelado. Los valores ya no se pueden modificar. Pendiente de pago.',
    shortDesc: 'Congelado',
    tooltip: {
      whenUsed: 'Después de revisar y aprobar la nómina',
      restrictions: 'Valores congelados. No se puede modificar',
    },
  },
  paid: {
    label: 'Pagado',
    description: 'Período cerrado. Todos los empleados han sido pagados. No se puede modificar.',
    shortDesc: 'Pagado',
    tooltip: {
      whenUsed: 'Cuando todos los empleados han recibido su pago',
      restrictions: 'Período cerrado. Sin modificaciones',
    },
  },
}
