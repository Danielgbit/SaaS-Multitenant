# Plan: Cerrar Governance de Confirmations

## Documentos a modificar

| Documento | Cambios |
|-----------|---------|
| `docs/ARCHITECTURE_GOVERNANCE.md` | + Enforcement Philosophy, + Empty State Threshold, + excepción Anti-Pattern #6, + Example 6, + update version |
| `docs/ARCHITECTURE_SNAPSHOT.md` | + Phase 3.6C, + update modules/violations/debt con clasificación Deferred by Design vs Deferred Technical Debt, + soften language |

---

## ARCHITECTURE_GOVERNANCE.md

### 1. Nueva sección: Enforcement Philosophy
Insertar después de Principles, antes de Required Patterns:

```markdown
## Enforcement Philosophy

The goal of enforcement is not maximal abstraction.
The goal is:
- reduce visual duplication,
- preserve domain clarity,
- avoid architectural drift,
- and maintain operational stability.

Primitives replace repeated UI patterns, not domain-specific behavior.
```

### 2. Nueva sección: Empty State Threshold
Insertar después de Component Classification → Orchestrators, antes de Anti-Patterns:

```markdown
### Empty State Threshold

| Type | Migrate to `<EmptyState>` | Preserve as card-style |
|------|--------------------------|------------------------|
| Simple message + icon | ✅ Sí — listas vacías, búsquedas sin resultados | — |
| Operational/contextual | — | ❌ Sí — mensajes dinámicos por filtro, iconografía grande (w-20+), fondo con gradiente, layout tipo card |

**Rule of thumb:** If the empty state has dynamic text (changes per filter), large custom icon, or a distinct background container, preserve it. If it's a simple "No hay elementos" with a standard icon, migrate to `<EmptyState>`.
```

### 3. Anti-Pattern #6 — Agregar excepción
Agregar al final del bloque actual:

```markdown
**Exception:** Operational empty states with contextual messaging (dynamic text per filter, large custom layout) may be preserved. See "Empty State Threshold" above.
```

### 4. Strategic Code Examples — Agregar Example 6
Insertar después del ejemplo de Empty State, antes de Component Classification:

````markdown
### 6. Colors: Modal → useThemeColors

**Violación (before):**
```tsx
<div className="bg-white border-slate-200">
  <span className="text-slate-900">Cliente</span>
  <button className="bg-green-500 text-white">Confirmar</button>
</div>
```

**Cumplimiento (after):**
```tsx
const COLORS = useThemeColors()

<div style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
  <span style={{ color: COLORS.textPrimary }}>Cliente</span>
  <button style={{ backgroundColor: COLORS.success, color: '#FFFFFF' }}>Confirmar</button>
</div>
```
````

### 5. Update version metadata
```
**Version:** 1.1
**Last Updated:** May 2026
```

---

## ARCHITECTURE_SNAPSHOT.md

### 1. Agregar Phase 3.6C
Insertar después de Phase 3.6B:

```markdown
#### Phase 3.6C — Confirmations Enforcement Execution

Conservative compliance pass on Confirmations module:
- **ConfirmationsPanel.tsx:** Spinner → `<Skeleton variant="rectangular">` ×3, empty → `<EmptyState>`
- **NotificationCenter.tsx:** Removed local `SkeletonItem` → `<Skeleton>`, local `EmptyState` → `<EmptyState>`, added `useThemeColors()`
- **WalkinForm.tsx:** Empty state → `<EmptyState>`, duration badge → `<Badge>`
- **EmployeeConfirmations.tsx:** Decorative hover handlers → Tailwind `hover:shadow-lg hover:-translate-y-0.5`, type badge → `<Badge>`
- **ReceptionConfirmations.tsx:** Walk-in/Programada badge → `<Badge>`, status badge (Por cobrar/Pagado/No asistió/No realizado) → `<Badge>`
- **MarkCompletedModal.tsx:** 20+ hardcoded Tailwind colors → `useThemeColors()` tokens
- **AdjustPriceModal.tsx:** 15+ hardcoded Tailwind colors → `useThemeColors()` tokens

**Deferred by Design (domain-sensitive — NOT migrated):**
- `getTimeUrgency()` in ReceptionConfirmations — dynamic state-based urgency
- `onMouseEnter`/`onMouseLeave` with `!isSuccess` guard in ReceptionConfirmations — conditional operational hover
- Large card-style empty states in EmployeeConfirmations and ReceptionConfirmations — contextual messaging per filter, visual quality > primitive consistency
- Public `confirmar` page — out of scope
```

### 2. Soften language en "Consistency Improvements"

Cambiar:
```markdown
- **100%** of analytics components using official primitives
- **100%** of WhatsApp components using official primitives
- **100%** of Confirmations components using official primitives where applicable
```

A:
```markdown
- **All applicable** repeated UI patterns migrated to official primitives in Analytics
- **All applicable** repeated UI patterns migrated to official primitives in WhatsApp
- **All applicable** repeated UI patterns migrated to official primitives in Confirmations
```

### 3. Violations Eliminated — agregar items

```markdown
### Local EmptyState Functions in NotificationCenter
- **Before:** `SkeletonItem` component and `EmptyState` function defined locally
- **After:** Removed local implementations, imported from `@/components/ui/`

### Decorative Hover Handlers in EmployeeConfirmations
- **Before:** Custom `onMouseEnter`/`onMouseLeave` handlers changing box-shadow and transform
- **After:** Tailwind `hover:shadow-lg hover:-translate-y-0.5` with `transition-all duration-200`
```

### 4. Restructurar sección "Deferred Technical Debt"

Reemplazar la sección actual con dos subsecciones:

#### A. Deferred Technical Debt (deuda real, requiere fix futuro)

```markdown
## Deferred Technical Debt

Items that are actual technical debt — they should be fixed but were out of scope for this cycle.

### NotificationCenter Hardcoded Tailwind Colors
NotificationItem component uses `bg-slate-50`, `text-slate-500`, and other Tailwind color classes. Filter tabs use `text-slate-500`, `bg-[#0F4C5C]`. These require a full color migration pass.

**File:** NotificationCenter.tsx

### needs_review Visual State in Dark Mode (ConfirmationsPanel)
Uses hardcoded hex colors (`#FEF3C7`, `#D97706`). Works in light mode but may lack contrast in dark mode. Should use `COLORS.warning`/`COLORS.warningLight` with `isDark` fallback.

**File:** ConfirmationsPanel.tsx (lines 52-54)

### Pre-existing items (previos cycles)
- Dynamic color computations (`COLORS.primary + '30'`)
- Modal backdrop blur in TemplateEditorModal and AutomationEditModal
- WhatsAppModuleClient header raw div
- Typography tokens (no centralized scale)
```

#### B. Deferred by Design (exclusiones conscientes — NO deben migrarse)

```markdown
## Deferred by Design

Items intentionally preserved because migrating them would degrade domain clarity, UX quality, or operational behavior. These are NOT technical debt — they are conscious architectural decisions.

### Conditional Hover Logic
Some hover states serve functional purposes (showing tooltip triggers, drag handles) or contain guards (`!isSuccess`). These were preserved because the hover is not decorative — it's conditional on domain state.

**Files:** ReceptionConfirmations.tsx, TabQueue.tsx, TabAutomations.tsx, TabTemplates.tsx

### Operational Empty States
Large card-style empty states in EmployeeConfirmations and ReceptionConfirmations. These have contextual messaging that changes per filter filter, distinct background containers, and large custom icons. Migrating to `<EmptyState>` would reduce visual quality and lose domain-specific messaging.

**Files:** EmployeeConfirmations.tsx, ReceptionConfirmations.tsx

### Urgency Badge Systems
`getTimeUrgency()` in ReceptionConfirmations and `getUrgencyLevel()` in NotificationCenter compute dynamic colors based on time thresholds. These are domain-specific visual systems, not static badges.

**Files:** ReceptionConfirmations.tsx, NotificationCenter.tsx

### needs_review Visual State (ConfirmationsPanel)
The amber/gold `needs_review` styling in ConfirmationCard is a domain-specific alert state. While the dark mode contrast issue is debt (see above), the pattern itself (distinct amber card for delayed confirmations) is an intentional design decision.
```

### 5. Modules Status — agregar fila Confirmations

```markdown
| Confirmations | ✅ Complete | ✅ | ✅ | ✅ | ✅ | Conservative: markers, badges, hover, modals; 5 domain items deferred by design |
```

### 6. Preserved Domain Components — agregar subsección

Después de la tabla de componentes preservados:

```markdown
### Confirmations-Specific Preserved Patterns

| File | Preserved Pattern | Classification |
|------|------------------|----------------|
| ReceptionConfirmations | `getTimeUrgency()` — dynamic urgency coloring | Deferred by Design |
| ReceptionConfirmations | `onMouseEnter` guard with `!isSuccess` | Deferred by Design |
| ReceptionConfirmations | Card-style empty state (3 filter messages) | Deferred by Design |
| EmployeeConfirmations | Card-style empty state ("Todo al día") | Deferred by Design |
| NotificationCenter | `TYPE_CONFIG`, `getUrgencyLevel()` | Deferred by Design |
```

### 7. Update metadata
```
**Document Version:** 1.1
**Last Updated:** May 2026
**Status:** Updated
```

---

## ARCHITECTURE-CONFIRMATIONS.md

**Sin cambios.** Describe la arquitectura del sistema (DB, Server Actions, realtime, cron), no el enforcement de UI.

---

## Resumen de cambios por ajuste del usuario

| Ajuste | Dónde se aplica |
|--------|----------------|
| 1. Enforcement Philosophy | ARCHITECTURE_GOVERNANCE.md — nueva sección |
| 2. Soften "100%" language | ARCHITECTURE_SNAPSHOT.md — Consistency Improvements |
| 3. Deferred by Design vs Deferred Technical Debt | ARCHITECTURE_SNAPSHOT.md — split en 2 subsecciones + Phase 3.6C classification |
