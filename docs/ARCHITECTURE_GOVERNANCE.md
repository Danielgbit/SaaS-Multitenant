# Architecture Governance

## Purpose

This document establishes the rules and patterns that govern frontend development. It is a working reference for maintaining architectural consistency across the project.

---

## Principles

### 1. Primitive-First
When building UI, reach for official primitives before custom implementations. The primitives in `src/components/ui/` exist to solve recurring patterns. Use them.

### 2. Domain Preservation
Complex business logic, user interactions, and domain-specific behavior are not subject to primitive enforcement. The goal is consistency in presentation, not elimination of domain complexity.

### 3. Theme-Only Colors
Every color value in every component must come from the `useThemeColors()` hook. No hardcoded hex values, no Tailwind arbitrary colors for theme-dependent properties.

### 4. Explicit Over Implicit
If a pattern is not documented here, default to explicit, verbose implementation over clever abstraction.

---

## Policy Layer

The frontend governance is organized into five distinct layers. Each layer has a specific purpose, scope, and audience.

| Layer | Document | Purpose | Scope |
|-------|----------|---------|-------|
| **1. Architecture Snapshot** | `docs/ARCHITECTURE_SNAPSHOT.md` | Historical evolution, completed phases, module status, architectural rationale | Whole project (historical) |
| **2. Governance Policy** | `docs/ARCHITECTURE_GOVERNANCE.md` | Principles, allowed/forbidden patterns, enforcement philosophy | Whole project (normative) |
| **3. OVS Registry** | `docs/OPERATIONAL_VISUAL_SYSTEMS.md` | Catalog of intentionally preserved operational visual systems | Whole project (exceptions) |
| **4. Drift Detection** | `scripts/architecture-guard.ts` | Automated scanning, classification, and reporting | Codebase (operational) |
| **5. Module Audits** | `docs/CALENDAR_AUDIT.md` (per module) | Targeted deep-dive investigations of specific modules | Per module (investigative) |

These layers are independent but interrelated: the Governance Policy defines what is correct, the OVS Registry documents what is intentionally exceptional, Drift Detection measures compliance, Module Audits investigate deep patterns, and the Snapshot records how the system evolved.

---

## Enforcement Philosophy

The goal of enforcement is not maximal abstraction.
The goal is:
- reduce visual duplication,
- preserve domain clarity,
- avoid architectural drift,
- and maintain operational stability.

Primitives should replace repeated UI patterns, not domain-specific behavior.

---

## Required Patterns

All dashboard components MUST follow these patterns:

| Pattern | Requirement |
|---------|-------------|
| Color source | All colors from `useThemeColors()` hook |
| Loading states (structural) | `Skeleton` component from `@/components/ui/` |
| Loading states (action) | `Spinner` component from `@/components/ui/` |
| Empty states | `EmptyState` component from `@/components/ui/` |
| Status badges | `Badge` component from `@/components/ui/` |
| Card containers | `Card` component from `@/components/ui/` |
| Hover effects | Tailwind `hover:` classes only (no onMouseEnter/onMouseLeave for decoration) |
| Animation | Use Tailwind `animate-*` classes only |

---

## Allowed Patterns

These patterns are intentionally permitted despite not using UI primitives or theme tokens directly. They are domain-justified exceptions.

### Operational Visual Systems (OVS)

Systems registered in the OVS Registry (`docs/OPERATIONAL_VISUAL_SYSTEMS.md`) are explicitly allowed. These include:

- **Workload semaphores** — business-level indicators (low/normal/busy/overloaded)
- **Employee differentiation palettes** — per-employee color assignment in multi-entity views
- **Status color mappings** — domain state to color (appointment status, delivery status)
- **Dynamic gradient systems** — data-derived visual blends (cluster occupancy, heatmaps)
- **Temporal urgency indicators** — animated alerts gated on business thresholds
- **Layout-specific placeholders** — spatial empty states that must fit a specific grid

**Rule:** A pattern is only Allowed if it has an entry in the OVS Registry. No registry entry = violation.

### Canonical Primitives (CPS)

Canonical UI primitives that replace ad-hoc implementations project-wide.
Unlike OVS, CPS entries represent standard UI contracts, not domain semantics.

| ID | Component | File | Status |
|----|-----------|------|--------|
| CPS-001 | Spinner | Spinner.tsx | 🟢 Canonical |

**Rule:** CPS components must be used instead of manual re-implementations.
Using a CPS component satisfies the corresponding Forbidden Pattern (e.g., using
`<Spinner>` satisfies F4 for action loading). Manual re-implementations of CPS
patterns are violations.

### Structural Skeletons

Skeletons that mirror a complex layout (e.g., calendar 7-column grid, multi-card dashboards) are allowed to remain as scaffolded divs rather than generic `<Skeleton>` components, provided:

1. The skeleton mirrors the actual layout structure (columns, card count)
2. It uses `animate-pulse` from Tailwind (no custom animation)
3. It is documented as `DEFERRED_BY_DESIGN` in architecture-guard output

### Temporal Interaction Visuals

Animations that convey operational state changes (pulse on overloaded, fade on status transition) are allowed outside the `hover:`-only rule if:

1. The trigger is business logic, not decorative hover
2. The animation uses Tailwind `animate-*` classes
3. The file is listed in the OVS Registry

---

## Forbidden Patterns

### 1. Badge: Local Object → Badge Component

**Violación (before):**
```tsx
// Local badge object
const statusBadge = { variant: 'success', label: 'Activo' }

// Inline styled span
<span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
  Activo
</span>
```

**Cumplimiento (after):**
```tsx
import { Badge } from '@/components/ui'

<Badge variant="success">Activo</Badge>
```

---

### 2. Loading: Spinner → Skeleton

**Violación (before):**
```tsx
// Custom spinner
<div className="flex justify-center p-4">
  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
</div>

// Table with spinner
{loading && (
  <tr>
    <td colSpan={4} className="text-center py-8">
      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
    </td>
  </tr>
)}
```

**Cumplimiento (after):**
```tsx
import { Skeleton } from '@/components/ui'

// For lists/tables
{isLoading && (
  <>
    <Skeleton variant="rectangular" className="h-12 w-full" />
    <Skeleton variant="text" className="h-4 w-3/4" />
    <Skeleton variant="text" className="h-4 w-1/2" />
  </>
)}
```

---

### 3. Hover: Decorative Handler → Tailwind Class

**Violación (before):**
```tsx
<button
  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
>
  Enviar
</button>

<div
  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.surfaceSubtle }}
  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLORS.surface }}
/>
```

**Cumplimiento (after):**
```tsx
// Use Tailwind hover utilities
<button className="transition-opacity hover:opacity-85">
  Enviar
</button>

// If functional hover is needed (e.g., checkbox visibility), separate state
<div
  className="transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
  onMouseEnter={() => setShowCheckbox(true)}
>
  Content
</div>
```

---

### 4. Colors: Hardcoded → Theme Hook

**Violación (before):**
```tsx
<div style={{ backgroundColor: '#FFFFFF' }}>
  <span style={{ color: '#0F172A' }}>Texto</span>
  <button className="bg-sky-500 hover:bg-sky-600">Botón</button>
</div>
```

**Cumplimiento (after):**
```tsx
import { useThemeColors } from '@/hooks/useThemeColors'

export function MyComponent() {
  const COLORS = useThemeColors()

  return (
    <div style={{ backgroundColor: COLORS.surface }}>
      <span style={{ color: COLORS.textPrimary }}>Texto</span>
      <button
        className="transition-colors"
        style={{ backgroundColor: COLORS.primary }}
      >
        Botón
      </button>
    </div>
  )
}
```

---

### 5. Empty State: Hardcoded → EmptyState Component

**Violación (before):**
```tsx
{items.length === 0 && (
  <div className="text-center py-12">
    <p className="text-slate-500">No hay elementos</p>
  </div>
)}
```

**Cumplimiento (after):**
```tsx
import { EmptyState } from '@/components/ui'
import { Package } from 'lucide-react'

{items.length === 0 && (
  <EmptyState
    icon={Package}
    title="No hay elementos"
    description="Comienza agregando tu primer elemento"
  />
)}
```

---

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

---

## Component Classification

### UI Primitives
Canonical components in `src/components/ui/`. These are the enforced standard.

| Component | File | Purpose |
|-----------|------|---------|
| Card | Card.tsx | Container |
| MetricCard | MetricCard.tsx | KPI display |
| Skeleton | Skeleton.tsx | Loading placeholder (structural) |
| Spinner | Spinner.tsx | Loading indicator (action in progress) |
| EmptyState | EmptyState.tsx | Empty list state |
| Badge | Badge.tsx | Status indicator |
| ConfirmModal | ConfirmModal.tsx | Destructive confirmation |

### Domain Primitives
Domain-specific presentational components that follow the same rules but are not primitives because they contain domain logic.

| Component | Location | Purpose |
|-----------|----------|---------|
| AppointmentCardV2 | dashboard/calendar | Appointment display |
| ClientCard | dashboard/clients | Client information |
| InventoryCard | dashboard/inventory | Inventory item display |
| StatusBadge (WhatsApp) | dashboard/whatsapp | WhatsApp status badge |

### Orchestrators
Large components that coordinate multiple sub-components and manage state. These are preserved as-is but their sub-components must follow rules.

| Component | Location | Purpose |
|-----------|----------|---------|
| WhatsAppModuleClient | dashboard/whatsapp | Tab orchestration |
| CalendarView | dashboard | Calendar management |
| DashboardShell | dashboard | Layout wrapper |
| ConfirmationsPanel | dashboard | Confirmation queue |

---

### Empty State Threshold

| Type | Migrate to `<EmptyState>` | Preserve as card-style |
|------|--------------------------|------------------------|
| Simple message + icon | ✅ Sí — listas vacías, búsquedas sin resultados | — |
| Operational/contextual | — | ❌ Sí — mensajes dinámicos por filtro, iconografía grande (w-20+), fondo con gradiente, layout tipo card |

**Rule of thumb:** If the empty state has dynamic text (changes per filter), large custom icon, or a distinct background container, preserve it. If it's a simple "No hay elementos" with a standard icon, migrate to `<EmptyState>`.

---

## Forbidden Patterns

The following patterns are prohibited project-wide. Exceptions must be registered in the OVS Registry or documented as `DEFERRED_BY_DESIGN`.

### F1. Local Badge Implementations
```tsx
// PROHIBITED
const badge = { variant: 'success', text: 'Active' }
<span className="custom-badge">{badge.text}</span>
```

### F2. Inline Color Values
```tsx
// PROHIBITED
<div style={{ backgroundColor: '#FFFFFF' }} />
<span style={{ color: '#64748B' }} />
```

### F3. Decorative Hover Handlers
```tsx
// PROHIBITED — only changes appearance
onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '...'}
onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '...'}
```

### F4. Custom Loading Indicators
```tsx
// PROHIBITED — use Skeleton (structural) or Spinner (action)
<Loader2 className="w-6 h-6 animate-spin" />
<div className="animate-pulse">Loading...</div>
```

**Rule of thumb:**
- `Skeleton` for content structure loading (cards, lists, tables, dashboard placeholders)
- `Spinner` for action in progress (submits, mutations, syncs, background operations, modal actions)

### F5. Raw Div for Card-Like Content
```tsx
// PROHIBITED when Card would be appropriate
<div className="rounded-xl border bg-white p-4">Content</div>
```

### F6. Manual Empty Messages
```tsx
// PROHIBITED — use EmptyState component
{data.length === 0 && <p className="text-center text-slate-500">No data</p>}
```

**Exception:** Operational empty states with contextual messaging (dynamic text per filter, large custom layout) may be preserved. See "Empty State Threshold" above.

### F7. Hardcoded Hex Colors in Tailwind
```tsx
// PROHIBITED
className="text-[#0F172A] bg-[#38BDF8]"
```

### F8. Duplicated UI Primitives
```tsx
// PROHIBITED — import from @/components/ui/
// Do not re-implement Badge, Skeleton, EmptyState, ConfirmModal, Card, MetricCard
```

### F9. Inline fontFamily Declarations
```tsx
// PROHIBITED — use Tailwind font classes or CSS variables
style={{ fontFamily: 'Inter, sans-serif' }}
```

### F10. Semantic Colors Outside Theme Hook
```tsx
// PROHIBITED — use colors from useThemeColors() only
// Exception: OVS-registered systems
style={{ color: '#0F4C5C' }}  // primary color hardcoded
```

---

## Architecture Guard

The `architecture-guard` script (`scripts/architecture-guard.ts`) automates drift detection across the codebase.

### Running

```bash
pnpm guard              # default output (stdout table)
pnpm guard --ci         # GitHub Actions annotation format
pnpm guard --json       # JSON output for programmatic use
pnpm guard --verbose    # include DEFERRED_BY_DESIGN items
```

### Output Categories

| Category | Color | Meaning |
|----------|-------|---------|
| `ALLOWED_OVS` | Green | Matches OVS Registry — no action needed |
| `WARN` | Yellow | Possible drift — review recommended |
| `CRITICAL` | Red | Confirmed violation — should be addressed |
| `DEFERRED_BY_DESIGN` | Blue | Known pattern, intentionally deferred |

### v1.1 Scanners

| Scanner | Confidence | Detects |
|---------|------------|---------|
| Colors | `high` / `medium` | Hardcoded hex/rgba (`high`) and Tailwind arbitrary colors (`medium`) outside OVS |
| Primitives | `high` / `heuristic` | Manual `<Loader2>` spinners (`high`), `animate-pulse` skeletons (`heuristic`) outside OVS/CPS and UI primitives directory |
| Hover | `medium` | Decorative `onMouseEnter`/`onMouseLeave` handlers |
| CPS (Canonical Primitives) | `high` | Positive detection of canonical primitive usage (`<Spinner />`, future CPS components) |

Confidence levels appear in `--json` output and `--verbose` mode. `high` = no false positives, `medium` = likely correct, `heuristic` = requires review.

### Scanner Precedence

When multiple scanners apply to the same file, findings are classified by
the following priority order:

```
1. ALLOWED_OVS    →  OVS Registry match (file-level exemption)
2. DEFERRED       →  DEFERRED_BY_DESIGN match (file-level)
3. ALLOWED_CPS    →  Canonical primitive usage (positive detection)
4. CRITICAL       →  High-confidence violations (inline hex, Loader2)
5. WARN           →  Low/medium confidence (arbitrary colors, hover, animate-pulse)
```

**Rules:**
- A file matching OVS is entirely exempt from lower scanners (OVS > all)
- CPS findings do NOT block CRITICAL or WARN — a file can use Spinner correctly
  and still have legitimate drift elsewhere
- Suppressed findings (via `// architecture-guard-ignore-next-line`) are always
  recategorized to `DEFERRED_BY_DESIGN`, regardless of original category
- The default output hides `ALLOWED_OVS`, `ALLOWED_CPS`, and `DEFERRED` to
  keep focus on actionable findings. Use `--verbose` to see all categories.

### CI Integration

The `--ci` flag produces GitHub Actions workflow command annotations but does
**not** fail the pipeline. CI enforcement will be evaluated in Phase 2 after
noise levels are understood.

---

## Suppression Annotations

Findings can be suppressed at the line level using inline comments.
Suppression is the ONLY mechanism for marking architectural exceptions.

### Syntax

```typescript
// architecture-guard-ignore-next-line reason: <required reason>
```

### Rules

1. `reason:` is **required** — no reason, no suppression
2. Suppresses ALL findings on the next line (across all scanners)
3. Suppressed findings are categorized as `DEFERRED_BY_DESIGN` in output
4. Suppression comments are auditable in code review

### Recommended reason categories

| Category | When to use |
|----------|-------------|
| `OVS <id>` | Pattern is registered as OVS but scanner does not cover it |
| `deferred structural` | Structural skeleton with layout-specific constraints |
| `deferred by design` | Conscious architectural decision already documented |
| `local style` | Acceptable local styling, low impact, contextual |
| `false positive` | Scanner over-match — should be reported |

### Examples

```typescript
// architecture-guard-ignore-next-line reason: OVS employee semantic palette
bg-amber-100 text-amber-800

// architecture-guard-ignore-next-line reason: deferred structural skeleton
<div className="grid grid-cols-7 gap-2 min-h-[500px]">
```

---

## Enforcement

### New Components
All new components must follow these rules before merge.

### Existing Components
Violations found during development should be flagged and resolved in the next available refactor cycle.

### Escalation
If a pattern is not covered by these rules or there's ambiguity, escalate to the team lead. Do not introduce new patterns without agreement.

---

## Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture Snapshot | `docs/ARCHITECTURE_SNAPSHOT.md` | Historical evolution and module status |
| OVS Registry | `docs/OPERATIONAL_VISUAL_SYSTEMS.md` | Catalog of allowed operational visual systems |
| Calendar Audit | `docs/CALENDAR_AUDIT.md` | Calendar module architecture investigation |

---

## Maintenance

This document should be reviewed quarterly or after major architectural changes. To propose changes:

1. Open an issue describing the proposed pattern
2. Include before/after examples
3. Wait for team discussion before implementing

**Version:** 1.3
**Last Updated:** May 2026