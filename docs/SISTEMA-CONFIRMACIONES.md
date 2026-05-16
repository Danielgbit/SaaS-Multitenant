# Sistema de Confirmaciones - Prügressy

**Fecha:** 15 Mayo 2026
**Versión:** 2.0

---

## Visión General

El sistema permite la comunicación síncrona entre el empleado que completa un servicio y el asistente (owner/admin/staff) que debe cobrar al cliente.

### Objetivos

1. **Síncrono**: El asistente sabe instantáneamente cuando un servicio terminó
2. **Sencillo**: El empleado marca "Listo" en 2-3 segundos
3. **Flexible**: Permite ajustes de precio por extras/decoraciones
4. **Auditable**: Historial completo de todas las acciones
5. **Moneda**: Pesos Colombianos (COP)

---

## Arquitectura: Dos Flujos Paralelos

El sistema maneja dos flujos de confirmación que coexisten:

| Característica | Flujo A (Por Cita) | Flujo B (Por Confirmación) |
|----------------|---------------------|------------------------------|
| **Tabla** | `appointments.confirmation_status` | `appointment_confirmations` |
| **Iniciador** | Empleado marca "Listo" manualmente | Empleado confirma servicios desde `/my-services` |
| **Uso típico** | Citas programadas | Confirmación de servicios, walk-ins |
| **Estados** | `scheduled` → `completed` → `needs_review` → `confirmed` | `pending_employee` → `pending_reception` → `completed/no_show/not_performed` |

---

## Actores

| Rol | Qué hace |
|-----|-----------|
| **Empleado** | Marca "Listo" cuando termina su servicio, o confirma servicios desde su panel |
| **Asistente** (owner/admin/staff) | Cobra al cliente y confirma el pago desde el panel de confirmaciones |
| **Sistema** | Cron automático (cada 3 min) para recordatorios y auto-completado |

---

## Flujo A: Confirmación por Cita

### Estados

```
┌──────────────┐
│  SCHEDULED   │ ← Cita normal, no ha comenzado
└──────┬───────┘
       │ Empleado marca "Listo" (markCompleted)
       ▼
┌──────────────┐
│  COMPLETED   │ ← Empleado terminó, esperando cobro
└──────┬───────┘
       │ Asistente cobra (confirmService)
       ▼
┌──────────────┐
│  CONFIRMED   │ ← Cobrado y confirmado ✓
└──────────────┘

┌──────────────┐
│ NEEDS_REVIEW │ ← Pasaron 60 min sin marcar (cron)
└──────┬───────┘
       │ Pasaron 120 min sin cobrar (cron)
       ▼
┌──────────────┐
│  COMPLETED   │ ← Auto-completado por sistema
└──────────────┘
```

### Paso 1: Empleado marca "Listo"

```
1. Empleado abre su calendario (/calendar)
2. Toca una cita confirmada (status = 'confirmed')
3. En el modal de detalle, ve el botón "Listo ✓"
4. Lo toca → abre MarkCompletedModal
5. Puede ajustar el precio (ej: +$10.000 por decoración)
6. Agrega nota opcional para el asistente
7. Confirma
```

**Backend - markCompleted.ts:**
```
1. Valida que el usuario es el empleado asignado a esa cita
2. Calcula precio base desde appointment_services + employee_services (price_override)
3. Aplica priceAdjustment al precio final
4. INSERT en confirmation_logs (action = 'created')
5. UPDATE appointments.confirmation_status → 'completed'
6. UPDATE appointments.status → 'completed'
7. INSERT en notifications (type = 'service_ready') para cada asistente
8. revalidateTag('confirmations-{org_id}') + revalidateTag('pending-{org_id}')
```

**Resultado:** La cita pasa de `scheduled` → `completed`

---

### Paso 2: Asistente recibe notificación

```
1. Asistente está en cualquier página del dashboard
2. Ve el badge rojo en el botón Bell del Header (contador +1)
3. Toca el Bell → se abre ConfirmationsPanel (slide-out desde derecha)
4. Ve la lista de pendientes con:
   - Nombre del cliente
   - Nombre del empleado que completó
   - Precio total (calculado desde appointment_services)
   - Tiempo desde que completó
```

**Backend - ConfirmationsPanel:**
```
1. Query appointments donde confirmation_status IN ('completed', 'needs_review')
2. JOIN con clients y employees para mostrar nombres
3. Ordenado por start_time DESC
4. Suscrito a cambios realtime para actualizar automáticamente
```

---

### Paso 3: Asistente cobra

```
1. En el panel, toca "Cobrar $XX.XXX"
2. Se abre PaymentModal
3. Selecciona método de pago (Efectivo, Nequi, Daviplata, PSE, QR, Tarjeta)
4. Opcional: agrega nota interna
5. Confirma
```

**Backend - confirmService.ts:**
```
1. Valida que es owner/admin/staff
2. INSERT en confirmation_logs (action = 'confirmed')
3. UPDATE appointments.confirmation_status → 'confirmed'
4. UPDATE appointments.status → 'completed'
5. UPDATE appointments.payment_method
6. INSERT notification (type = 'confirmation_sent') para el empleado
7. revalidateTag('confirmations-{org_id}') + revalidateTag('pending-{org_id}')
8. revalidatePath('/payroll') + revalidatePath('/calendar')
9. Auto-agregar a nómina: addAppointmentToPayroll(appointmentId)
```

**Resultado:** La cita pasa de `completed` → `confirmed`. El flujo termina.

---

## Flujo B: Confirmación por Servicios

Este flujo permite a los empleados confirmar servicios realizados sin necesidad de una cita previa (walk-ins) o como complemento a las citas programadas.

### Estados

```
┌─────────────────────┐
│  PENDING_EMPLOYEE    │ ← Empleado debe confirmar servicios
└──────────┬──────────┘
           │ Empleado confirma (createConfirmation)
           ▼
┌─────────────────────┐
│  PENDING_RECEPTION   │ ← Listo para cobro
└──────────┬──────────┘
           │ Asistente cobra (confirmByReception)
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────┐
│COMPLETED│  │ NO_SHOW  │
└─────────┘  └──────────┘

     ┌──────────┐
     ▼
┌───────────────┐
│ NOT_PERFORMED │
└───────────────┘
```

### Paso 1: Empleado confirma servicios

```
1. Empleado abre /dashboard/my-services
2. Ve la lista de servicios pendientes
3. Toca "Confirmar servicios"
4. Selecciona servicios realizados (checkboxes)
5. Indica si es scheduled o walkin
6. Confirma
```

**Backend - createConfirmation.ts:**
```
1. Valida que el usuario pertenece a la organización
2. Valida que employee_id pertenece a la organización
3. Calcula total desde servicios performed
4. INSERT en appointment_confirmations (status = 'pending_reception')
5. Si tiene appointment_id, UPDATE appointments.status → 'completed'
6. revalidatePath('/dashboard/confirmations/employee')
7. revalidatePath('/dashboard/confirmations/reception')
8. revalidatePath('/dashboard/my-services')
9. revalidatePath('/payroll')
```

---

### Paso 2: Recepción confirma cobro

```
1. Asistente abre /dashboard/confirmations/reception
2. Ve lista de confirmaciones pendientes
3. Toca "Confirmar" para cobrar o selecciona acción (no_show, not_performed)
4. Ingresa método de pago (si complete)
5. Confirma
```

**Backend - confirmByReception.ts:**
```
1. Valida que es owner/admin/staff
2. UPDATE appointment_confirmations.status → 'completed'/'no_show'/'not_performed'
3. Si hay appointment_id, actualiza su status según acción
4. Si action = 'complete', auto-agregar a nómina
5. revalidatePath('/dashboard/confirmations/reception')
6. revalidatePath('/dashboard/confirmations/employee')
7. revalidatePath('/payroll')
```

---

## Cron Automático (cada 3 min)

El cron-job.org llama a `/api/cron/check-reminders` cada 3 minutos.

**Backend - runCheckReminders.ts:**

```
REGLA 1 - Recordatorio 5 min antes (máx 2 por cita):
├── Busca citas donde end_time = ahora + 5 min (±1 min)
├── confirmation_status = 'scheduled', status = 'confirmed'
├── CONTROLA: No envía si ya hay 2 reminders en últimos 10 min
├── CONTROLA: No envía si ya hay reminder en últimos 3 min
└── INSERT notification (type = 'reminder') para el empleado

REGLA 2 - Alerta sin marcar 60 min+:
├── Busca citas donde end_time + 60 min <= ahora
├── confirmation_status = 'scheduled', status = 'confirmed'
├── UPDATE confirmation_status → 'needs_review'
└── INSERT notification (type = 'unmarked_alert') para asistentes

REGLA 3 - Auto-completado 120 min+:
├── Busca citas donde end_time + 120 min <= ahora
├── confirmation_status = 'needs_review'
├── UPDATE confirmation_status → 'completed'
├── INSERT confirmation_logs (action = 'manually_set', role = 'system')
└── INSERT notification (type = 'auto_completed') para asistentes
```

---

## Métodos de Pago

| Método | Código interno |
|--------|----------------|
| Efectivo | `efectivo` |
| Nequi | `nequi` |
| Daviplata | `daviplata` |
| PSE | `pse` |
| QR Nequi | `qr_nequi` |
| QR Bancolombia | `qr_bancolombia` |
| Tarjeta Débito | `tarjeta_debito` |
| Tarjeta Crédito | `tarjeta_credito` |

---

## Cálculo de Precios

El precio final se calcula desde la relación de servicios:

```
Precio base = Σ (appointment_services.service_id → services.price)
              O bien employee_services.price_override si existe

Precio final = Precio base + price_adjustment (markCompleted)
```

El `price_adjustment` permite al empleado agregar extras (decoraciones, etc.) al precio base.

---

## Tablas Involucradas

| Tabla | Uso |
|-------|-----|
| `appointments` | `confirmation_status`, `price_adjustment`, `payment_method`, `completed_at`, `confirmed_at` |
| `appointment_confirmations` | Confirmaciones independientes con servicios, estados propios |
| `confirmation_logs` | Auditoría de cada acción (created, confirmed, adjusted, manually_set, cancelled) |
| `notifications` | Notificaciones in-app para empleados y asistentes |
| `appointment_services` | Servicios asociados a la cita para cálculo de precio base |
| `employee_services` | Price override por empleado para servicios específicos |

---

## Estructura de Archivos

```
src/
├── actions/
│   └── confirmations/
│       ├── types.ts                 # TypeScript interfaces (AppointmentConfirmation, etc.)
│       ├── schemas.ts               # Zod schemas para validación
│       ├── markCompleted.ts        # Flujo A: Empleado marca "Listo"
│       ├── confirmService.ts       # Flujo A: Asistente confirma + cobra
│       ├── adjustPrice.ts          # Asistente ajusta precio post-completado
│       ├── markManually.ts         # Asistente override manual
│       ├── cancelConfirmation.ts   # Cancelar confirmación
│       ├── getConfirmationLogs.ts  # Historial de logs
│       ├── getNotifications.ts     # Notificaciones + unread count
│       ├── markNotificationRead.ts # Marcar notificación como leída
│       ├── getConfirmations.ts     # Query confirmaciones pendientes
│       ├── createConfirmation.ts   # Flujo B: Empleado confirma servicios
│       └── confirmByReception.ts  # Flujo B: Recepción confirma cobro
│   └── cron/
│       └── runCheckReminders.ts    # Lógica del cron (3 reglas)
│
├── components/dashboard/
│   ├── ConfirmationButton.tsx     # Botón "Listo ✓" en modal de cita
│   ├── MarkCompletedModal.tsx     # Modal empleado para marcar completado
│   ├── PaymentModal.tsx           # Modal cobro con métodos de pago
│   ├── AdjustPriceModal.tsx      # Modal ajustar precio
│   ├── ConfirmationsPanel.tsx    # Panel slide-out para asistentes
│   └── SecurityConfirmationModal.tsx # Modal seguridad RBAC (NO relacionado a confirmaciones)
│
├── services/confirmations/
│   ├── index.ts                  # Export agregados
│   ├── getPending.ts             # Query pendientes (deprecated, usar getConfirmations)
│   └── getLogs.ts                # Query historial
│
└── types/
    └── confirmations.ts          # Tipos públicos para el frontend
```

---

## API del Cron

**Endpoint:** `POST /api/cron/check-reminders`

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Respuesta:**
```json
{
  "success": true,
  "processed": 3,
  "reminders": 1,
  "alerts": 1,
  "autoCompleted": 1,
  "errors": []
}
```

---

## Flujo Visual - Flujo A

```
EMPLEADO                          SISTEMA                          ASISTENTE
   │                                 │                                 │
   │  1. Marca "Listo"              │                                 │
   │───────────────────────────────►│                                 │
   │                                 │  2. Calcula precio base        │
   │                                 │  3. INSERT confirmation_logs    │
   │                                 │  4. UPDATE appointment          │
   │                                 │  5. INSERT notifications ──────►│
   │                                 │                                 │  6. Ve badge +1
   │                                 │                                 │  7. Abre panel
   │                                 │                                 │  8. Toca "Cobrar"
   │                                 │◄────────────────────────────────│  9. Confirma pago
   │                                 │ 10. INSERT confirmation_logs    │
   │                                 │ 11. Auto-agregar a nómina       │
   │◄────────────────────────────────│ 12. INSERT notifications       │
   │ 13. Ve confirmación            │                                 │
   │                                 │                                 │
```

---

## Permisos por Rol

| Acción | Owner | Admin | Staff | Employee |
|--------|-------|-------|-------|----------|
| Marcar "Listo" en cita propia | — | — | — | ✅ |
| Crear confirmación de servicios | — | — | — | ✅ |
| Ver panel de confirmaciones | ✅ | ✅ | ✅ | — |
| Confirmar servicio (cobrar) | ✅ | ✅ | ✅ | — |
| Confirmar por recepción | ✅ | ✅ | ✅ | — |
| Ajustar precio | ✅ | ✅ | ✅ | — |
| Marcar manualmente | ✅ | ✅ | ✅ | — |
| Cancelar confirmación | ✅ | ✅ | ✅ | — |
| Ver historial logs | ✅ | ✅ | ✅ | — |
| Ver notas de otros empleados | ✅ | ✅ | ✅ | — |
| Marcar notificación como leída | ✅ | ✅ | ✅ | ✅ |
| Exportar reportes | ✅ | ✅ | — | — |

---

## Acciones de Log

| Acción | Uso |
|--------|-----|
| `created` | Empleado marca "Listo" (markCompleted) |
| `confirmed` | Asistente confirma cobro (confirmService) |
| `adjusted` | Asistente ajustó precio (adjustPrice) |
| `manually_set` | Asistente marcó manualmente o sistema auto-completó |
| `cancelled` | Confirmación cancelada |

---

## Tipos de Notificación

| Tipo | Destinatario | Trigger |
|------|--------------|---------|
| `reminder` | Empleado | 5 min antes de terminar (máx 2 por cita) |
| `service_ready` | Asistentes | Empleado marcó "Listo" |
| `unmarked_alert` | Asistentes | Pasaron 60 min sin marcar |
| `auto_completed` | Asistentes | Sistema auto-completó tras 120 min |
| `confirmation_sent` | Empleado | Asistente confirmó cobro |

---

## Configuración de Variables de Entorno

```env
# URL pública de la app (para el cron)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Secret para autenticación del cron
CRON_SECRET=tu_secret_seguro
```

---

## Notas de Implementación

- El flujo A y B coexisten. El Flujo A usa `confirmation_status` en `appointments`. El Flujo B usa la tabla `appointment_confirmations`.
- Cuando `markManually` marca una cita, también crea un registro en `appointment_confirmations` para que aparezca en el panel de recepción.
- La auto-agregación a nómina ocurre en `confirmService` y `confirmByReception` (action='complete') de forma fire-and-forget.
- El cron limita a 2 reminders por cita en ventanas de 10 min, y no envía si ya existe reminder reciente (< 3 min).

---

**Documento actualizado:** 15 Mayo 2026
**Autor:** Arquitectura SaaS Prügressy
**Versión:** 2.0 (Ampliado con Flujo B y correcciones)