# Sistema de Confirmaciones - Prügressy

**Fecha:** 20 Abril 2026
**Versión:** 1.0

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

## Actores

| Rol | Qué hace |
|-----|-----------|
| **Empleado** | Marca "Listo ✓" cuando termina su servicio |
| **Asistente** (owner/admin/staff) | Cobra al cliente y confirma el pago |
| **Sistema** | Cron automático (cada 3 min) para recordatorios y auto-completado |

---

## Estados de la Cita

```
┌──────────────┐
│  SCHEDULED   │ ← Cita normal, no ha comenzado
└──────┬───────┘
       │ Empleado marca "Listo" (markCompleted)
       ▼
┌──────────────┐
│  COMPLETED    │ ← Empleado terminó, esperando cobro
└──────┬───────┘
       │ Asistente cobra (confirmService)
       ▼
┌──────────────┐
│  CONFIRMED   │ ← Cobrado y confirmado ✓
└──────────────┘

┌──────────────┐
│ NEEDS_REVIEW  │ ← Pasaron 60 min sin marcar (cron)
└──────────────┘
       │
       │ Pasaron 120 min sin cobrar (cron)
       ▼
┌──────────────┐
│  COMPLETED   │ ← Auto-completado por sistema
└──────────────┘
```

---

## Flujo Paso a Paso

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
2. INSERT en confirmation_logs (action = 'created')
3. UPDATE appointments.confirmation_status → 'completed'
4. INSERT en notifications (type = 'service_ready') para cada asistente
5. revalidateTag('confirmations')
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
   - Precio total
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
4. UPDATE payment_method
5. INSERT notification (type = 'confirmation_sent') para el empleado
6. revalidateTag('confirmations')
```

**Resultado:** La cita pasa de `completed` → `confirmed`. El flujo termina.

---

### Paso 4: Cron automático (cada 3 min)

El cron-job.org llama a `/api/cron/check-reminders` cada 3 minutos.

**Backend - runCheckReminders.ts:**

```
REGLA 1 - Recordatorio 5 min antes:
├── Busca citas donde end_time = ahora + 5 min
├── Solamente las que tienen confirmation_status = 'scheduled'
└── INSERT notification (type = 'reminder') para el empleado

REGLA 2 - Alerta sin marcar 60 min+:
├── Busca citas donde end_time + 60 min <= ahora
├── confirmation_status = 'scheduled'
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

## Tablas Involucradas

| Tabla | Uso |
|-------|-----|
| `appointments` | confirmation_status, price_adjustment, payment_method |
| `confirmation_logs` | Auditoría de cada acción (created, confirmed, adjusted, etc.) |
| `notifications` | Notificaciones in-app para empleados y asistentes |

---

## Estructura de Archivos

```
src/
├── actions/
│   └── confirmations/
│       ├── schemas.ts              # Zod schemas
│       ├── markCompleted.ts        # Empleado marca "Listo"
│       ├── confirmService.ts       # Asistente confirma + cobra
│       ├── adjustPrice.ts          # Asistente ajusta precio
│       ├── markManually.ts         # Asistente override manual
│       ├── cancelConfirmation.ts    # Cancelar
│       ├── getConfirmationLogs.ts  # Historial
│       └── getNotifications.ts     # Notificaciones
│   └── cron/
│       └── runCheckReminders.ts    # Lógica del cron
│
├── components/dashboard/
│   ├── ConfirmationButton.tsx    # Botón "Listo ✓"
│   ├── MarkCompletedModal.tsx      # Modal empleado
│   ├── PaymentModal.tsx           # Modal cobro
│   ├── AdjustPriceModal.tsx       # Modal ajustar precio
│   └── ConfirmationsPanel.tsx      # Panel slide-out
│
├── services/confirmations/
│   ├── getPending.ts              # Query pendientes
│   └── getLogs.ts                 # Query historial
│
└── types/
    └── confirmations.ts           # Tipos TypeScript
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
  "autoCompleted": 1
}
```

---

## Flujo Visual

```
EMPLEADO                          SISTEMA                          ASISTENTE
   │                                 │                                 │
   │  1. Marca "Listo"              │                                 │
   │───────────────────────────────►│                                 │
   │                                 │  2. INSERT confirmation_logs     │
   │                                 │  3. UPDATE appointment          │
   │                                 │  4. INSERT notifications ──────►│
   │                                 │                                 │  5. Ve badge +1
   │                                 │                                 │  6. Abre panel
   │                                 │                                 │  7. Toca "Cobrar"
   │                                 │◄────────────────────────────────│  8. Confirma pago
   │                                 │  9. INSERT confirmation_logs    │
   │◄────────────────────────────────│ 10. INSERT notifications       │
   │  11. Ve confirmación           │                                 │
```

---

## Permisos por Rol

| Acción | Owner | Admin | Staff | Employee |
|--------|-------|-------|-------|----------|
| Marcar "Listo" en cita propia | — | — | — | ✅ |
| Ver panel de confirmaciones | ✅ | ✅ | ✅ | — |
| Confirmar servicio (cobrar) | ✅ | ✅ | ✅ | — |
| Ajustar precio | ✅ | ✅ | ✅ | — |
| Marcar manualmente | ✅ | ✅ | ✅ | — |
| Ver historial logs | ✅ | ✅ | ✅ | — |
| Ver notas de otros empleados | ✅ | ✅ | ✅ | — |
| Exportar reportes | ✅ | ✅ | — | — |

---

## Configuración de Variables de Entorno

```env
# URL pública de la app (para el cron)
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Secret para autenticación del cron
CRON_SECRET=tu_secret_seguro
```

---

##鸣

Documento creado: 20 Abril 2026
Autor: Arquitectura SaaS Prügressy
