# Architecture Snapshot

> STATUS: CURRENT IMPLEMENTATION
> Last updated: 2026-05-27

## Overview

System state documentation after completion of the Architecture Enforcement initiative. This document captures the architectural decisions, enforcement outcomes, and current state of the frontend system as of May 2026.

---

## Project Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | Full-stack framework (App Router) |
| **React** | 19 | UI library |
| **TypeScript** | 5.x | Static typing |
| **Tailwind CSS** | 4.x | Styling + design tokens |
| **Supabase** | — | Auth, Database, RLS, Realtime |
| **Stripe** | — | Payments and subscriptions |
| **Resend** | — | Transactional email |
| **N8N** | — | WhatsApp automations |

---

## Architecture Goals

1. **Eliminate duplicated UI systems** — Multiple independent implementations of same components
2. **Enforce design primitives** — Standardized UI component library
3. **Reduce code divergence** — Consistent patterns across modules
4. **Preserve domain architecture** — Complex business logic remains intact

---

## Completed Phases

### Phase 1 — UI Primitives System

Established the canonical component library in `src/components/ui/`:

| Component | File | Responsibility |
|-----------|------|----------------|
| `Card` | Card.tsx | Glass/solid/bordered containers |
| `MetricCard` | MetricCard.tsx | Dashboard KPI displays |
| `Skeleton` | Skeleton.tsx | Loading state placeholders |
| `EmptyState` | EmptyState.tsx | Empty list/table states |
| `Badge` | Badge.tsx | Status indicators |
| `ConfirmModal` | ConfirmModal.tsx | Destructive action confirmation |

**Outcome:** Single source of truth for design primitives. All other components must import from `@/components/ui/`.

---

### Phase 2 — Analytics Migration

Migrated all analytics dashboard components to use official primitives:

- `StatsCard.tsx` (duplicated) → `MetricCard.tsx`
- Local skeleton implementations → `Skeleton.tsx`
- Custom empty states → `EmptyState.tsx`
- Inline badge objects → `Badge.tsx`

**Outcome:** Analytics module now fully compliant. Zero duplicated UI components.

---

### Phase 3 — Architecture Enforcement

#### Phase 3 — Initial Enforcement

Systematic audit and refactor of dashboard components:
- Identified violations across modules
- Created baseline patterns for theme integration
- Established enforcement criteria

#### Phase 3.5 — Architecture Audit

Third-party review of enforcement decisions:
- Validated preservation decisions
- Documented intentional divergence
- Flagged remaining technical debt

#### Phase 3.6A — WhatsApp Enforcement Execution

Full compliance pass on WhatsApp module:
- TabQueue.tsx: Migrated Skeleton + EmptyState
- TabAutomations.tsx: Migrated Skeleton + EmptyState + Badge
- TabTemplates.tsx: Migrated Skeleton + EmptyState + Badge
- TabOverview.tsx: Migrated Skeleton + EmptyState
- WhatsAppModuleClient.tsx: Theme integration verified
- StatusBadge.tsx: Wrapper component created (uses Badge internally)

#### Phase 3.6B — WhatsApp QA + Regression Validation

Visual QA validation of all WhatsApp components:
- All Skeleton usage verified
- All EmptyState usage verified
- All Badge usage verified
- Dark mode compatibility confirmed
- Animation consistency confirmed
- 3 decorative hover handlers identified (deferred)

#### Phase 3.6C — Confirmations Enforcement Execution

Conservative compliance pass on Confirmations module. Applied the enforcement philosophy of "migrate only what brings value" and "preserve domain integrity":

- **ConfirmationsPanel.tsx:** Spinner → `<Skeleton variant="rectangular">` ×3, empty → `<EmptyState>`
- **NotificationCenter.tsx:** Removed local `SkeletonItem` → `<Skeleton>`, local `EmptyState` → `<EmptyState>`, added `useThemeColors()`
- **WalkinForm.tsx:** Empty state → `<EmptyState>`, duration badge → `<Badge>`
- **EmployeeConfirmations.tsx:** Decorative hover handlers → Tailwind `hover:shadow-lg hover:-translate-y-0.5`, type badge → `<Badge>`
- **ReceptionConfirmations.tsx:** Walk-in/Programada badge → `<Badge>`, status badge (Por cobrar/Pagado/No asistió/No realizado) → `<Badge>`
- **MarkCompletedModal.tsx:** 20+ hardcoded Tailwind colors → `useThemeColors()` tokens
- **AdjustPriceModal.tsx:** 15+ hardcoded Tailwind colors → `useThemeColors()` tokens

**Deferred by Design (domain-sensitive — NOT migrated):**
- `getTimeUrgency()` in ReceptionConfirmations — dynamic state-based urgency coloring
- `onMouseEnter`/`onMouseLeave` with `!isSuccess` guard in ReceptionConfirmations — conditional operational hover
- Large card-style empty states in Employee and Reception confirmations — contextual messaging per filter, visual quality > primitive consistency
- Public `confirmar` page — out of scope

---

### Phase 3.6D — Calendar Module Architecture Audit

Read-only architecture audit of the Calendar module (18 components):

- **Classification model defined:** 4 categories (Safe to Audit / Needs Validation / Operational Visual Systems / Domain Sensitive)
- **OVS Discovery:** 6 Operational Visual Systems identified (Workload Semaphore, Employee Palette, Status Config, Cluster Gradients, Temporal Pulse, EmptyDay)
- **Hardcoded colors catalogued:** ~40 instances across 5 files
- **Theming analysis:** 15/18 components receive COLORS via props, 1 uses useThemeColors(), 1 ignores theme entirely (ForceCreationModal)
- **Risk matrix built:** 3-axis (Impact × Probability × Interaction Sensitivity per component)

**Outcome:** Calendar is architecturally healthier than expected — no chaos, just underutilized primitives and inconsistencies. Read-only — no enforcement applied.

### Phase 4 — Prevention Layer

Transitioned from per-module enforcement to frontend-wide architectural stability. Established three new governance systems:

#### 4A — OVS Registry (`docs/OPERATIONAL_VISUAL_SYSTEMS.md`)

Independent catalog of intentionally preserved operational visual systems:
- 6 registered systems from Calendar audit + 6 reserved slots for future modules
- Each entry: ID, Module, Files, Rationale, Boundary, Detection Rule
- OVS entries are **not** technical debt — they are protected by policy

#### 4B — Governance Policy Update (`docs/ARCHITECTURE_GOVERNANCE.md` → v1.2)

- Added Policy Layer table (5 layers: Snapshot / Governance / OVS Registry / Drift Detection / Module Audits)
- Added Allowed Patterns section (OVS, structural skeletons, temporal visuals)
- Expanded Forbidden Patterns to 10 rules (F1–F10)
- Added Architecture Guard section documenting the drift detection tool

#### 4C — Drift Detection (`scripts/architecture-guard.ts`)

Automated drift detection with 3 scanners:
- **Colors scanner:** Hardcoded hex/rgba/Tailwind arbitrary colors outside OVS → WARN/CRITICAL
- **Primitives scanner:** Manual `<Loader2>` spinners → CRITICAL, `animate-pulse` skeletons outside OVS → WARN
- **Hover scanner:** Decorative `onMouseEnter`/`onMouseLeave` handlers → WARN

**First run results:** 6 ALLOWED_OVS · 659 WARN · 274 CRITICAL · 0 DEFERRED

**Current results (after Batch 1 — Calendar CPS migration):** 6 ALLOWED_OVS · 13 ALLOWED_CPS · 659 WARN · 266 CRITICAL · 0 DEFERRED

Flags: `--ci` (GitHub Actions annotations), `--json` (programmatic), `--verbose` (include OVS/deferred)

**Note:** CI integration is not yet active. Phase 1 is observability only — no pipeline breaks.

### Phase 4D — Canonical Primitive Spinner (CPS-001)

Added `Spinner` as the first Canonical Primitive System (CPS) entry:

- **Component:** `Spinner.tsx` in `src/components/ui/`
- **Status:** CPS-001 in the OVS/CPS Registry
- **Props:** `size` (`sm | md | lg`), `className`
- **Semantics:** Action-in-progress loading (submits, mutations, syncs) — distinct from `Skeleton` which signals structural content loading
- **Enforcement:** The architecture guard now recognizes `<Spinner>` usage as canonical. Manual `Loader2 + animate-spin` remains CRITICAL until migrated.

### Phase 4E — Suppression Annotations

Added inline suppression mechanism to architecture guard:

- **Syntax:** `// architecture-guard-ignore-next-line reason: <required reason>`
- **Scope:** Line-level, cross-scanner
- **Requirement:** `reason:` is mandatory — suppresses are auditable and categorized
- **Output:** Suppressed findings appear as `DEFERRED_BY_DESIGN`
- **Documentation:** Added Suppression Annotations section to Governance policy

### Phase 4F — Scorer Confidence

Added `confidence` field to all scanner findings:

| Level | Meaning | Scanners |
|-------|---------|----------|
| `high` | No false positives | Inline hex colors, Loader2 patterns |
| `medium` | Likely correct | Tailwind arbitrary colors, decorative hover handlers |
| `heuristic` | Requires review | `animate-pulse` outside OVS |

Confidence is included in `--json` output and `--verbose` CLI mode.

### Phase 4G — Positive CPS Scanner

Added `scanCanonicalPrimitives()` as the 4th architecture guard scanner:

- **Purpose:** Reports active CPS adoption (not just violation reduction)
- **Behavior:** Each `<Spanner>` usage outside `ui/` is a positive `ALLOWED_CPS` finding
- **Visibility:** Hidden by default (like OVS); visible in `--verbose` and `--json`
- **Result after Batch 1:** 13 CPS-001 findings detected across 4 files

This changes the governance model from "only punishment" to
"punishment + adoption visibility".

### Scanner Precedence

Formalized evaluation order for the 4 scanners:

```
1. ALLOWED_OVS    → OVS Registry match (file-level exemption)
2. DEFERRED       → DEFERRED_BY_DESIGN match (file-level)
3. ALLOWED_CPS    → Canonical primitive usage (positive detection)
4. CRITICAL       → High-confidence violations
5. WARN           → Low/medium confidence
```

CPS findings do NOT block CRITICAL or WARN — a file can use Spinner correctly
and still have legitimate drift elsewhere.

---

## Official UI Primitives

### Card
**File:** `src/components/ui/Card.tsx`

Container component for grouping content. Variants: `glass`, `solid`, `borrowed`. Optional `hover="lift"` for interactive cards.

### MetricCard
**File:** `src/components/ui/MetricCard.tsx`

Specialized card for dashboard metrics. Supports title, value, trend indicator, and icon. Used for KPIs in analytics and overview screens.

### Skeleton
**File:** `src/components/ui/Skeleton.tsx`

Loading placeholder (structural). Variants: `text`, `circular`, `rectangular`, `metric`. For content structure loading (cards, lists, tables, dashboard placeholders).

### Spinner
**File:** `src/components/ui/Spinner.tsx`

Loading indicator (action in progress). Props: `size` (`sm | md | lg`). For submits, mutations, syncs, background operations, modal actions.

### EmptyState
**File:** `src/components/ui/EmptyState.tsx`

Empty list/table placeholder. Accepts icon, title, description, and action slot. Replaces hardcoded empty messages.

### Badge
**File:** `src/components/ui/Badge.tsx`

Status indicator. Variants: `success`, `warning`, `error`, `info`, `primary`, `gold`, `neutral`. Sizes: `sm`, `md`. Replaces all local badge objects and manual span styling.

### ConfirmModal
**File:** `src/components/ui/ConfirmModal.tsx`

Destructive action confirmation. Uses system overlay, standardizes confirmation dialogs.

---

## Approved Architectural Patterns

### Theme Integration

```typescript
// Every component MUST use the theme hook
import { useThemeColors } from '@/hooks/useThemeColors'

export function MyComponent() {
  const COLORS = useThemeColors()

  return <div style={{ backgroundColor: COLORS.surface }}>
    Content
  </div>
}
```

### Server Actions Location

```
src/actions/[module]/[action].ts
```

Actions must be in their respective module folder under `src/actions/`.

### Component Organization

| Type | Location | Example |
|------|----------|---------|
| UI Primitives | `src/components/ui/` | Card, Badge, Skeleton |
| Domain Primitives | `src/components/dashboard/[module]/` | AppointmentCardV2 |
| Orchestrators | `src/components/dashboard/[module]/` | WhatsAppModuleClient |
| Shared Domain | `src/components/dashboard/` | CalendarView, Header |

---

## Preserved Domain Components

The following components were **intentionally preserved** because they contain complex domain logic, user interactions, or business rules that should not be abstracted into primitives:

### AppointmentCardV2
Complex appointment display with status transitions, employee assignment, and service grouping. Business logic too specific for generic primitive.

### AppointmentClusterCard
Groups related appointments. Contains date logic, employee grouping, and visual hierarchy specific to calendar domain.

### InventoryCard
Inventory item display with stock alerts, category filtering, and quantity management. Domain-specific behavior.

### ClientCard
Client information display with appointment history, contact actions, and notes preview. User interaction patterns.

### WhatsAppModuleClient
Tab orchestration with complex state management, real-time updates, and module-specific interactions.

### TemplateEditorModal
Form modal with template validation, variable substitution, and WhatsApp-specific formatting rules.

### AutomationEditModal
Automation rule builder with conditions, actions, and scheduling logic.

### CalendarView
Complex calendar interaction system with drag-and-drop, time slot generation, and multi-resource view.

**Principle:** UI primitives handle presentation. Domain components handle behavior. We enforce primitives for presentation, not domain logic.

### Confirmations-Specific Preserved Patterns

| File | Preserved Pattern | Classification |
|------|------------------|----------------|
| ReceptionConfirmations | `getTimeUrgency()` — dynamic urgency coloring | Deferred by Design |
| ReceptionConfirmations | `onMouseEnter` guard with `!isSuccess` | Deferred by Design |
| ReceptionConfirmations | Card-style empty state (3 filter messages) | Deferred by Design |
| EmployeeConfirmations | Card-style empty state ("Todo al día") | Deferred by Design |
| NotificationCenter | `TYPE_CONFIG`, `getUrgencyLevel()` | Deferred by Design |

---

## Violations Eliminated

### Duplicated StatCards
- **Before:** 3+ independent implementations of stats card in analytics folder
- **After:** Single MetricCard component used everywhere

### Local Badge Objects
- **Before:** `{ variant: 'success', label: 'Active' }` objects defined inline or in local utils
- **After:** Badge component from ui/ with standardized variants

### Manual Skeletons
- **Before:** Custom styled divs with animate-pulse mimicking loading
- **After:** Skeleton component with consistent variants

### Manual Empty States
- **Before:** Hardcoded "No data" divs scattered across components
- **After:** EmptyState component with consistent styling

### Decorative Hover Handlers (Most)
- **Before:** onMouseEnter/onMouseLeave patterns that only changed visual appearance
- **After:** Tailwind hover classes or removed entirely

### Local EmptyState Functions in NotificationCenter
- **Before:** `SkeletonItem` component and `EmptyState` function defined locally inside NotificationCenter.tsx
- **After:** Removed local implementations, imported from `@/components/ui/`

### Decorative Hover Handlers in EmployeeConfirmations
- **Before:** Custom `onMouseEnter`/`onMouseLeave` handlers changing box-shadow and transform on card
- **After:** Tailwind `hover:shadow-lg hover:-translate-y-0.5` with `transition-all duration-200`

---

## Deferred Technical Debt

Items that are actual technical debt — they should be fixed but were out of scope for this enforcement cycle.

### NotificationCenter Hardcoded Tailwind Colors
NotificationItem component uses `bg-slate-50`, `text-slate-500`, and other Tailwind color classes. Filter tabs use `bg-[#0F4C5C]`, `text-slate-500`. These require a full color migration pass.

**File:** NotificationCenter.tsx

### needs_review Visual State in Dark Mode (ConfirmationsPanel)
Uses hardcoded hex colors (`#FEF3C7`, `#D97706`). Works in light mode but may lack contrast in dark mode. Should use `COLORS.warning`/`COLORS.warningLight` with `isDark` fallback.

**File:** ConfirmationsPanel.tsx (lines 52-54)

### Typography Tokens
No centralized typography scale exists. Font families and sizes use Tailwind defaults. Future iteration should establish typographic tokens.

### Dynamic Color Computations
Some components compute colors dynamically (e.g., `COLORS.primary + '30'` for transparency). This pattern is fragile and should be replaced with proper theme token support for alpha values.

### Modal Backdrop Blur
TemplateEditorModal and AutomationEditModal use solid overlay instead of blur effect. Enhancement to be considered in UX polish cycle.

### WhatsAppModuleClient Header
Header section uses raw div instead of Card component. Stylistically inconsistent but functionally correct.

---

## Deferred by Design

Items intentionally preserved because migrating them would degrade domain clarity, UX quality, or operational behavior. These are **not** technical debt — they are conscious architectural decisions.

### Conditional Hover Logic
Some hover states serve functional purposes (showing tooltip triggers, drag handles) or contain guards (`!isSuccess`). These were preserved because the hover is not decorative — it is conditional on domain state.

**Files:** ReceptionConfirmations.tsx, TabQueue.tsx, TabAutomations.tsx, TabTemplates.tsx

### Operational Empty States
Large card-style empty states in EmployeeConfirmations and ReceptionConfirmations. These have contextual messaging that changes per filter, distinct background containers, and large custom icons. Migrating to `<EmptyState>` would reduce visual quality and lose domain-specific messaging.

**Files:** EmployeeConfirmations.tsx, ReceptionConfirmations.tsx

### Urgency Badge Systems
`getTimeUrgency()` in ReceptionConfirmations and `getUrgencyLevel()` in NotificationCenter compute dynamic colors based on time thresholds. These are domain-specific visual systems, not static badges.

**Files:** ReceptionConfirmations.tsx, NotificationCenter.tsx

### needs_review Visual State (ConfirmationsPanel)
The amber/gold `needs_review` styling in ConfirmationCard is a domain-specific alert state. While the dark mode contrast issue is debt (see above), the pattern itself (distinct amber card for delayed confirmations) is an intentional design decision.

---

## Modules Status

| Module | Enforcement Status | Doc Status | Skeleton | Spinner | EmptyState | Badge | Theme | OVS/CPS | Notes |
|--------|-------------------|------------|----------|---------|------------|-------|-------|---------|-------|
| Analytics | ✅ Complete | 📄 Documented | ✅ | ✅ | ✅ | ✅ | ✅ | — | Fully migrated |
| WhatsApp | ✅ Complete | 📄 Documented | ✅ | ✅ | ✅ | ✅ | ✅ | — | Fully migrated |
| Confirmations | ✅ Complete | 📄 Documented | ✅ | ✅ | ✅ | ✅ | ✅ | — | Conservative pass; 5 domain items deferred by design |
| Calendar | 🔍 Audited | 📄 Audited | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 🟢 6 OVS · CPS-001 | Migrating Spinner in Batch 1 |
| Payroll | 🔄 Transitional (V1→V2) | 📄 Documented | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | 🔲 | Dual model, fire-and-forget aggregation |
| Clients | ⚠️ Not Audited | 📄 Documented | ? | ? | ? | ? | ? | 🔲 | Schema documented, UI audit pending |
| Billing | ⚠️ Not Audited | 📄 Documented | ? | ? | ? | ? | ? | 🔲 | Schema documented, UI audit pending |
| Settings | ⚠️ Not Audited | 📄 Partial | ? | ? | ? | ? | ? | 🔲 | Data retention module documented |
| Database | 📄 Documented | 🟢 Complete | — | — | — | — | — | — | 44 migrations, entities, RLS, legacy tables |
| Shadow Mode | ✅ Implemented | 📄 Documented | — | — | — | — | — | — | Phase 2A+B active in observe_only |
| Data Retention | ✅ Implemented | 📄 Documented | — | — | — | — | — | — | Auto + manual purge |

**Legend:**
- ✅ = Compliant
- 🔄 = Transitional (en migración)
- ⚠️ = Partial/Issues found
- ❌ = Non-compliant
- 🔍 = Audited (read-only)
- 📄 = Documented
- ? = Not audited

---

## Final Architecture Outcome

### Consistency Improvements
- **All applicable** repeated UI patterns migrated to official primitives in Analytics
- **All applicable** repeated UI patterns migrated to official primitives in WhatsApp
- **All applicable** repeated UI patterns migrated to official primitives in Confirmations
- **Zero** duplicated StatCard implementations
- **Zero** local Badge implementations in migrated modules
- **35+** hardcoded modal colors migrated to theme tokens (MarkCompletedModal + AdjustPriceModal)

### Duplication Reduction
- 3+ StatsCard implementations → 1 MetricCard
- 5+ local badge objects → 1 Badge component
- Multiple custom skeletons → 1 Skeleton component
- Scattered empty states → 1 EmptyState component

### Preserved Domain Integrity
- Complex business logic untouched
- User interaction patterns preserved
- Domain-specific components remain maintainable
- No over-abstraction of domain behavior

### Risk Reduction
- Single source of truth for UI components
- Centralized theme management
- Predictable component behavior
- Consistent dark mode support

### Design System Consolidation
- Canonical component library established
- Theme hook as single color source
- Standardized loading patterns
- Standardized empty states

### Prevention Layer (Phase 4)
- **OVS Registry** — Frontend-wide catalog of protected operational visual systems (6 registered, 6 reserved)
- **CPS Registry** — Canonical Primitive Systems (CPS-001 Spinner), separate from OVS domain patterns
- **Architecture Guard** — Automated drift detection with 3 scanners, 4 output categories, --ci/--json/--verbose flags, confidence levels, and suppression annotations
- **Policy Layer Model** — 5 distinct layers (Snapshot / Governance / OVS+CPS Registry / Drift Detection / Module Audits)
- **Allowed Patterns** — OVS systems, CPS components, structural skeletons, temporal interaction visuals now formally permitted
- **Forbidden Patterns** — Expanded to 10 rules (F1–F10) covering colors, primitives, hovers, fonts, and duplication
- **Suppression Annotations** — Line-level `// architecture-guard-ignore-next-line reason:` mechanism for explicit, traceable exceptions

### Remaining Work
- **Phase 1.1 — Semantic Calibration:**
  - Batch 1: Calendar spinner migration ✅ (4 files, 13 Loader2 → Spinner)
  - Batch 2: Global spinner standardization (59 files remaining, ~90 Loader2) — 📅 Pendiente
  - WARN reclassification (manual 5-bucket analysis) — 📅 Pendiente
- Calendar enforcement (deferred — audit complete, actionable items identified)
- Payroll V2 cutover — deprecar `payroll_receipts` legacy
- Notification V2 cutover — eliminar `whatsapp_messages` legacy tables
- Architecture Guard Phase 2 (CI integration, noise baseline, severity tuning) — 📅 Pendiente
- Module audits: Clients, Billing, Settings UI enforcement

### Deferred Technical Debt
- **NotificationCenter hardcoded Tailwind colors** — `bg-slate-50`, `text-slate-500` en NotificationItem. No migrado por scope.
- **ConfirmationsPanel `needs_review` dark mode** — `#FEF3C7`/`#D97706` hardcoded. Funciona en light mode, contraste dudoso en dark.
- **Typography tokens** — No hay escala tipográfica centralizada. Font families y sizes usan Tailwind defaults.
- **Dynamic color computations** — `COLORS.primary + '30'` para transparencia. Frágil, debería reemplazarse con tokens alpha.
- **Modal backdrop blur** — `TemplateEditorModal` y `AutomationEditModal` usan overlay sólido en vez de blur.
- **Payroll fire-and-forget sin DLQ** — Si `addAppointmentToPayroll` falla, el error es silencioso. No hay retry ni dead-letter queue.
- **Dual notification tables** — `whatsapp_messages` (V1) y `notification_queue` (V2) coexisten. Shadow mode valida equivalencia.
- **`financial_events` histórico vacío** — La tabla append-only no tiene datos previos a su creación.

---

**Document Version:** 1.4
**Created:** May 2026
**Status:** Updated (2026-05-27)