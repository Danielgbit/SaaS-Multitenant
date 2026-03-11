# Product Roadmap - SaaS Prügressy

## Strategy Context

**Business Goal:** Build a B2B scheduling SaaS for wellness/health businesses (barberías, spas, clínicas, centros de bienestar)

**Customer Problems:**
- Gestión manual de citas y horarios
- Sin visibilidad de disponibilidad en tiempo real
- Proceso de reserva tedioso para clientes

**Constraints & Dependencies:**
- Supabase for auth + database
- Next.js 14 App Router
- Multi-tenant architecture (organizations)

---

## Roadmap (Now / Next / Later)

| Stage | Initiative | Outcome | Metric | Notes |
|---|---|---|---|---|
| **Now** | Authentication & Organization | Sistema de auth funcional con organizaciones | # usuarios registrados | ✅ Completado |
| **Now** | Employee Management | CRUD de empleados por organización | # empleados activos | ✅ Completado |
| **Now** | Service Management | CRUD de servicios con duración y precio | # servicios configurados | ✅ Completado |
| **Now** | Employee Availability | Configuración de horarios por empleado | % empleados con agenda completa | ✅ Completado |
| **Now** | **Slots Engine** | **Generación de slots disponibles en tiempo real** | **Slots calculados correctamente** | **✅ Completado** |
| **Now** | **Client Management** | **CRUD de clientes con grid UI** | **# clientes registrados** | **✅ Completado** |
| **Next** | Calendar View | Vista de calendario con citas del día/semana | Citas visualizadas | En progreso |
| **Next** | Appointment Booking | Crear/cancelar/reschedule citas | Citas creadas exitosamente | - |
| **Later** | Public Booking Page | Página de reservas pública para clientes | Reservas desde web | - |
| **Later** | WhatsApp Integration | Recordatorios automáticos por WhatsApp | Tasa de asistencia | - |
| **Later** | Billing & Subscriptions | Planes y pagos mensuales | MRR | - |

---

## Slots Engine - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Generate Slots Logic | `src/services/slots/generateSlots.ts` | ✅ |
| Get Appointments | `src/services/appointments/getAppointments.ts` | ✅ |
| API Route (`GET /api/slots`) | `src/app/api/slots/route.ts` | ✅ |
| Server Action (`createAppointment`) | `src/actions/appointments/createAppointment.ts` | ✅ |
| UI Component (`SlotsPicker`) | `src/components/dashboard/SlotsPicker.tsx` | ✅ |

### Pendientes del módulo "Slots Engine"
- [x] Selector de cliente (client_id en createAppointment)
- [x] Mejora UI con design system
- [ ] Tests unitarios

---

## Client Management - Detalle de Implementación

| Componente | Archivo | Estado |
|------------|---------|--------|
| Server Action (`createClient`) | `src/actions/clients/createClient.ts` | ✅ |
| Server Action (`updateClient`) | `src/actions/clients/updateClient.ts` | ✅ |
| Server Action (`deleteClient`) | `src/actions/clients/deleteClient.ts` | ✅ |
| UI Component (`ClientsClient`) | `src/app/(dashboard)/clients/ClientsClient.tsx` | ✅ |
| UI Component (`ClientCard`) | `src/app/(dashboard)/clients/ClientCard.tsx` | ✅ |
| UI Component (`EditClientModal`) | `src/app/(dashboard)/clients/EditClientModal.tsx` | ✅ |
| UI Component (`DeleteClientModal`) | `src/app/(dashboard)/clients/DeleteClientModal.tsx` | ✅ |

### Características implementadas
- Grid layout con cards de clientes
- Búsqueda en tiempo real
- Filtros (Todos/Activos)
- Modal unificado para crear y editar
- Confirmación de eliminación
- Validación Zod en Server Actions
- Design system tokens aplicados

---

## Riesgos y Dependencias

- **Dependencia:** Tabla `appointments` debe existir en Supabase
- **Riesgo:** Race conditions al crear citas simultáneas - mitigado con verificación de disponibilidad
- **Riesgo:** Timezone management - usar `booking_settings.timezone`

---

## Próximos Pasos Inmediatos

1. **Calendario** → Vista visual de citas por día/semana
2. **Reservas** → Integrar SlotsPicker en flujo de reservas
3. **Public Booking Page** → Página de reservas pública para clientes