# Fase 0 — Audit Visual de Componentes Sensibles a Cambio Tipográfico

> Proyecto: Prügressy SaaS
> Migración: Plus Jakarta Sans → Manrope (body) | Cormorant Garamond → Poppins (headings)
> Fecha: 2026-05-23

---

## Resumen de Hallazgos

| Categoría | Ocurrencias | Riesgo |
|-----------|-------------|--------|
| `whitespace-nowrap` | 18 | **CRÍTICO** |
| `truncate` | 49 | **ALTO** |
| `overflow-hidden` en contenedores | ~60 | **ALTO** |
| `min-w-[Npx]` | 5 | **ALTO** |
| `text-[9/10/11px]` arbitrarios | 55 | MEDIO |
| `leading-none` + texto | 9 | MEDIO |
| `leading-tight` | 6 | MEDIO |
| `fontFamily` inline | 445 | **ESTRUCTURAL** |
| KPI cards `text-3xl font-bold` | 15 | ALTO |
| Tablas con `min-w-[700px]` | 2 | ALTO |

---

## 1. CRÍTICO: whitespace-nowrap + overflow-hidden

Poppins es más ancho que Plus Jakarta Sans → estos componentes pueden romperse.

### Sidebar (CollapsibleSidebar.tsx)
- `:104` — nombre organización: `font-display text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden truncate`
- `:111` — brand name: `font-display text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden`
- `:193` — nav items: `whitespace-nowrap overflow-hidden flex items-center gap-2`
- `:218` — tooltips: `whitespace-nowrap bg-slate-900/95`

### Tablas
- `WhatsAppLogs.tsx:207` — `table min-w-[700px] whitespace-nowrap` → headers pueden explotar
- `EmailLogs.tsx:199` — `table min-w-[700px] whitespace-nowrap` → headers pueden explotar

### Sidebar collapsed (tooltips)
- `:218` — tooltip con whitespace-nowrap + contenido dinámico

---

## 2. ALTO: truncate en contenedores con width fijo

### Sidebar
- `:100` — organización email truncado
- `:104` — nombre organización truncado + overflow-hidden
- `:263` — rol truncado

### Tablas de logs
- `EmailLogs.tsx:271` — `max-w-xs truncate`
- `DeadLetterTable.tsx:116` — `max-w-xs truncate`
- `MessageReplayButton.tsx:86` — `max-w-[200px] truncate`

### Clientes
- `ClientAccountsClient.tsx:724` — nombre cliente `truncate`
- `ClientAccountsClient.tsx:746` — teléfono `truncate max-w-[120px]`
- `ClientAccountsClient.tsx:752` — email `truncate max-w-[150px]`

### Notificaciones
- `NotificationCenter.tsx:162` — título notificación truncado
- `RawWebhookViewer.tsx:127` — título truncado
- `TabOverview.tsx:371` — item truncado

### Cards calendario
- `AppointmentCard.tsx:50,76,81` — título y descripción truncados
- `AppointmentClusterCard.tsx:92,104,169,186,193` — múltiples truncates
- `AppointmentCardV2.tsx:90,99` — título truncado

### Wizard
- `NewAppointmentWizard.tsx:429,614,653,736,764,1163,1179,1197,1213` — nombres de servicios, empleados, clientes truncados

---

## 3. ALTO: overflow-hidden en modales y contenedores

### Modales críticos
- `PaymentModal.tsx:198` — `overflow-hidden` + `max-w-lg`
- `EditAppointmentModal.tsx:69` — `overflow-hidden max-w-md`
- `AppointmentDetailModal.tsx:43` — `overflow-hidden max-w-md`
- `ConfirmActionModal.tsx:40` — `overflow-hidden max-w-sm`
- `MarkCompletedModal.tsx:95` — `overflow-hidden max-w-md`
- `AdjustPriceModal.tsx:94` — `overflow-hidden max-w-sm`
- `InvitationLinkModal.tsx` — `truncate`
- `PurgeModal.tsx` — `overflow-hidden`

### Contenedores dashboard
- `DashboardShell.tsx:96` — `overflow-hidden relative`
- `CalendarView.tsx:337,339,633` — `overflow-hidden`
- `PeriodDetailView.tsx:384,544,739` — `overflow-hidden`
- `PayrollDashboard.tsx:49` — `overflow-hidden`

---

## 4. ALTO: widths rígidos

- `min-w-[700px]` — WhatsAppLogs.tsx, EmailLogs.tsx (tablas enteras)
- `min-w-[120px]` — PeriodDetailView.tsx (celda de total)
- `min-w-[18px]` — NotificationCenter.tsx (badge)
- `max-w-[140px]` — EventTimeline.tsx
- `max-w-[200px]` — MessageReplayButton.tsx
- `max-w-[120px]` — ClientAccountsClient.tsx (teléfono)
- `max-w-[150px]` — ClientAccountsClient.tsx (email)

---

## 5. MEDIO: line-height colapsado

### `leading-none` (9 ocurrencias)
- `CollapsibleSidebar.tsx:90` — brand icon "P"
- `NewAppointmentWizard.tsx:927,931,966,972,1033,1037,1072,1078` — slots de tiempo

### `leading-tight` (6 ocurrencias)
- `PaymentModal.tsx:292,295` — método de pago
- `WeekGrid.tsx:72,76` — títulos de día
- `CurrentPeriodCard.tsx:130,136` — texto de período

---

## 6. ESTRUCTURAL: 445 inline fontFamily

Distribución aproximada:
- `'Cormorant Garamond', serif` → ~150 ocurrencias (headings/títulos)
- `'Plus Jakarta Sans', sans-serif` → ~290 ocurrencias (body/UI)
- `var(--font-cormorant-garamond)` → ~5 ocurrencias (payroll)
- `var(--font-display)` → ~3 ocurrencias (admin)

Archivos con más ocurrencias:
1. `SettingsClient.tsx` — ~30
2. `InventoryFormModal.tsx` — ~15
3. `CollapsibleSidebar.tsx` — ~8
4. `PaymentModal.tsx` — ~8
5. `AppointmentDetailModal.tsx` — ~8
6. `NewAppointmentWizard.tsx` — ~8
7. `DeleteInventoryModal.tsx` — ~8
8. `BookingWizard.tsx` — ~8
9. `CreateServiceModal.tsx` — ~6
10. `EditServiceModal.tsx` — ~6

---

## 7. MEDIO: KPI cards con text-3xl font-bold + Poppins

Poppins 700 ocupa ~10-15% más ancho que Cormorant Garamond → riesgo en cards rígidas.

- `PayrollDashboard.tsx:64` — `text-3xl font-bold`
- `PeriodDetailView.tsx:399` — `text-3xl font-bold`
- `DashboardClient.tsx:51,135` — `text-3xl font-bold`
- `ClientAccountsClient.tsx:260` — `text-3xl font-bold`
- `ClientAccountDetailClient.tsx:216` — `text-3xl font-bold`
- `PayrollClient.tsx:233` — `text-3xl font-bold`
- `BillingClient.tsx:420` — `text-3xl font-bold`
- `QueueHealthCards.tsx:123` — `text-4xl font-bold font-mono`
- `DebtsOverview.tsx:83` — `text-3xl font-bold`

---

## 8. MEDIO: text-[9/10/11px] arbitrarios (55 ocurrencias)

Top archivos:
- `NewAppointmentWizard.tsx` — ~10
- `CollapsibleSidebar.tsx` — ~4
- `MobileNav.tsx` — ~4
- `EventTimeline.tsx` — ~4
- `AppointmentClusterCard.tsx` — ~7
- `ConfirmBanner.tsx` — ~4
- `ClientAccountsClient.tsx` — ~3
- `PurgeModal.tsx` — ~3
- `CurrentPeriodCard.tsx` — ~2

---

## Prioridad de Migración

| Orden | Componente | Razón |
|-------|-----------|-------|
| 1 | CollapsibleSidebar | whitespace-nowrap + overflow crítico |
| 2 | MetricCard | KPI numbers con Poppins 700 |
| 3 | EmailLogs / WhatsAppLogs | Tablas min-width + whitespace-nowrap |
| 4 | PaymentModal | overflow-hidden modal + inline fonts |
| 5 | AppointmentDetailModal | overflow-hidden modal + inline fonts |
| 6 | SettingsClient | Mayor cantidad de inline fonts |
| 7 | NewAppointmentWizard | Múltiples truncates + inline fonts |
| 8 | AppointmentClusterCard | Múltiples truncates + text-[10px] |
