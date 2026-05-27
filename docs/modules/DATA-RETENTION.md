# Data Retention — Purga de Citas Antiguas

> STATUS: CURRENT IMPLEMENTATION
> Source of truth: `src/actions/appointments/purgeAppointments.ts`, `src/lib/cleanup-helpers.ts`, `src/app/api/cron/purge-appointments/route.ts`
> Last updated: 2026-05-27

---

## 1. Visión General

Sistema de purga automática y manual de citas antiguas. Previene acumulación de datos históricos en la tabla `appointments` sin perder información financiera.

### Responsabilidades

- Purga automática diaria configurable por organización
- Purga manual con dry-run y confirmación explícita
- Protección de citas facturadas (con `invoice_id`)
- Configuración desde UI en `/settings/data-retention`

### Non-Goals

- **No es archival storage** — Los datos se eliminan, no se mueven a storage frío
- **No tiene legal hold** — No hay mecanismo para preservar datos por requerimiento legal
- **No garantiza retención inmutable** — La configuración es por org y cambiable en cualquier momento
- **No aplica a tablas append-only** — `financial_events` y `client_account_transactions` nunca se purgan

---

## 2. Configuración

Por organización, almacenada en `booking_settings`:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `auto_purge_enabled` | BOOLEAN | false | Habilita purga automática diaria |
| `auto_retention_days` | INTEGER | 90 | Días a mantener citas después de `end_time` |

### UI

`/settings/data-retention` → Tab "Retención":
- Toggle para habilitar purga automática
- Selector de días: 30 / 60 / 90
- Botón "Limpiar ahora" con modal de confirmación dry-run

---

## 3. Purga Automática (Cron Diario)

**Endpoint:** `POST /api/cron/purge-appointments`
**Schedule:** Una vez al día (recomendado 2-3 AM) via cron-job.org

### Lógica

```
1. Para cada organización con auto_purge_enabled = true:
2.   Calcular fecha límite = hoy - auto_retention_days
3.   DELETE FROM appointments WHERE
       organization_id = :org
       AND end_time < :fecha_limite
       AND status IN ('completed', 'cancelled', 'no_show')
       AND invoice_id IS NULL          ← protección
4.   Log resultado
```

### Protecciones

- **`invoice_id IS NOT NULL`**: Citas facturadas no se eliminan
- **Solo citas terminales**: `completed`, `cancelled`, `no_show` — nunca `pending` o `confirmed`
- **Dry-run en purga manual**: Muestra cuántas citas se eliminarían antes de confirmar

---

## 4. Purga Manual

Desde `/settings/data-retention`:

1. Click "Limpiar ahora"
2. Modal muestra dry-run: "Se eliminarán X citas"
3. Usuario escribe "ELIMINAR" para confirmar
4. Delete ejecutado con las mismas protecciones que la purga automática

---

## 5. Server Actions

| Action | Propósito | Permisos |
|--------|-----------|----------|
| `purgeAppointments` | Ejecuta purga (manual o dry-run) | owner, admin |
| `updateRetention` | Actualiza `auto_retention_days` y `auto_purge_enabled` | owner, admin |
| `getRetention` | Obtiene configuración actual | owner, admin |

---

## 6. Base de Datos

Columnas en `booking_settings`:

```sql
auto_purge_enabled BOOLEAN DEFAULT false,
auto_retention_days INTEGER DEFAULT 90,
invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL  -- en appointments
```

---

## 7. Migración Relacionada

`20260427000000_data_retention_settings.sql` — Agrega columnas a `booking_settings` e `invoice_id` a `appointments`.
