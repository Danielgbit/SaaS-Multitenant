# Plan de Pruebas: Confirmaciones y Módulo de Empleados

## Objetivo
Probar el flujo completo: Cliente llega → Empleado confirma que acabó → Confirmación llega al Dashboard del Owner.

---

## FASE 1: Setup de Datos de Prueba

### 1.1 Crear empleado con acceso al sistema

**Opción A - Si el empleado ya existe:**
```sql
-- Ver empleados existentes
SELECT id, name, user_id, active FROM employees WHERE organization_id = '<tu_org_id>';
```

**Opción B - Crear empleado nuevo:**
```typescript
// Ir a: /employees
// Click "Nuevo Empleado"
// Completar: Nombre, Teléfono
// Click "Guardar"
```

### 1.2 Asignar servicios al empleado

```typescript
// Ir a: /employees/[id_empleado]
// Tab "Servicios"
// Seleccionar servicios disponibles
// Guardar
```

### 1.3 Configurar disponibilidad del empleado

```typescript
// Ir a: /employees/[id_empleado]
// Tab "Disponibilidad"
// Configurar horarios por día
// Guardar
```

### 1.4 Crear cliente de prueba

```typescript
// Ir a: /clients
// Click "Nuevo Cliente"
// Completar: Nombre, Teléfono
// Guardar
```

### 1.5 Obtener IDs necesarios

Ejecutar en Supabase (Dashboard > SQL Editor):

```sql
-- Tu organization_id (de la URL o cookies)
SELECT id, name FROM organizations LIMIT 1;

-- ID del empleado creado
SELECT id, name FROM employees WHERE name = '<nombre_empleado>';

-- ID del cliente creado
SELECT id, name, phone FROM clients WHERE name = '<nombre_cliente>';

-- ID de un servicio asignado al empleado
SELECT s.id, s.name 
FROM services s
JOIN employee_services es ON s.id = es.service_id
WHERE es.employee_id = '<id_empleado>';
```

---

## FASE 2: Crear la Cita (Desde Owner/Recepción)

### 2.1 Crear cita desde el calendario

1. Ir a: `/dashboard`
2. Hacer click en el **calendario** en un horario disponible
3. Formulario de nueva cita:
   - Cliente: `<cliente_prueba>`
   - Servicio: `<servicio_asignado>`
   - Empleado: `<empleado_prueba>`
   - Fecha/Hora: `<fecha futura>`
4. Click **Guardar**

### 2.2 Verificar en base de datos

```sql
SELECT 
  a.id,
  a.status,
  a.start_time,
  c.name as client_name,
  e.name as employee_name,
  s.name as service_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN employees e ON a.employee_id = e.id
JOIN appointment_services aps ON a.id = aps.appointment_id
JOIN services s ON aps.service_id = s.id
WHERE a.employee_id = '<id_empleado>'
  AND a.start_time::date = CURRENT_DATE
ORDER BY a.start_time DESC
LIMIT 5;
```

**Estado esperado:** `status = 'pending'`

---

## FASE 3: Login como Empleado y Confirmar Servicio

### 3.1 Login como empleado

1. Ir a: `/login`
2. Ingresar credenciales del empleado
3. Ser redirigido al dashboard del empleado

### 3.2 Ir a confirmaciones

1. Ir a: `/confirmations`
2. Debería aparecer la cita creada en **FASE 2**

### 3.3 Crear confirmación (EmployeeConfirmations.tsx)

1. Ver la lista de citas pendientes
2. Click en la cita del cliente
3. Seleccionar los **servicios realizados** (checkbox)
4. Ingresar **monto total** si es necesario
5. Click **Confirmar**

### 3.4 Verificar en base de datos

```sql
SELECT 
  id,
  appointment_id,
  employee_id,
  status,
  confirmation_type,
  employee_confirmed_at,
  total_amount
FROM appointment_confirmations
WHERE employee_id = '<id_empleado>'
ORDER BY employee_confirmed_at DESC
LIMIT 5;
```

**Estados esperados:**
- `status = 'pending_reception'`
- `confirmation_type = 'scheduled'`
- `employee_confirmed_at` no es null

---

## FASE 4: Login como Recepción y Confirmar Pago

### 4.1 Login como staff/recepción

1. Ir a: `/login`
2. Ingresar credenciales de staff/owner
3. Ir a: `/dashboard`

### 4.2 Ir a confirmaciones pendientes

1. Ir a: `/confirmations`
2. Click en la pestaña **"Recepción"** o **"Por Confirmar"**
3. Debería aparecer la confirmación creada en **FASE 3**

### 4.3 Confirmar recepción (confirmByReception)

1. Click en la confirmación pendiente
2. Seleccionar **método de pago**:
   - Efectivo
   - Tarjeta
   - Transferencia
3. Click **"Completar"** (action: `'complete'`)

### 4.4 Verificar en base de datos

```sql
-- Verificar confirmación
SELECT 
  id,
  appointment_id,
  status,
  payment_method,
  reception_confirmed_at
FROM appointment_confirmations
WHERE appointment_id = '<id_appointment>'
ORDER BY created_at DESC;

-- Verificar appointment
SELECT 
  id,
  status,
  updated_at
FROM appointments
WHERE id = '<id_appointment>';
```

**Estados esperados:**
- `appointment_confirmations.status = 'completed'`
- `appointments.status = 'completed'`
- `reception_confirmed_at` no es null

---

## FASE 5: Verificar Dashboard del Owner

### 5.1 Login como Owner

1. Ir a: `/login`
2. Ingresar credenciales del owner

### 5.2 Ir al dashboard

1. Ir a: `/dashboard`
2. **NOTA IMPORTANTE:** El dashboard **NO tiene real-time updates**
3. Los datos se actualizan solo cuando:
   - Recargas la página (F5)
   - Cambias el período (Today/Week/Month/Year)

### 5.3 Verificar datos en dashboard

**Widgets a verificar:**

| Widget | Esperado después de FASE 4 |
|--------|---------------------------|
| Citas | +1 cita completada |
| Ingresos | +monto del servicio |
| Finalizadas | +1 en completion rate |
| RecentActivity | Appointments completed |
| EmployeePerformance | Empleado con revenue |

### 5.4 Verificar datos en base de datos

```sql
-- Appointments completadas hoy
SELECT COUNT(*) as completed_today
FROM appointments
WHERE organization_id = '<org_id>'
  AND status = 'completed'
  AND updated_at::date = CURRENT_DATE;

-- Revenue de hoy
SELECT COALESCE(SUM(total_amount), 0) as revenue_today
FROM appointment_confirmations
WHERE status = 'completed'
  AND reception_confirmed_at::date = CURRENT_DATE;

-- Recent activity
SELECT 
  'appointment_completed' as type,
  a.id,
  c.name as client_name,
  e.name as employee_name,
  a.updated_at
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN employees e ON a.employee_id = e.id
WHERE a.status = 'completed'
  AND a.organization_id = '<org_id>'
ORDER BY a.updated_at DESC
LIMIT 5;
```

---

## ESCENARIOS ADICIONALES

### Escenario: Walk-in (Sin cita previa)

1. Cliente llega sin cita
2. Empleado va a: `/confirmations/walkin`
3. Completa el formulario:
   - Nombre cliente
   - Teléfono
   - Servicios realizados
4. Crea confirmación tipo `'walkin'`
5. Reception confirma en `/confirmations`

```sql
SELECT 
  id,
  confirmation_type,
  client_name,
  client_phone,
  status
FROM appointment_confirmations
WHERE confirmation_type = 'walkin'
ORDER BY created_at DESC;
```

### Escenario: Cliente No Asistió

1. Reception va a `/confirmations`
2. Selecciona la confirmación
3. Click **"No Asistió"** (action: `'no_show'`)

```sql
UPDATE appointment_confirmations
SET status = 'no_show'
WHERE id = '<confirmation_id>';

UPDATE appointments
SET status = 'no_show'
WHERE id = '<appointment_id>';
```

### Escenario: Servicio No Realizado

1. Reception va a `/confirmations`
2. Selecciona la confirmación
3. Click **"No Realizado"** (action: `'not_performed'`)

```sql
UPDATE appointment_confirmations
SET status = 'not_performed'
WHERE id = '<confirmation_id>';
```

---

## CHECKLIST DE VERIFICACIÓN

```text
[ ] Empleado puede ver sus citas asignadas
[ ] Empleado puede crear confirmación
[ ] Confirmación aparece en ReceptionConfirmations
[ ] Reception puede completar confirmación
[ ] Appointment status cambia a 'completed'
[ ] Dashboard actualiza al recargar/persistir
[ ] Widgets muestran datos correctos
[ ] RecentActivity muestra la actividad
[ ] EmployeePerformance actualiza revenue
```

---

## NOTAS TÉCNICAS

### Server Actions involucradas

| Acción | Archivo | Ubicación |
|--------|---------|-----------|
| Crear cita | `createAppointment.ts` | `src/actions/appointments/` |
| Confirmar por empleado | `createConfirmation.ts` | `src/actions/confirmations/` |
| Confirmar por recepción | `confirmByReception.ts` | `src/actions/confirmations/` |
| Obtener confirmaciones | `getConfirmations.ts` | `src/actions/confirmations/` |
| Dashboard stats | `getOverviewStats.ts` | `src/actions/analytics/` |

### Flujo de estados

```
appointments.status:
  pending → confirmed → completed
                     ↘ cancelled
                     ↘ no_show

appointment_confirmations.status:
  pending_employee → pending_reception → completed
                                     ↘ no_show
                                     ↘ not_performed
```

### Problema conocido: Sin Real-time en Dashboard

El dashboard (`/dashboard`) **no tiene polling ni real-time subscriptions**.

Para ver datos actualizados:
1. Recargar la página (F5)
2. Cambiar el período seleccionado

**Posibles mejoras para implementar:**
- Polling con `setInterval` cada 30s
- Supabase Realtime subscriptions
- `revalidatePath('/dashboard')` después de confirmaciones
