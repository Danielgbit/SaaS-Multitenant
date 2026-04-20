# Arquitectura del Sistema de Confirmaciones - Prügressy

**Proyecto:** Prügressy SaaS  
**Fecha:** 19 Abril 2026  
**Versión:** 1.0  
**Estado:** Aprobado para implementación  

---

## 1. Visión General

El sistema de confirmaciones permite la comunicación síncrona entre el empleado que completa un servicio y el asistente (owner/admin/staff) que debe cobrar al cliente. Todo el flujo ocurre en tiempo real dentro del mismo SaaS.

### Objetivos

1. **Síncrono**: El asistente sabe instantáneamente cuando un servicio terminó
2. **Sencillo**: El empleado marca "Listo" en 2-3 segundos
3. **Flexible**: Permite ajustes de precio por extras/decoraciones
4. **Auditable**: Historial completo de todas las acciones
5. **Moneda**: Pesos Colombianos (COP)

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO INTERNO CONFIRMACIONES                      │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐          ┌──────────────────┐          ┌────────┐
  │  EMPLOYEE    │          │     SYSTEM       │          │  DB    │
  │  (Empleado)  │          │    (Supabase)    │          │        │
  └──────┬───────┘          └───────┬──────────┘          └────┬───┘
         │                         │                           │
         │  1. Marca "Listo ✓"    │                           │
         │     (precio + ajuste)   │                           │
         │────────────────────────►│                           │
         │                         │  2. INSERT confirmation_log│
         │                         │  3. UPDATE appointment     │
         │                         │     status = 'completed' │
         │                         │───────────────────────────►│
         │                         │                           │
         │                         │  4. REALTIME notification  │
         │                         │     al asistente          │
         │                         │◄──────────────────────────│
         │                         │                           │
         │                         │                           │
         │                         ▼                           │
         │                   ┌──────────────────┐              │
         │                   │  PANEL ASISTENTE │              │
         │                   │  (Slide-out)     │              │
         │                   └──────▲───────────-┘              │
         │                         │                           │
         │                         │  5. Registra pago         │
         │                         │     (método + precio)      │
         │                         │                           │
         │                         │  6. UPDATE confirmation   │
         │                         │        _log                │
         │                         │     (action='confirmed')  │
         │                         │                           │
         │                         ▼                           │
         │                   ┌──────────────────┐              │
         │                   │  CITA CONFIRMADA  │              │
         │                   │  ✓ LISTO          │              │
         │                   └──────────────────┘              │
         │                                                       
         │  BACKGROUN D (cada 3 min via cron-job.org)          
         ▼                                                        
┌──────────────────────────────────────────────────────────────┐
│  /api/cron/check-reminders (Edge Function)                    │
│                                                              │
│  • Recordatorio 5 min antes del servicio (empleado)          │
│  • Alerta de citas "sin marcar" 60 min+ (asistente)          │
│  • Auto-completado 120 min+ después hora_fin                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Estados de la Cita

```
┌──────────────┐
│   SCHEDULED  │  (Cita programada, no ha comenzado)
└──────┬───────┘
       │
       │ Empleado marca "Listo"
       ▼
┌──────────────┐
│   COMPLETED  │  (Empleado marcó, esperando cobro)
└──────┬───────┘
       │
       │ Asistente confirma + registra pago
       ▼
┌──────────────┐
│   CONFIRMED  │  (Cobrado y confirmado)
└──────────────┘

┌──────────────┐
│ NEEDS_REVIEW │  (⚠️ Cita sin marcar 60 min+)
└──────────────┘
```

---

## 4. Base de Datos

### 4.1 Nueva Tabla: confirmation_logs

```sql
CREATE TABLE confirmation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN (
    'created',      -- Empleado marcó "Listo"
    'confirmed',    -- Asistente confirmó + cobró
    'adjusted',     -- Asistente ajustó precio
    'manually_set', -- Asistente marcó manualmente
    'cancelled'     -- Cancelado
  )),
  performed_by UUID REFERENCES auth.users(id),
  performed_by_role VARCHAR(20) NOT NULL CHECK (performed_by_role IN (
    'employee', 'assistant', 'system'
  )),
  price_before DECIMAL(10,0),  -- NULL si no cambió
  price_after DECIMAL(10,0),   -- Precio final cobrado
  payment_method VARCHAR(20),  -- NULL hasta confirmación
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_confirmation_logs_appointment_id 
  ON confirmation_logs(appointment_id);
CREATE INDEX idx_confirmation_logs_created_at 
  ON confirmation_logs(created_at DESC);
CREATE INDEX idx_confirmation_logs_performed_by 
  ON confirmation_logs(performed_by);
```

### 4.2 Nueva Tabla: notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'reminder',           -- 5 min antes del servicio
    'service_ready',      -- Empleado marcó "Listo"
    'unmarked_alert',     -- Cita sin marcar 60 min+
    'auto_completed',     -- Sistema marcó manualmente
    'confirmation_sent'   -- Cliente recibió confirmación
  )),
  title VARCHAR(100) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id 
  ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_organization_id 
  ON notifications(organization_id);
```

### 4.3 Modificación: appointments

```sql
ALTER TABLE appointments 
ADD COLUMN confirmation_status VARCHAR(20) DEFAULT 'scheduled' 
CHECK (confirmation_status IN (
  'scheduled',   -- Programada
  'completed',   -- Empleado marcó "Listo"
  'confirmed',   -- Asistente confirmó
  'needs_review' -- Pendiente revisión (sin marcar)
));

ALTER TABLE appointments
ADD COLUMN completed_at TIMESTAMPTZ,
ADD COLUMN completed_by UUID REFERENCES auth.users(id),
ADD COLUMN confirmed_at TIMESTAMPTZ,
ADD COLUMN confirmed_by UUID REFERENCES auth.users(id),
ADD COLUMN price_adjustment DECIMAL(10,0) DEFAULT 0,
ADD COLUMN payment_method VARCHAR(20);
```

---

## 5. Métodos de Pago

| Método | Código interno | Descripción |
|--------|----------------|-------------|
| Efectivo | `efectivo` | Pago en cash |
| Nequi | `nequi` | Transferencia Nequi |
| Daviplata | `daviplata` | Transferencia Daviplata |
| PSE | `pse` | Pago con cuenta bancaria |
| QR Nequi | `qr_nequi` | QR Nequi |
| QR Bancolombia | `qr_bancolombia` | QR Bancolombia |
| Tarjeta Débito | `tarjeta_debito` | POS Débito |
| Tarjeta Crédito | `tarjeta_credito` | POS Crédito |

---

## 6. Backend - Server Actions

### 6.1 Acciones del Empleado

| Action | Descripción | Input | Output |
|--------|-------------|-------|--------|
| `markCompleted()` | Empleado marca "Listo" | `appointmentId`, `priceAdjustment`, `notes` | `{ success, logId }` |

```typescript
// markCompleted.ts
interface MarkCompletedInput {
  appointmentId: string;
  priceAdjustment?: number;  // Ajustes por extras (COP)
  notes?: string;           // Nota para el asistente
}

interface MarkCompletedOutput {
  success: boolean;
  logId: string;
  error?: string;
}
```

### 6.2 Acciones del Asistente

| Action | Descripción | Input | Output |
|--------|-------------|-------|--------|
| `confirmService()` | Asistente confirma + cobra | `logId`, `paymentMethod`, `notes` | `{ success, appointmentId }` |
| `adjustPrice()` | Asistente ajusta precio | `appointmentId`, `newPrice`, `reason` | `{ success, logId }` |
| `markManually()` | Asistente marca manualmente | `appointmentId`, `reason` | `{ success, logId }` |

```typescript
// confirmService.ts
interface ConfirmServiceInput {
  logId: string;
  paymentMethod: 'efectivo' | 'nequi' | 'daviplata' | 'pse' | 'qr_nequi' | 'qr_bancolombia' | 'tarjeta_debito' | 'tarjeta_credito';
  notes?: string;  // Nota interna (solo visible para asistente)
}
```

### 6.3 Acciones de Consulta

| Action | Descripción | Input | Output |
|--------|-------------|-------|--------|
| `getPendingConfirmations()` | Lista de pendientes | `organizationId` | `Confirmation[]` |
| `getConfirmationLogs()` | Historial | `appointmentId` | `Log[]` |
| `getNotifications()` | Notificaciones usuario | `userId` | `Notification[]` |
| `markNotificationRead()` | Marcar leída | `notificationId` | `{ success }` |

---

## 7. Frontend - Vistas

### 7.1 Vista del Empleado

**Calendario del Empleado (`/calendar`):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Menú          Prügressy           [🔔 2] [⚙️] [👤 María]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BIENVENIDA, MARÍA                                                 │
│  Mi Agenda de Hoy - Lunes 19 Abril                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔔 RECORDATORIO: Servicio con Laura G. termina en 5 min    │   │
│  │    Manicura Gel - $35.000                                   │   │
│  │    [Confirmaré pronto]                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ─────────────────────────────────────────────────────────────     │
│                                                                     │
│  Citas Completadas (2)                                              │
│  ✅ 09:00 - 09:45  |  Ana S.     |  Manicura Gel    |  $35.000      │
│  ✅ 10:00 - 10:30  |  Carlos R.  |  Corte Barba     |  $25.000      │
│                                                                     │
│  ─────────────────────────────────────────────────────────────     │
│                                                                     │
│  Próximas Citas                                                    │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐              │
│  │ 11:00 - 11:45        │  │ 12:30 - 13:15        │              │
│  │ ━━━━━━━━━━━━━━━━━━━━ │  │ ━━━━━━━━━━━━━━━━━━━━ │              │
│  │ Roberto M.           │  │ Ana S.               │              │
│  │ Corte Barba          │  │ Pedicuria            │              │
│  │ $25.000              │  │ $30.000              │              │
│  │                      │  │                      │              │
│  │   [ Listo ✓ ]        │  │   [ Listo ✓ ]        │              │
│  │   (glow cuando       │  │   (listo)            │              │
│  │    llega la hora)   │  │                      │              │
│  └──────────────────────┘  └──────────────────────┘              │
│                                                                     │
│  ─────────────────────────────────────────────────────────────     │
│                                                                     │
│  Estado del Equipo                                                  │
│  ● María (tú) - En servicio                                      │
│  ○ Carlos - Disponible                                             │
│  ● Ana - En servicio                                               │
│  ○ Laura - Disponible                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Modal al tocar "Listo ✓":**

```
┌─────────────────────────────────────────────────────┐
│ ✓ Confirmar Servicio                         [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Cliente: Roberto M.                               │
│  Servicio: Corte Barba                             │
│  Duración: 45 min                                  │
│                                                     │
│  Precio base: $25.000 COP                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Ajuste por extras (opcional):               │   │
│  │ [$ +10.000________] (decoración)           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Precio Total: $35.000 COP                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Notas para el asistente (opcional):         │   │
│  │ [Decoración con gel_____]                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│            [ Confirmar → Recibido ]               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 7.2 Vista del Asistente

**Header con Badge:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  Menú          Prügressy - Spa María      [🔔 3] [📊] [👤 Admin] │
└─────────────────────────────────────────────────────────────────────┘
                                    [3] = Badge con pendientes
```

**Panel Slide-out (al tocar 🔔):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ☰  │  PANEL DE CONFIRMACIONES (slide-out desde derecha)   [X] │
│     │                                                               │
│     │  🔔 3 SERVICIOS PENDIENTES                              │
│     │                                                               │
│     │  [Todas] [María✓] [Carlos] [Ana] [Laura] [Pedro]          │
│     │  (tabs si hay 4+ empleados, dropdown si hay 1-3)          │
│     │                                                               │
│     │  ┌─────────────────────────────────────────────────────┐   │
│     │  │ ⭐ MARÍA · hace 30 seg                              │   │
│     │  │ Cliente: Roberto M.                                 │   │
│     │  │ Servicio: Corte Barba                               │   │
│     │  │ Precio: $35.000 (base $25.000 + ajuste $10.000)    │   │
│     │  │ Nota: Decoración con gel                             │   │
│     │  │                                                      │   │
│     │  │ [💵 Cobrar $35.000]  [Ajustar precio]  [ℹ️ Info]   │   │
│     │  └─────────────────────────────────────────────────────┘   │
│     │                                                               │
│     │  ┌─────────────────────────────────────────────────────┐   │
│     │  │ ⚠️ CARLOS · hace 1h 23min (SIN MARCAR)           │   │
│     │  │ Cliente: Pedro R.                                   │   │
│     │  │ Servicio: Manicura Spa                              │   │
│     │  │                                                      │   │
│     │  │ [ ⚠️ Marcar como Completado + Cobrar ]             │   │
│     │  └─────────────────────────────────────────────────────┘   │
│     │                                                               │
│     │  ┌─────────────────────────────────────────────────────┐   │
│     │  │ ⭐ ANA · hace 2 min                               │   │
│     │  │ ...                                                 │   │
│     │  └─────────────────────────────────────────────────────┘   │
│     │                                                               │
└─────┴───────────────────────────────────────────────────────────────┘
```

**Modal de Cobro:**

```
┌─────────────────────────────────────────────────────┐
│ Cobrar Servicio                              [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Cliente: Roberto M.                               │
│  Servicio: Corte Barba                             │
│  Empleado: María                                   │
│                                                     │
│  Precio: $35.000 COP                               │
│                                                     │
│  Método de pago:                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ [💵 EF] [📱 NEQ] [📱 DAV] [🏦 PSE] [📱 QR] │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Nota interna (solo visible para staff):            │
│  ┌─────────────────────────────────────────────┐   │
│  │ [________________________________]          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│            [ ✓ Confirmar Cobro $35.000 ]           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Resultado después de cobrar:**

```
┌─────────────────────────────────────────────────────┐
│ ✅ ¡Cobro registrado!                              │
│                                                     │
│  Roberto M. - Corte Barba - $35.000 COP            │
│  Método: Nequi                                      │
│  Registrado por: Admin (María)                     │
│  Hora: 11:47 am                                    │
│                                                     │
│            [ Entendido ]                            │
└─────────────────────────────────────────────────────┘
```

---

## 8. Sistema de Recordatorios (Background)

### 8.1 cron-job.org Configuration

| Setting | Value |
|---------|-------|
| Schedule | Every 3 minutes |
| URL | `https://tu-dominio.com/api/cron/check-reminders` |
| Method | GET |
| Authentication | Secret header or query param |

### 8.2 Lógica del Cron

```typescript
// Edge Function: /api/cron/check-reminders
// Secrets: CRON_SECRET

// 1. RECORDATORIO 5 MIN ANTES
// Para cada cita donde hora_fin = ahora + 5 min y no se envió recordatorio
// → Crear notification type='reminder' para el empleado

// 2. ALERTA "SIN MARCAR" 60 MIN+
// Para cada cita donde hora_fin + 60 min <= ahora 
//    AND confirmation_status = 'scheduled'
// → UPDATE confirmation_status = 'needs_review'
// → Crear notification type='unmarked_alert' para asistente

// 3. AUTO-COMPLETADO 120 MIN+
// Para cada cita donde hora_fin + 120 min <= ahora 
//    AND confirmation_status = 'needs_review'
// → UPDATE confirmation_status = 'completed'
// → UPDATE completed_at = now()
// → Crear notification type='auto_completed' para asistente
```

### 8.3 Timing de Recordatorios

| Evento | Timing | Acción |
|--------|--------|--------|
| Recordatorio pre-servicio | hora_fin - 5 min | Badge + toast al empleado |
| Alerta sin marcar | hora_fin + 60 min | Badge "⚠️ Sin marcar" en panel asistente |
| Auto-completado | hora_fin + 120 min | Sistema marca automáticamente |

---

## 9. Realtime

### 9.1 Canales Supabase Realtime

| Channel | Event | Suscriptor |
|---------|-------|------------|
| `notifications:*` | INSERT | Asistentes del negocio |
| `appointments:*` | UPDATE | Asistentes del negocio |
| `confirmation_logs:*` | INSERT | Asistentes del negocio |

### 9.2 Implementación

```typescript
// En el componente del panel del asistente
supabase
  .channel('confirmations')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `organization_id=eq.${orgId}`
  }, (payload) => {
    // Actualizar badge y lista de pendientes
  })
  .subscribe()
```

---

## 10. Permisos por Rol

| Acción | Owner | Admin | Staff | Employee |
|--------|-------|-------|-------|----------|
| Marcar "Listo" en cita propia | ✅ | ✅ | ✅ | ✅ |
| Ver panel de confirmaciones | ✅ | ✅ | ✅ | ❌ |
| Confirmar servicio (cobrar) | ✅ | ✅ | ✅ | ❌ |
| Ajustar precio | ✅ | ✅ | ✅ | ❌ |
| Marcar manualmente | ✅ | ✅ | ✅ | ❌ |
| Ver historial logs | ✅ | ✅ | ✅ | ❌ |
| Ver notas de otros empleados | ✅ | ✅ | ✅ | ❌ |
| Exportar reportes | ✅ | ✅ | ❌ | ❌ |

---

## 11. Estructura de Archivos

```
src/
├── actions/
│   └── confirmations/
│       ├── markCompleted.ts       # Empleado marca "Listo"
│       ├── confirmService.ts      # Asistente confirma + cobra
│       ├── adjustPrice.ts         # Asistente ajusta precio
│       ├── markManually.ts        # Asistente marca manualmente
│       ├── getPendingConfirmations.ts  # Lista pendientes
│       ├── getConfirmationLogs.ts # Historial
│       ├── getNotifications.ts    # Notificaciones usuario
│       └── markNotificationRead.ts # Marcar leída
│
├── app/
│   └── (dashboard)/
│       ├── calendar/
│       │   └── CalendarView.tsx   # Vista empleado (modificada)
│       ├── confirmations/
│       │   ├── ConfirmationsPanel.tsx  # Panel slide-out
│       │   ├── PendingList.tsx     # Lista de pendientes
│       │   ├── ConfirmationCard.tsx # Card de confirmación
│       │   ├── PaymentModal.tsx    # Modal de cobro
│       │   └── AdjustPriceModal.tsx # Modal ajustar precio
│       └── api/
│           └── cron/
│               └── check-reminders/
│                   └── route.ts     # Edge Function
│
├── components/
│   └── dashboard/
│       ├── Header.tsx             # Badge de notificaciones
│       ├── CollapsibleSidebar.tsx  # Link al panel
│       └── ConfirmationButton.tsx  # Botón "Listo ✓"
│
├── lib/
│   ├── supabase/
│   │   └── client.ts              # Cliente realtime
│   └── payments.ts                 # Constantes de métodos pago
│
├── services/
│   └── confirmations/
│       ├── getPending.ts          # Query pendientes
│       └── getLogs.ts             # Query historial
│
└── types/
    └── confirmations.ts           # Tipos TypeScript
```

---

## 12. Plan de Implementación por Fases

### Fase 1: Base de Datos
- [ ] Migration: crear tablas `confirmation_logs` y `notifications`
- [ ] Migration: modificar `appointments` (nuevas columnas)
- [ ] Testing: CRUD de tablas

### Fase 2: Backend - Server Actions
- [ ] `markCompleted()` - Empleado marca
- [ ] `confirmService()` - Asistente confirma
- [ ] `adjustPrice()` - Ajustar precio
- [ ] `markManually()` - Override manual
- [ ] `getPendingConfirmations()` - Lista
- [ ] `getConfirmationLogs()` - Historial
- [ ] `getNotifications()` / `markNotificationRead()`

### Fase 3: Frontend - Empleado
- [ ] Botón "Listo ✓" en tarjetas de cita
- [ ] Modal de confirmación con ajustes
- [ ] Toast de confirmación
- [ ] Recordatorios visuales (glow)

### Fase 4: Frontend - Asistente
- [ ] Badge en Header con contador
- [ ] Panel slide-out desde sidebar
- [ ] Lista de pendientes con filtros
- [ ] Modal de cobro con métodos de pago
- [ ] Funcionalidad de ajustar precio

### Fase 5: Realtime
- [ ] Configurar canales Supabase
- [ ] Suscripción en panel asistente
- [ ] Actualización instantánea del badge

### Fase 6: Cron
- [ ] Edge Function `/api/cron/check-reminders`
- [ ] Configurar cron-job.org (cada 3 min)
- [ ] Testing de recordatorios

### Fase 7: Testing E2E
- [ ] Flujo completo empleado → asistente
- [ ] Flujo de ajuste de precio
- [ ] Flujo de "sin marcar"
- [ ] Verificación de permisos por rol

---

## 13. Variables de Entorno

```env
# Cron authentication
CRON_SECRET=tu_secret_seguro_aqui

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 14. Pendientes para Fases Futuras

| Fase | Descripción | Dependencias |
|------|-------------|--------------|
| **v1.1** | Envío de confirmación al cliente (email/WhatsApp) | pipedream o n8n |
| **v1.2** | Reportes de ingresos por método de pago | Fase 1 completa |
| **v1.3** | Integración con APIs de bancos (Nequi/Daviplata) | Partnerships |
| **v2.0** | Migración a n8n para automatizaciones | n8n self-hosted |

---

## 15. Decisiones Clave

| Decisión | Justificación |
|----------|---------------|
| Cron cada 3 min | Balance entre precisión y rate limits de cron-job.org |
| 5 min de recordatorio | Sweet spot para que el empleado se prepare |
| Sin sonido | Ambiente de spa/salón debe ser tranquilo |
| Slide-out panel | No ocupa espacio, siempre accesible |
| Badge en header | Visible desde cualquier página |
| COP sin decimales | Moneda colombiana, no se usan centavos |
| Métodos de pago configurable | Cada negocio puede activar/desactivar según su realidad |

---

*Documento creado: 19 Abril 2026*  
*Autor: Arquitectura SaaS Prügressy*  
*Versión: 1.0 - Listo para implementación*
