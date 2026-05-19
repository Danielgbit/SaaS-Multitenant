# Operational Visual Systems Registry

**Purpose:** Catalog and protect visual patterns that represent operational business state. These systems look like UI duplication but are intentionally preserved because they encode domain semantics.

**Scope:** Frontend-wide. Every module with operational state indicators should have entries here.

**Status:** Active · May 2026

---

## Policy

1. OVS entries are **intentionally preserved systems** — they are not technical debt
2. New OVS entries must be proposed via PR, approved, and added to this registry
3. The `architecture-guard` tool uses this registry to classify findings as `ALLOWED_OVS`
4. A pattern outside this registry that looks like an OVS but isn't registered is a **violation**

---

## Registry

### OVS-001: Workload Semaphore

| Field | Value |
|-------|-------|
| **Module** | Calendar |
| **Files** | `EmployeeChip.tsx:15-20` |
| **Token Scope** | Module-level config (WORKLOAD_COLORS) |
| **Rationale** | 4-level workload indicator (low/normal/busy/overloaded) mapped to business logic thresholds. The colors encode operational urgency, not presentation preference. |
| **Status** | 🟢 Allowed |
| **Boundary** | Must remain in `EmployeeChip.tsx`. New modules must not duplicate this mapping. If another module needs workload levels, extract to a shared utility. |
| **Detection Rule** | `WORKLOAD_COLORS` reference in EmployeeChip → ALLOWED_OVS. Duplicate `WORKLOAD_COLORS` in any other file → WARN. |

---

### OVS-002: Employee Differentiation Palette

| Field | Value |
|-------|-------|
| **Module** | Calendar |
| **Files** | `CalendarView.tsx:74-77`, `AppointmentClusterCard.tsx:17-20`, `AppointmentCardV2.tsx:17-20` |
| **Token Scope** | Cross-component constant |
| **Rationale** | Distinct visual identity per employee in a multi-employee calendar. Each employee gets a unique color for their appointments, dots, and cluster indicators. |
| **Status** | 🟡 Needs Consolidation |
| **Boundary** | Currently duplicated across 3 files. Target state: single source of truth in a shared constant (e.g., `src/constants/employeeColors.ts`). After consolidation, the single source is ALLOWED_OVS; the old duplicates become violations. |
| **Detection Rule** | `EMPLOYEE_COLORS` or `DEFAULT_EMPLOYEE_COLORS` array definition → WARN (should be consolidated). Import of centralized palette → ALLOWED_OVS. |

---

### OVS-003: Appointment Status Colors (STATUS_CONFIG)

| Field | Value |
|-------|-------|
| **Module** | Calendar |
| **Files** | `CalendarView.tsx:67-72`, used across all appointment cards |
| **Token Scope** | Module-level mapping (status → theme token) |
| **Rationale** | Status-to-color mapping for appointment lifecycle (confirmed, pending, cancelled, completed, no-show). Colors derive from `useThemeColors()` via CalendarView prop — this is the canonical pattern for domain color mapping. |
| **Status** | 🟢 Allowed |
| **Boundary** | Must remain as a prop-drilled config from the orchestrator. Individual cards must not redefine their own status colors. |
| **Detection Rule** | Inline status color mapping in appointment cards → WARN. Centralized `STATUS_CONFIG` in CalendarView → ALLOWED_OVS. |

---

### OVS-004: Cluster Gradient Borders

| Field | Value |
|-------|-------|
| **Module** | Calendar |
| **Files** | `AppointmentClusterCard.tsx:44-49` |
| **Token Scope** | Component-specific visual system |
| **Rationale** | Dynamic gradient border computed from employee colors when 2+ employees share a time slot. Communicates multi-employee occupancy through spatial color blending. Not a generic Card variant — the gradient is derived from business data (employee IDs). |
| **Status** | 🟢 Allowed |
| **Boundary** | Must remain in `AppointmentClusterCard.tsx`. The gradient logic must reference employee colors (OVS-002) and must not be duplicated elsewhere. |
| **Detection Rule** | Dynamic gradient from employee IDs in AppointmentClusterCard → ALLOWED_OVS. Any other file building gradient from employee IDs → WARN. |

---

### OVS-005: Temporal Density Pulse

| Field | Value |
|-------|-------|
| **Module** | Calendar |
| **Files** | `EmployeeChip.tsx:94` |
| **Token Scope** | Component-specific interaction |
| **Rationale** | `animate-pulse` on workload badge when employee is overloaded. The pulse conveys temporal urgency — it's not decorative animation but an operational alert level. |
| **Status** | 🟢 Allowed |
| **Boundary** | Must remain in `EmployeeChip.tsx`. The pulse must be gated on business logic (workload > threshold), not on hover or other decorative triggers. |
| **Detection Rule** | `animate-pulse` conditional on workload level in EmployeeChip → ALLOWED_OVS. `animate-pulse` on any other badge/hover/decoration → WARN. |

---

### OVS-006: Calendar Empty Day (EmptyDay)

| Field | Value |
|-------|-------|
| **Module** | Calendar |
| **Files** | `AppointmentCard.tsx:101-113`, `CalendarGrid.tsx:72` |
| **Token Scope** | Calendar-specific layout component |
| **Rationale** | Circular icon + "Sin citas" inside a calendar day cell. This is not a generic empty state — it's a spatial placeholder that must fit within a 7-column grid cell. A generic `<EmptyState>` component would not preserve the compact, inline, calendar-idiomatic layout. |
| **Status** | 🟢 Allowed |
| **Boundary** | Must remain as a grid cell placeholder. List views, search results, and non-calendar contexts must use `<EmptyState>` instead. |
| **Detection Rule** | `EmptyDay` usage inside CalendarGrid → ALLOWED_OVS. Any non-calendar file using `EmptyDay` or duplicating its pattern → WARN. |

---

## Canonical Primitives (CPS)

Canonical UI primitives that must be used instead of ad-hoc implementations.
Unlike OVS entries, CPS entries do NOT represent domain semantics — they are
standard UI contracts enforced project-wide.

| ID | Component | File | Status |
|----|-----------|------|--------|
| CPS-001 | Spinner | Spinner.tsx | 🟢 Canonical |

### CPS-001: Spinner

| Field | Value |
|-------|-------|
| **Component** | `Spinner` from `@/components/ui/` |
| **File** | `Spinner.tsx` |
| **Rationale** | Canonical loading indicator for operations in progress (submits, mutations, syncs, background operations). Replaces all `Loader2 + animate-spin` ad-hoc implementations. |
| **Status** | 🟢 Canonical |
| **Usage** | `<Spinner size="sm" />` for buttons/inline, `<Spinner size="md" />` for page regions, `<Spinner size="lg" />` for full-page loading. |
| **Enforcement** | Any `Loader2 + animate-spin` outside ui/ directory is CRITICAL until migrated to `Spinner`. |

---

## Reserved IDs (Future Modules)

| ID | Module | Anticipated System | Status |
|----|--------|-------------------|--------|
| OVS-007 | Analytics | Heatmap/trend intensity colors | 🔲 Reserved |
| OVS-008 | Payroll | Payroll run states (pending/paid/error) | 🔲 Reserved |
| OVS-009 | WhatsApp | Message delivery status colors | 🔲 Reserved |
| OVS-010 | Automations | Timeline/workflow state indicators | 🔲 Reserved |
| OVS-011 | Billing | Subscription risk indicators (due/overdue/cancelled) | 🔲 Reserved |
| OVS-012 | Clients | Client status/loyalty tier indicators | 🔲 Reserved |

---

## Registry Maintenance

- **Adding entries:** PR must include: ID, Module, Files, Rationale, Boundary, and Detection Rule
- **Removing entries:** If an OVS is refactored into primitives, mark as `🔴 Deprecated` with migration date
- **Review cadence:** Quarterly, aligned with Governance document review
- **Authority:** Architecture Governance document is the parent policy; this registry is the exception list

---

*Created from Calendar Module Architecture Audit — May 2026*
*Document Version: 1.0*
