import { NextRequest, NextResponse } from 'next/server'
import { generateSlots, generateSlotsForMultipleEmployees } from '@/services/slots/generateSlots'

// =============================================================================
// GET /api/slots
// =============================================================================
// Genera slots disponibles para una fecha, empleado y servicio específicos.
//
// Query params:
//   - employeeId: ID del empleado (requerido)
//   - serviceId: ID del servicio (requerido)  
//   - date: Fecha en formato YYYY-MM-DD (requerido)
//   - organizationId: ID de la organización (requerido)
//   - employeeIds: Coma-separated IDs para múltiples empleados (opcional)
//
// Ejemplo: /api/slots?employeeId=xxx&serviceId=yyy&date=2026-03-15&organizationId=zzz
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const employeeId = searchParams.get('employeeId')
    const serviceId = searchParams.get('serviceId')
    const date = searchParams.get('date')
    const organizationId = searchParams.get('organizationId')
    const employeeIdsParam = searchParams.get('employeeIds')

    // Validación de parámetros requeridos
    if (!serviceId || !date || !organizationId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: serviceId, date, organizationId' },
        { status: 400 }
      )
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Formato de fecha inválido. Usar YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Si hay múltiples empleados
    if (employeeIdsParam) {
      const employeeIds = employeeIdsParam.split(',').map((id) => id.trim())

      const slots = await generateSlotsForMultipleEmployees({
        employeeIds,
        serviceId,
        date,
        organizationId,
      })

      return NextResponse.json({ slots })
    }

    // Un solo empleado
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Se requiere employeeId o employeeIds' },
        { status: 400 }
      )
    }

    const slots = await generateSlots({
      employeeId,
      serviceId,
      date,
      organizationId,
    })

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error generating slots:', error)

    const message = error instanceof Error ? error.message : 'Error desconocido'

    return NextResponse.json(
      { error: 'Error al generar slots', details: message },
      { status: 500 }
    )
  }
}
