# Payroll — Nómina

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/actions/payroll/`, `supabase/migrations/20260503*`
> Last updated: 2026-05-27

---

## 1. Visión General

Sistema de nómina para empleados del sector wellness/health con comisiones por servicio, deducciones y recibos. Opera con un modelo **fire-and-forget**: la agregación a payroll nunca bloquea el flujo de confirmación de citas.

### Responsabilidades

- Calcular comisiones por servicio realizado
- Gestionar préstamos y deducciones a empleados
- Generar recibos de nómina por período
- Soportar modalidades: fijo, porcentaje, mixto

---

## 2. Modelo Dual V1 → V2

El payroll está en migración activa de V1 (payroll_receipts) a V2 (payroll_periods + payroll_items).

| Aspecto | V1 (Legacy) | V2 (Activo) |
|---------|-------------|-------------|
| Períodos | Ad-hoc por receipt | Formales (YYYY-MM), por org |
| Estados | draft → pending → paid | draft → approved → paid |
| Empleados | Un receipt por empleado | Un item por empleado por período |
| Comisiones | Detalle en receipt | `period_commissions` con FK a appointment+service |
| Deducciones | `payroll_receipt_loans` | `payroll_item_loans` |
| Config nacional | — | `payroll_config` (SMMLV, tasas salud/pensión) |
| Subsidio transporte | — | `payroll_items.has_transport_subsidy` |

Ambos modelos **coexisten**. La lógica de negocio debe decidir cuál usar. El target es migrar completamente a V2.

---

## 3. Entidades

### V2 (Activo)

| Tabla | Propósito |
|-------|-----------|
| `payroll_config` | Config nacional por año (SMMLV, subsidio transporte, tasas salud/pensión). Una fila por año. |
| `payroll_periods` | Período formal. `period` = YYYY-MM. Status: draft → approved → paid. Totales agregados por período. |
| `payroll_items` | Por empleado por período. `contract_type`, `payment_type`, gross/net, deducciones, subsidio. |
| `period_commissions` | Detalle por servicio: `appointment_id`, `service_id`, `commission_rate`, `commission_amount`. |
| `payroll_item_loans` | Deducciones de préstamos en el período. |
| `employee_loans` | Préstamos activos a empleados. Status: pending → partial → paid → frozen. |

### V1 (Legacy)

| Tabla | Propósito |
|-------|-----------|
| `payroll_receipts` | Recibo individual. Status: draft → pending → paid. |
| `payroll_receipt_services` | Servicios incluidos en el recibo. |
| `payroll_receipt_loans` | Préstamos deducidos. |

---

## 4. Cálculo de Comisiones

El cálculo depende del `payment_type` del empleado:

| Tipo | Cálculo |
|------|---------|
| `porcentaje` | `service_price × (percentage / 100)` |
| `fijo` | `base_salary / período` (sin comisiones) |
| `mixed` | `base_salary / período + (service_price × percentage / 100)` |

El `percentage` (antes `default_commission_rate`) se define por empleado. Puede tener override por servicio vía `employee_services.commission_rate`.

---

## 5. Fire-and-Forget Aggregation

La agregación a payroll ocurre desde el flujo de confirmaciones **sin bloquearlo**:

```
confirmService / confirmByReception
  │
  ├── 1. Marca cita como confirmed
  ├── 2. Inserta confirmation_logs
  ├── 3. addAppointmentToPayroll(appointmentId)  ← fire-and-forget
  │        │
  │        └── dynamic import → upsert en period_commissions
  │            Si falla → console.warn, no retry automático
  └── 4. Revalida cache
```

Esto significa:
- Una cita confirmada **siempre queda registrada como pagada** aunque payroll falle
- Si `addAppointmentToPayroll` falla, el ingreso no aparece en nómina pero la cita está correctamente cobrada
- **No hay retry automático** — el fallo es silencioso (solo `console.warn`)

### Failure Tolerance

| Escenario | Impacto | Recuperación |
|-----------|---------|--------------|
| Payroll falla, cita confirmada | Ingreso no aparece en nómina | Recalcular manualmente desde citas confirmadas del período |
| Payroll falla, cita no confirmada | Sin impacto | Reintentar al confirmar |
| Payroll upsert duplicado | Sin impacto (idempotente) | — |

**No hay dead-letter queue ni replay para payroll.** Es una limitación conocida que la nueva arquitectura event-driven (ver `docs/architecture/FUTURE/`) resolvería con `payroll.generation_requested` events.

---

## 6. Modalidades de Contrato

| Modalidad | `payment_type` | `contract_type` | Descripción |
|-----------|----------------|-----------------|-------------|
| Comisión pura | `porcentaje` | `prestacion` | Solo comisión por servicios |
| Salario fijo | `fijo` | `laboral` | Sueldo base sin comisiones |
| Mixto | `mixed` | `laboral` | Sueldo base + comisión |
| Medio tiempo | `porcentaje` o `mixed` | `laboral` con `employment_type=part_time` | `part_time_percentage` ajusta el proporcional |

### Deducciones Legales (V2)

Para empleados con `contract_type = 'laboral'`:
- **Salud**: 4% del gross
- **Pensión**: 4% del gross
- **Subsidio transporte**: Si aplica según configuración nacional

---

## 7. Server Actions

| Action | Propósito | Permisos |
|--------|-----------|----------|
| `addAppointmentToPayroll` | Agrega cita confirmada al período (fire-and-forget) | Sistema (llamado desde confirmService) |
| `managePayrollPeriod` | Crear/abrir/cerrar períodos | owner, admin |
| `generatePayrollReceipt` | Generar recibo de nómina (V1 legacy) | owner, admin |
| `getPayrollSummary` | Resumen de nómina del período | owner, admin, staff |
| `getMyPayroll` | Vista del empleado (solo su nómina) | employee |

---

## 8. Roles y Permisos

| Acción | Owner | Admin | Staff | Employee |
|--------|-------|-------|-------|----------|
| Ver payroll general | ✅ | ✅ | ❌ | ❌ |
| Ver payroll propio | — | — | — | ✅ |
| Gestionar períodos | ✅ | ✅ | ❌ | ❌ |
| Gestionar préstamos | ✅ | ✅ | ❌ | ❌ |
| Exportar recibos | ✅ | ✅ | ❌ | ❌ |

---

## 9. Migración V1 → V2

| Paso | Estado | Descripción |
|------|--------|-------------|
| Crear tablas V2 | ✅ | `payroll_periods`, `payroll_items`, `period_commissions`, etc. |
| Migrar columnas employees | ✅ | `payment_type` normalizado, `contract_type`, `employment_type` |
| Agregar payroll_config | ✅ | SMMLV, tasas, subsidio |
| Migrar datos V1→V2 | 📅 Pendiente | Mover receipts activos a periods |
| Deprecar V1 | 📅 Pendiente | Remove `payroll_receipts` y relacionadas |
| Dead-letter + replay | 📅 Pendiente | Para la nueva arquitectura event-driven |

---

## 10. Variables de Entorno

No requiere variables específicas. Usa configuración en DB (`payroll_config`, `organization_payroll_settings`).
