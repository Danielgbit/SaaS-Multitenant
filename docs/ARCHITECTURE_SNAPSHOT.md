# Architecture Snapshot

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

Loading placeholder. Variants: `text`, `circular`, `rectangular`, `metric`. Replaces spinners and custom loading implementations.

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

---

## Deferred Technical Debt

The following items were intentionally deferred from this enforcement cycle:

### Functional Hover Logic
Some hover states serve functional purposes (e.g., showing tooltip triggers, drag handles). These were preserved but should be evaluated for separation of concerns in future iterations.

**File:** TabQueue.tsx (line 429-430) — row hover showing checkbox visibility
**File:** TabAutomations.tsx (line 289-290) — button state change
**File:** TabTemplates.tsx (line 95-96) — button state change

### Typography Tokens
No centralized typography scale exists. Font families and sizes use Tailwind defaults. Future iteration should establish typographic tokens.

### Dynamic Color Computations
Some components compute colors dynamically (e.g., `COLORS.primary + '30'` for transparency). This pattern is fragile and should be replaced with proper theme token support for alpha values.

### Modal Backdrop Blur
TemplateEditorModal and AutomationEditModal use solid overlay instead of blur effect. Enhancement to be considered in UX polish cycle.

### WhatsAppModuleClient Header
Header section uses raw div instead of Card component. Stylistically inconsistent but functionally correct.

---

## Modules Status

| Module | Enforcement Status | Skeleton | EmptyState | Badge | Theme | Notes |
|--------|-------------------|----------|------------|-------|-------|-------|
| Analytics | ✅ Complete | ✅ | ✅ | ✅ | ✅ | Fully migrated |
| WhatsApp | ✅ Complete | ✅ | ✅ | ✅ | ✅ | Fully migrated |
| Calendar | ⚠️ Not Audited | ? | ? | ? | ? | Pending review |
| Payroll | ⚠️ Partial | ⚠️ | ⚠️ | ⚠️ | ⚠️ | In progress |
| Clients | ⚠️ Not Audited | ? | ? | ? | ? | Pending review |
| Billing | ⚠️ Not Audited | ? | ? | ? | ? | Pending review |
| Settings | ⚠️ Not Audited | ? | ? | ? | ? | Pending review |

**Legend:**
- ✅ = Compliant
- ⚠️ = Partial/Issues found
- ❌ = Non-compliant
- ? = Not audited

---

## Final Architecture Outcome

### Consistency Improvements
- **100%** of analytics components using official primitives
- **100%** of WhatsApp components using official primitives
- **Zero** duplicated StatCard implementations
- **Zero** local Badge implementations in migrated modules

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

---

**Document Version:** 1.0
**Created:** May 2026
**Status:** Final