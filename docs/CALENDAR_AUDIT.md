# Calendar Module Architecture Audit

**Type:** Read-only audit — no enforcement

**Scope:** 18 files across `src/components/calendar/` (16) and `src/components/dashboard/` (2)

**Audit Date:** May 2026

**Previous Module:** Confirmations (Phase 3.6C — conservative enforcement)

---

## Executive Summary

The Calendar module is **structurally healthier than expected** for a complex SaaS calendar. It does not have architectural chaos — it has:

- **Well-established theming patterns** — 15/18 components receive `COLORS` via props from `useThemeColors()`
- **Self-contained code** — zero UI primitive imports; everything is hand-rolled
- **Operational visual systems** — status colors, workload semaphores, employee differentiation palettes, cluster indicators
- **Two large orchestrators** — `CalendarView.tsx` (1330 lines) and `NewAppointmentWizard.tsx` (1286 lines) that concentrate most complexity

### Key Metrics

| Metric | Value |
|--------|-------|
| Components with `useThemeColors()` | 1/18 (`PurgeModal.tsx`) |
| Components receiving `COLORS` via props | 15/18 |
| Components ignoring theme system entirely | 1 (`ForceCreationModal.tsx`) |
| Components using `ui/Card`, `ui/Badge`, `ui/Skeleton`, `ui/EmptyState` | **0** |
| Hardcoded Tailwind color instances | ~40+ across 5 files |
| Duplicated employee color palette | 3 files (CalendarView, AppointmentClusterCard, AppointmentCardV2) |
| Inline modals (not portal-based) | 3+ in CalendarView |
| Components using `createPortal` | 1 (`PurgeModal.tsx`) |

### Zero Drag/Drop

Despite being a calendar, the module has **no drag-and-drop or resize interactions**. All appointment placement is sequential vertical stacking. This lowers interaction risk significantly.

---

## File Inventory

| File | Lines | Role | Theme |
|------|-------|------|-------|
| `calendar/CalendarHeader.tsx` | 92 | Week nav + "Nueva cita" CTA | COLORS prop |
| `calendar/CalendarGrid.tsx` | 93 | 7-column day grid | COLORS prop |
| `calendar/CalendarFooter.tsx` | 45 | Count + status legend | COLORS prop |
| `calendar/AppointmentCard.tsx` | 113 | Grid card (compact/standard) + EmptyDay export | COLORS prop |
| `calendar/AppointmentCardV2.tsx` | 119 | List card (avatar, service tag, hover) | COLORS prop |
| `calendar/AppointmentClusterCard.tsx` | 213 | Collapsible overlapping appointments | COLORS prop |
| `calendar/AppointmentList.tsx` | 62 | Delegates to hook for cluster detection | COLORS prop |
| `calendar/EmployeeChip.tsx` | 127 | Employee filter chip w/ workload badge | COLORS prop |
| `calendar/EmployeeSelectorBar.tsx` | 122 | Horizontal scrollable employee filter bar | COLORS prop |
| `calendar/OverflowDropdown.tsx` | 182 | Employee search + filter dropdown | COLORS prop |
| `calendar/ScheduleWarningBanner.tsx` | 86 | Warning banner for unconfigured schedules | COLORS prop |
| `calendar/PurgeModal.tsx` | 717 | 2-tab purge modal (selection / by days) | **useThemeColors()** |
| `calendar/ForceCreationModal.tsx` | 113 | Warning modal for off-hours scheduling | **Hardcoded Tailwind** |
| `calendar/AppointmentDetailsModal.tsx` | 213 | Legacy details modal | COLORS prop |
| `calendar/wizard/NewAppointmentWizard.tsx` | 1286 | 4-step appointment creation wizard | COLORS prop |
| `calendar/index.ts` | 4 | Barrel (CalendarHeader, CalendarGrid, CalendarFooter, AppointmentCard, EmptyDay) | — |
| `dashboard/CalendarView.tsx` | 1330 | Main orchestrator: fetch, state, real-time, 7+ modals, skeleton, employee colors | **useThemeColors()** |
| `app/(dashboard)/calendar/page.tsx` | — | Server component: auth guard, render CalendarView | — |

---

## Finding Classification

### 🟢 Safe to Audit

High confidence items — pure visual duplication with no domain coupling.

| # | Finding | Files | Details |
|---|---------|-------|---------|
| S1 | **Spinners (Loader2 + animate-spin)** | CalendarView, ForceCreationModal, NewAppointmentWizard, PurgeModal | ~6 instances of `<Loader2 className="...animate-spin" />`. No domain coupling. |
| S2 | **Inline skeleton (30+ lines)** | CalendarView:509-545 | Structural skeleton: header + 7 columns + 3 cards each. Layout-specific. See Skeleton Analysis below. |
| S3 | **Service tag badges** | AppointmentCardV2:70-78 | `px-1.5 py-0.5 rounded text-[10px]` — domain display of service name. Candidate for `<Badge>` if it matches design intent. |
| S4 | **Workload count badge** | EmployeeChip:91-105 | `px-1.5 py-0.5 rounded-full font-medium` — numeric badge. Candidate for `<Badge>` but see OVS1. |
| S5 | **+N overflow badge** | AppointmentClusterCard:119-127 | `px-1.5 sm:px-2 py-0.5 rounded-full` — count of collapsed appointments. Candidate for `<Badge>`. |
| S6 | **Card-like containers** | CalendarHeader, AppointmentCard, AppointmentCardV2, AppointmentClusterCard, NewAppointmentWizard, PurgeModal, ScheduleWarningBanner, OverflowDropdown | Multiple `rounded-xl border shadow` patterns. Candidate for `<Card>`. |
| S7 | **Inline empty "No se encontraron..."** | OverflowDropdown:117-123, NewAppointmentWizard (3+), PurgeModal (363-376) | Simple text empty states. Candidate for `<EmptyState>`. |
| S8 | **CalendarView "Sin citas" empty state** | CalendarView:717-723 | Inline empty state with icon. Candidate for `<EmptyState>`. |

### 🟡 Needs Validation

Items that appear migrable but require visual/human inspection.

| # | Finding | Files | Details |
|---|---------|-------|---------|
| V1 | **ForceCreationModal — fully hardcoded theme** | ForceCreationModal.tsx (entire file) | ✅ Amber/slate Tailwind classes + dark mode variants. **Ignores theme system entirely.** Migration is straightforward but modal layout is visual/warning-sensitive. |
| V2 | **ScheduleWarningBanner — fallback hex colors** | ScheduleWarningBanner:24, 44, 62 | Uses `COLORS.warning` but falls back to `#451A03`, `#FBBF24`, `#FCD34D`, `#B45309`. Need to verify if these are intentional fallback values. |
| V3 | **AppointmentClusterCard — hardcoded `#38BDF8`** | AppointmentClusterCard:122-123 | Badge background uses `#38BDF820` / `#38BDF810`. Should derive from `COLORS.primary` or similar. |
| V4 | **CalendarHeader — hardcoded shadow** | CalendarHeader:83 | `boxShadow: '0 4px 12px rgba(15,76,92,0.25)'`. Uses `#0F4C5C` directly. |
| V5 | **NewAppointmentWizard — hardcoded `#0F4C5C`** | NewAppointmentWizard:309, 311 | Step indicator uses `text-[#0F4C5C]`. |
| V6 | **CalendarView — shadow hex `#0F4C5C`** | CalendarView:574, 565 | `boxShadow` uses `rgba(15,76,92,...)`. Should derive from shadow tokens. |

### 🟠 Operational Visual Systems

Visual patterns that look like duplication but represent **operational business state**. These should be **preserved as semantic systems**, not blindly migrated to generic primitives.

| # | System | Files | Description | Decision |
|---|--------|-------|-------------|----------|
| OVS1 | **Workload Semaphore (WORKLOAD_COLORS)** | EmployeeChip:15-20 | 4-level workload indicator: low/normal/busy/overloaded with distinct color pairs. | **Preserve** — business logic mapping (levels), not presentation. Could accept `Badge` as renderer if API is designed correctly. |
| OVS2 | **Employee Differentiation Palette** | CalendarView:74-77, AppointmentClusterCard:17-20, AppointmentCardV2:17-20 | Duplicated hex array for employee colors. Cross-component concern shared across 3 files. | **Consolidate** — extract to a shared constant or hook. Not a migration to `Badge` but a consolidation. |
| OVS3 | **Appointment Status Colors (STATUS_CONFIG)** | CalendarView:67-72, all appointment cards | Status-to-color mapping for appointment states (confirmed, pending, cancelled, completed). | **Preserve** — domain logic. Colors already derive from `useThemeColors()` via CalendarView. |
| OVS4 | **Cluster Gradient Borders** | AppointmentClusterCard:44-49 | Dynamic gradient from employee colors when 2+ employees overlap. | **Preserve** — complex visual system that communicates multi-employee occupancy. |
| OVS5 | **Temporal Density (animate-pulse on overloaded)** | EmployeeChip:94 | `animate-pulse` CSS class on workload badge when employee is overloaded. | **Preserve** — operational state indicator (temporal urgency). |
| OVS6 | **Calendar-Specific Empty State (EmptyDay)** | AppointmentCard:101-113, CalendarGrid:72 | Circular icon + "Sin citas" — calendar-idiomatic empty state. | **Preserve** — generic `<EmptyState>` would lose visual specificity. |

### 🔴 Domain Sensitive

Do not touch. These have complex logic, critical interactions, or high regression risk.

| # | Item | Files | Risk |
|---|------|-------|------|
| D1 | **CalendarView orchestrator** | CalendarView.tsx (1330L) | **HIGHEST** — 30+ state variables, 7+ modal states, real-time Supabase subscriptions, inline edit/detail/delete modals, appointment CRUD orchestration |
| D2 | **NewAppointmentWizard** | NewAppointmentWizard.tsx (1286L) | **HIGH** — 4-step wizard with direction tracking, quick-create, debounced slot fetching, multi-modal sub-states |
| D3 | **AppointmentClusterCard expand/collapse** | AppointmentClusterCard:37-60 | Core UX pattern — expand/collapse with stopPropagation, gradient border derived from employee IDs |
| D4 | **OverflowDropdown click-outside** | OverflowDropdown:29-39 | DOM-coupled interaction (document.addEventListener) |
| D5 | **All real-time subscriptions** | CalendarView (via AppointmentRealtimeProvider) | Data integrity risk |
| D6 | **Status update + deletion flows** | CalendarView (status changes, delete confirm) | Business logic + data mutation |
| D7 | **AppointmentDetailsModal (legacy)** | AppointmentDetailsModal.tsx (213L) | Preserved, may be used or may be dead code |

---

## Risk Matrix

| Component | Impact | Probability | Interaction Sensitivity | Overall Risk |
|-----------|--------|-------------|------------------------|--------------|
| **CalendarView** | 🔴 High | 🔴 High | 🔴 High — 7+ modals, state cascades | **CRITICAL** |
| **NewAppointmentWizard** | 🔴 High | 🟡 Medium | 🔴 High — step transitions, slot timing | **HIGH** |
| **AppointmentClusterCard** | 🟡 Medium | 🟢 Low | 🟡 Medium — expand/collapse, stopPropagation | **MEDIUM** |
| **PurgeModal** | 🟡 Medium | 🟢 Low | 🟢 Low — already thematic, multi-tab | **MEDIUM-LOW** |
| **ForceCreationModal** | 🟡 Medium | 🟢 Low | 🟢 Low — static modal, no complex interaction | **LOW** |
| **ScheduleWarningBanner** | 🟢 Low | 🟢 Low | 🟢 Low — static banner | **LOW** |
| **EmployeeChip** | 🟢 Low | 🟢 Low | 🟢 Low — filter chip | **LOW** |
| **AppointmentCardV2** | 🟢 Low | 🟢 Low | 🟢 Low — card with hover scale | **LOW** |
| **AppointmentCard** | 🟢 Low | 🟢 Low | 🟢 Low — card with click | **LOW** |
| **CalendarGrid** | 🟢 Low | 🟢 Low | 🟢 Low — pure presentational grid | **LOW** |
| **CalendarHeader** | 🟢 Low | 🟢 Low | 🟢 Low — nav buttons | **LOW** |
| **OverflowDropdown** | 🟢 Low | 🟢 Low | 🟡 Medium — click-outside, search | **LOW-MEDIUM** |

---

## Skeleton Analysis

The loading skeleton in `CalendarView.tsx:509-545` (30+ lines) is a **structural skeleton** — it mirrors the actual calendar layout:

```
┌─────────────────────────────────────────┐
│  Header: title (32w) + subtitle (24w)   │
│  Buttons: 2 pill placeholders           │
├────┬────┬────┬────┬────┬────┬────┤
│ D1 │ D2 │ D3 │ D4 │ D5 │ D6 │ D7 │
│    │    │    │    │    │    │    │
│ ┌─┐ │ ┌─┐ │ ┌─┐ │ ┌─┐ │ ┌─┐ │ ┌─┐ │ ┌─┐ │
│ │C│ │ │C│ │ │C│ │ │C│ │ │C│ │ │C│ │ │C│ │
│ │a│ │ │a│ │ │a│ │ │a│ │ │a│ │ │a│ │ │a│ │
│ │r│ │ │r│ │ │r│ │ │r│ │ │r│ │ │r│ │ │r│ │
│ │d│ │ │d│ │ │d│ │ │d│ │ │d│ │ │d│ │ │d│ │
│ └─┘ │ └─┘ │ └─┘ │ └─┘ │ └─┘ │ └─┘ │ └─┘ │
└────┴────┴────┴────┴────┴────┴────┘
```

### Validation Required Before Migration

| Concern | Current Skeleton | Risk |
|---------|-----------------|------|
| **Layout shift (CLS)** | `min-h-[500px]` — fixed height matches real grid | Low — fixed height prevents CLS |
| **Density** | 3 cards per column — mirrors average density | Medium — generic `<Skeleton>` may not match column count |
| **Temporal alignment** | No temporal info shown — just placeholder cards | Low — no misleading info |
| **Perceived loading** | Smooth `animate-pulse` on all elements | Medium — skeleton is immediately replaced on data fetch |

### Decision Options

| Option | Effort | Trade-off |
|--------|--------|-----------|
| A. Replace divs with `<Skeleton variant="rectangular">` preserving structure | Medium | Higher fidelity, still structural, keeps layout match |
| B. Replace with 1-column skeleton (simplified) | Low | Loses density accuracy, may cause perceived emptiness |
| C. **Preserve as-is** | None | Already works, layout-accurate, specialized for calendar use case |

**Recommendation:** Option C (preserve) for now. The skeleton is specialized for the calendar grid layout. A generic `<Skeleton>` would not capture the 7-column structure. Revisit if a structural skeleton pattern emerges across other modules.

---

## Hardcoded Colors Inventory

| File | Line(s) | Color | Context |
|------|---------|-------|---------|
| CalendarHeader | 83 | `rgba(15,76,92,0.25)` | "Nueva cita" button shadow |
| ScheduleWarningBanner | 24 | `#451A0320` | Warning background fallback |
| ScheduleWarningBanner | 44 | `#FBBF24` | Title text fallback |
| ScheduleWarningBanner | 62 | `#FCD34D`, `#B45309` | Description text fallback |
| ScheduleWarningBanner | 72 | `#FFFFFF` | CTA button text |
| AppointmentClusterCard | 122-123 | `#38BDF820`, `#38BDF8`, `#0F4C5C` | +N badge (uses `COLORS.isDark` ternary) |
| ForceCreationModal | 37-108 | ~25 Tailwind classes | Entire modal: amber/slate with dark variants |
| NewAppointmentWizard | 309, 311 | `#0F4C5C` | Step indicator text |
| CalendarView | 75-77 | `#0F4C5C`, `#38BDF8`, etc. | EMPLOYEE_COLORS array |
| CalendarView | 565, 574 | `rgba(15,76,92,0.25)`, `rgba(15,76,92,0.08)` | Button + container shadow |
| CalendarView | 596 | `rgba(255,255,255,0.15)` | "Hoy" button background in header |
| CalendarView | 623 | `#FFFFFF` | "Nueva cita" button text |

---

## Cross-Component Concerns

### Employee Color Palette (duplicated in 3 files)

```
CalendarView.tsx:74-77        → EMPLOYEE_COLORS (uses for employeeColorMap)
AppointmentClusterCard.tsx:17-20 → DEFAULT_EMPLOYEE_COLORS (fallback)
AppointmentCardV2.tsx:17-20   → DEFAULT_EMPLOYEE_COLORS (fallback)
```

**Impact:** If colors are updated, all 3 files must change. Minor risk, easy to consolidate into a shared constant.

### Cluster Detection Logic

`AppointmentList.tsx` delegates to `useAppointmentClusters()` hook which determines whether to render `AppointmentCardV2` or `AppointmentClusterCard`. This is a clean separation of concerns.

---

## Migration Candidate Order (Future Enforcement)

Priority based on risk × impact × thematic benefit:

| Priority | Component | Why First | Category |
|----------|-----------|-----------|----------|
| **P1** | ForceCreationModal | Worst thematic offender. Fully hardcoded Tailwind. No domain sensitivity (static warning modal). | Needs Validation |
| **P2** | CalendarHeader | Single hardcoded shadow. Easy win. | Needs Validation |
| **P3** | ScheduleWarningBanner | Fallback hex values in otherwise COLORS-based component. | Needs Validation |
| **P4** | AppointmentClusterCard +N badge | Single hardcoded `#38BDF8`. | Safe |
| **P5** | PurgeModal spinners | Already uses `useThemeColors()`. Cleanup. | Safe |
| **P6** | CalendarView spinners | ~3 inline spinners. | Safe |
| **P7** | OverflowDropdown empty state | Simple text empty state. | Safe |
| **P8** | Employee color palette consolidation | Cross-component concern. | Operational |
| **P9** | CalendarView "Sin citas" empty state | Inline empty in orchestrator. | Safe |
| **P10** | CalendarView skeleton | Structural skeleton — requires validation first. | Needs Validation |
| **P11** | NewAppointmentWizard | Large, wizard-specific patterns. Last priority. | Domain |

---

## Prevention Layer Readiness Assessment

After this audit, is there enough evidence to build a Prevention Layer (lint rules, architecture checks, drift detection)?

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Repeated patterns identified | ✅ Strong | 8 Safe + 6 Needs Validation + 6 OVS findings |
| Theme violations understood | ✅ Clear | ~40 hardcoded color instances catalogued |
| Domain-sensitive boundaries known | ✅ Clear | 7 Domain Sensitive items, 6 OVS items |
| Module comparison available | ✅ Strong | Analytics, WhatsApp, Confirmations, Calendar — 4 modules of patterns |
| Anti-patterns stable | ✅ Yes | Confirmations governance established Anti-Patterns #1-#7 |
| OVS classification exists | ✅ New | Operational Visual Systems category handles the edge cases |

**Recommendation:** After Calendar audit documentation, the evidence base is sufficient for Prevention Layer. Calendar OVS findings suggest the layer needs to support "intentional exception" patterns for operational visual systems.

---

## Key Recommendations

1. **Do NOT enforce Calendar yet.** This is a read-only audit. The risk matrix shows CalendarView and NewAppointmentWizard are too sensitive for naive enforcement.

2. **Use this audit to test the OVS classification** in the Prevention Layer. If OVS works here, it works anywhere.

3. **Prioritize ForceCreationModal** if/when enforcement begins — worst thematic offender, lowest risk.

4. **Consolidate EMPLOYEE_COLORS** into a shared constant or hook (cross-component concern, easy win).

5. **Preserve skeleton as-is** — it is structural and layout-accurate. Do not force generic `<Skeleton>` into a calendar grid.

6. **After Calendar audit → Prevention Layer** is the recommended sequence. The 4-module evidence base (Analytics, WhatsApp, Confirmations, Calendar) is diverse enough to define robust rules.

---

## Appendix: Primitive Usage Gap

| Primitive | Analytics | WhatsApp | Confirmations | Calendar |
|-----------|-----------|----------|---------------|----------|
| `ui/Card` | ✅ | ✅ | — | ❌ 0 usage |
| `ui/Badge` | ✅ | ✅ | ✅ | ❌ 0 usage |
| `ui/Skeleton` | ✅ | ✅ | ✅ | ❌ 0 usage |
| `ui/EmptyState` | ✅ | ✅ | ✅ | ❌ 0 usage |
| `ui/MetricCard` | ✅ | ✅ | — | ❌ 0 usage |
| `ui/ConfirmModal` | — | — | ✅ | ❌ 0 usage |
| `useThemeColors()` | ✅ | ✅ | ✅ | ⚠️ 1/18 (PurgeModal) |

Calendar is the **least integrated** module — but due to its visual complexity and operational domain, **this is not necessarily bad**. The audit reveals that many hand-rolled patterns are domain-specific, not lazy duplication.

---

*Created from Calendar Module Architecture Audit — May 2026*
