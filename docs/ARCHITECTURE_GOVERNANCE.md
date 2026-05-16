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

## Required Patterns

All dashboard components MUST follow these patterns:

| Pattern | Requirement |
|---------|-------------|
| Color source | All colors from `useThemeColors()` hook |
| Loading states | `Skeleton` component from `@/components/ui/` |
| Empty states | `EmptyState` component from `@/components/ui/` |
| Status badges | `Badge` component from `@/components/ui/` |
| Card containers | `Card` component from `@/components/ui/` |
| Hover effects | Tailwind `hover:` classes only (no onMouseEnter/onMouseLeave for decoration) |
| Animation | Use Tailwind `animate-*` classes only |

---

## Strategic Code Examples

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

## Component Classification

### UI Primitives
Canonical components in `src/components/ui/`. These are the enforced standard.

| Component | File | Purpose |
|-----------|------|---------|
| Card | Card.tsx | Container |
| MetricCard | MetricCard.tsx | KPI display |
| Skeleton | Skeleton.tsx | Loading placeholder |
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

## Anti-Patterns

The following patterns are prohibited:

### 1. Local Badge Implementations
```tsx
// PROHIBITED
const badge = { variant: 'success', text: 'Active' }
<span className="custom-badge">{badge.text}</span>
```

### 2. Inline Color Values
```tsx
// PROHIBITED
<div style={{ backgroundColor: '#FFFFFF' }} />
<span style={{ color: '#64748B' }} />
```

### 3. Decorative Hover Handlers
```tsx
// PROHIBITED - only changes appearance
onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '...'}
onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '...'}
```

### 4. Custom Loading Indicators
```tsx
// PROHIBITED - use Skeleton component
<div className="animate-pulse">Loading...</div>
```

### 5. Raw Div for Card-Like Content
```tsx
// PROHIBITED when Card would be appropriate
<div className="rounded-xl border bg-white p-4">Content</div>
```

### 6. Manual Empty Messages
```tsx
// PROHIBITED - use EmptyState component
{data.length === 0 && <p className="text-center text-slate-500">No data</p>}
```

### 7. Hardcoded Hex Colors in Tailwind
```tsx
// PROHIBITED
className="text-[#0F172A] bg-[#38BDF8]"
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

## Maintenance

This document should be reviewed quarterly or after major architectural changes. To propose changes:

1. Open an issue describing the proposed pattern
2. Include before/after examples
3. Wait for team discussion before implementing

**Version:** 1.0
**Last Updated:** May 2026