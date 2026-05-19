# WARN Taxonomy v1.0 (Provisional)

**Status:** Provisional — subject to refinement during Fase 0 Sample Audit

**Purpose:** Classify WARN findings by **semantic intent**, not scanner pattern.

---

## Bucket Definitions

### WARN-LEGITIMATE-OVS

**Definition:** Visual semantics that encode operational domain meaning — color/pattern IS the signal.

**Criteria:**
- Color encodes state, status, or operational condition
- Removing/replacing the color would lose semantic information
- Pattern is tied to business logic, not aesthetic preference

**Examples:**
- `#DC2626` en botón "Eliminar" → destructive action semantic
- `#16A34A` en badge "Completado" → completion status
- `#F59E0B` en alerta de conflicto → warning state
- Employee-specific colors for workload differentiation (OVS-002)

**Action:** Candidate for OVS Registry entry

---

### WARN-THEMING

**Definition:** Proto-theme tokens — repeated visual patterns that should be centralized as design tokens.

**Criteria:**
- Color appears across multiple files/components (>3 occurrences)
- No operational semantic — used for aesthetic consistency
- Functions as de facto brand/accent/neutral token
- Would benefit from centralization in `useThemeColors()`

**Examples:**
- `#38BDF8` usado como accent color en 40+ archivos
- `#0F4C5C` como primary brand color en 50+ archivos
- `#475569` como text-muted en 15+ archivos

**Action:** Candidate for theme token migration (`theme.tokens.ts`)

---

### WARN-CPS-CANDIDATE

**Definition:** Duplicated UI patterns that should be extracted to Canonical Primitive System.

**Criteria:**
- Repeated component structure + styling combination
- Currently implemented ad-hoc in multiple locations
- Could be replaced by a single reusable component
- Pattern is structural, not semantic

**Examples:**
- `animate-pulse` en 20 skeletons → ya cubierto por CPS-002 (Skeleton)
- Loading states con spinner + texto → candidato para CPS-003 (LoadingState)
- Badge patterns con mismos colores y estructura → candidato para CPS-004 (StatusBadge)

**Action:** Candidate for CPS component creation

---

### WARN-TRANSITIONAL

**Definition:** Intentionally accepted technical debt with known expiry.

**Criteria:**
- File/component scheduled for refactor or replacement
- Pattern is acceptable temporarily due to timeline constraints
- Team has explicit agreement to tolerate until milestone X
- Documented in tech debt registry

**Examples:**
- Legacy module con inline colors pending Q2 refactor
- Feature flag-protected code path marked for removal
- Migration in progress (e.g., Calendar V1 → V2)

**Action:** Add to tech debt registry with expiry date; suppress with `// architecture-guard-ignore-next-line reason: transitional - refactor scheduled Q2 2026`

---

### WARN-NOISE

**Definition:** False positive or scanner issue — not actually drift.

**Criteria:**
- Pattern is intentional and justified
- Scanner misclassified the finding
- Edge case where enforcement would reduce code quality
- One-off acceptable exception (not repeated pattern)

**Examples:**
- Color inline intencional para experimento A/B test
- Gradiente con valores hex específicos (no tokenizable)
- Interop con librería externa que requiere colores específicos
- Dynamic color generation (e.g., `hsl(${hue}, 70%, 50%)`)

**Action:** Suppress with `// architecture-guard-ignore-next-line reason: <specific justification>` or tune scanner if systematic false positive

---

## Classification Workflow

### Step 1: Open the file

```bash
code src/app/(path)/to/file.tsx
```

### Step 2: Navigate to the line

Go to the `line` number in the entry.

### Step 3: Analyze semantic intent

Ask:
1. **¿Qué comunica este color/patrón?** (state, brand, decoration, structure)
2. **¿Si lo cambio, se pierde información?** (yes → OVS candidate; no → theming/CPS)
3. **¿Está repetido en otros archivos?** (yes → theming/CPS; no → noise/transitional)
4. **¿Este archivo va a ser refactorizado pronto?** (yes → transitional)

### Step 4: Assign bucket

Set `bucket` to one of the 5 values.

### Step 5: Add context (optional but helpful)

**component_type:** Infer from filename or parent element:
- `button`, `badge`, `card`, `modal`, `form`, `table`, `calendar`, `analytics`, `navigation`, etc.

**notes:** Free-text justification or observation:
- "Brand accent — used consistently across auth pages"
- "Destructive action semantic — should be OVS"
- "Skeleton loading — already using CPS-002 elsewhere in file"

### Step 6: Flag for followup if uncertain

Set `requires_followup: true` if:
- Can't determine intent from code alone
- Need team discussion on classification
- Edge case not covered by bucket definitions

---

## Sample Audit Protocol (Fase 0)

**Goal:** Classify 75 findings to stabilize taxonomy before full classification.

**Process:**
1. Classify all 75 entries in `warn-review-sample.json`
2. Track edge cases and ambiguities encountered
3. Refine bucket definitions based on discoveries
4. Freeze taxonomy v1.0 (no longer provisional)
5. Proceed to full classification (659 entries)

**Success criteria:**
- All 75 entries classified with high confidence
- <10% flagged as `requires_followup`
- Bucket definitions cover all observed patterns
- Team alignment on classification criteria

---

## Schema Reference

```json
{
  "id": "warn-arbitrary-color-0008",
  "file": "src/app/(auth)/forgot-password/page.tsx",
  "line": 37,
  "pattern": "arbitrary-color",
  "value": "#38BDF8",
  "context": "text",
  "component_type": "form",
  "confidence": "medium",
  "bucket": "WARN-THEMING",
  "requires_followup": false,
  "notes": "Brand accent — primary action color across auth flow",
  "reviewed": true
}
```

---

## Next Steps

After Fase 0 completion:
1. Update this document to v1.0 (remove "Provisional" status)
2. Run full classification: `tsx scripts/architecture-guard.ts --export-warn-review`
3. Analyze bucket distribution
4. Generate policy recommendations (Fase 3)
