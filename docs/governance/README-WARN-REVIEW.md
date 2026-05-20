# WARN Review — Classification Guide

## Quick Start

1. **Open the sample:** `docs/governance/warn-review-sample.json` (75 entries)
2. **Read taxonomy:** `docs/governance/WARN-TAXONOMY-v1.md` (3-axis system ontology)
3. **Classify each entry:** Determine `system.origin` → `system.structure` → `maturity_gap` → derive `bucket`
4. **Flag uncertainties:** Set `requires_followup: true` if unsure
5. **Mark as reviewed:** Set `reviewed: true` when done

---

## Classification Methods

### Method A: Direct JSON edit (recommended for bulk)

```json
{
  "system": {
    "origin": "formal",
    "structure": "cohesive",
    "maturity_gap": "tokenization"
  },
  "bucket": "WARN-THEMING",
  "classification_confidence": "high",
  "component_type": "form",
  "notes": "Brand accent — primary action color across auth flow",
  "reviewed": true
}
```

### Method B: Script-assisted (future)

```bash
tsx scripts/architecture-guard.ts --classify-warn
```

---

## Workflow: Origin → Structure → Maturity Gap → Bucket

### Step 1: Determine `system.origin`

*"Where does this visual decision come from?"*

| Origin | Signal | Pattern |
|--------|--------|---------|
| `formal` | Matches Tailwind palette or `useThemeColors()` token | `#16A34A` = green-600, `#F59E0B` = amber-500 |
| `legacy` | External palette, no Tailwind equivalent | `#27AE60`, `#E74C3C` (FlatUI) |
| `emergent` | Cross-feature pattern, consistent but undocumented | Teal system `#0F4C5C`→`#0C3E4A`, dark-mode convergence |
| `runtime` | Workaround for architectural limitation | Hover handlers for dynamic theme tokens |
| `isolate` | One-off, no cross-feature reuse | `#5eead4` in single modal |

### Step 2: Determine `system.structure`

*"How internally consistent is this?"*

| Structure | Evidence |
|-----------|----------|
| `cohesive` | Base→hover darkening, coordinated channels, cross-feature reuse |
| `fragmented` | Isolated hex, no coordination, no hover pattern |
| `emergent-cohesive` | Internally coherent but not yet formalized (conditional pairs, dark convergence) |

### Step 3: Determine `maturity_gap`

*"What is missing to formalize this?"*

| Gap | Remediation |
|-----|-------------|
| `tokenization` | Extract to `theme.tokens.ts` or `useThemeColors()` |
| `abstraction` | Create CPS component (Skeleton, Button with hover) |
| `coverage` | Extend dark/light variant in theme config |
| `migration` | Replace entire era (FlatUI → Tailwind tokens) |
| `none` | Already formalized — suppress scanner |

### Step 4: Derive `bucket`

Use the projection mapping for backward compatibility:

| Ontology Combination | Derived Bucket |
|---------------------|---------------|
| origin:any + structure:cohesive + maturity_gap:tokenization | `WARN-THEMING` or `WARN-LEGITIMATE-OVS` |
| origin:runtime + maturity_gap:abstraction | `WARN-CPS-CANDIDATE` |
| origin:legacy + maturity_gap:migration | `WARN-TRANSITIONAL` |
| origin:isolate + maturity_gap:none | `WARN-NOISE` |

---

## Heuristics by Pattern

### arbitrary-color + brand values (`#38BDF8`, `#0F4C5C`, `#0C3E4A`)

**Origin hypothesis:** `emergent` (teal system) or `formal` (Tailwind brand)
**Structure:** Check cross-feature reuse and channel coordination
**Maturity gap:** `tokenization` if cross-feature cohesive, `none` if isolate

### arbitrary-color + semantic values (`#DC2626`, `#16A34A`, `#F59E0B`)

**Origin hypothesis:** `formal` (Tailwind tokens inline) or `legacy` (FlatUI)
**Structure:** Check if part of complete triad (green/amber/red)
**Maturity gap:** `none` if Tailwind inline, `migration` if FlatUI

### arbitrary-color + neutrals (`#475569`, `#0F172A`, `#E2E8F0`)

**Origin hypothesis:** `formal` (Tailwind tokens inline)
**Structure:** Often `emergent-cohesive` (conditional pair light/dark)
**Maturity gap:** `tokenization` or `coverage` if dark mode missing

### hover-handler

**Origin hypothesis:** `runtime` (theme token workaround)
**Structure:** `cohesive` if pattern is consistent
**Maturity gap:** `abstraction` (extract to CPS Button)

### manual-skeleton (animate-pulse)

**Origin hypothesis:** `runtime`
**Structure:** `cohesive` if dedicated component, `fragmented` if ad-hoc inline
**Maturity gap:** `abstraction` (extract to CPS Skeleton)

---

## Context Clues

### By `context` field

| Context | Likely Origin | Notes |
|---------|---------------|-------|
| `text` | formal, emergent | Often typography tokens or brand accent |
| `bg` | formal, runtime | Layout or component backgrounds |
| `border` | formal, legacy | Structural boundaries |
| `ring` | formal | Interaction/feedback states |

### By `component_type` (to infer)

| Component | Likely Origin | Notes |
|-----------|---------------|-------|
| `button` | emergent, formal | Action semantics (destructive, primary) |
| `badge` | formal, legacy | Status indicators |
| `modal` | formal | Structural patterns |
| `form` | formal | Input styling, labels |
| `calendar` | emergent, formal | Date states, availability |
| `analytics` | emergent | Data visualization semantics |
| `table` | formal | Row/cell patterns |
| `card` | formal | Layout patterns |

---

## Common Edge Cases

### "This color IS the brand"

**Verdict:** origin: `emergent`, bucket: WARN-THEMING

**Reasoning:** Brand colors appearing cross-feature with tonal hierarchy indicate an emergent proto-system. The gap is `tokenization`, not absence of design.

### "We use this everywhere — it's basically a token"

**Verdict:** origin: `emergent`, structure: `cohesive`, gap: `tokenization`

**Reasoning:** Cross-feature consistency with tonal progression (`#0F4C5C`→`#0C3E4A`) is evidence of intentional implicit governance. This is the system's most coherent layer.

### "This uses FlatUI colors from an older page"

**Verdict:** origin: `legacy`, gap: `migration`

**Reasoning:** FlatUI success/error pairs have internal hover coordination — it's a legacy system, not arbitrary drift. Requires full migration of the era, not just token extraction.

### "The hover handler just changes background color"

**Verdict:** origin: `runtime`, gap: `abstraction`

**Reasoning:** Runtime theme tokens (`useThemeColors()`) can't be expressed as compile-time Tailwind hover classes. The handler is a workaround, not UI logic leakage. CPS Button with built-in hover would resolve this.

### "This file will be refactored next quarter"

**Verdict:** origin: any, bucket: WARN-TRANSITIONAL

**Action:** Add suppression comment with reason and expiry:
```tsx
// architecture-guard-ignore-next-line reason: transitional - Calendar V2 migration Q2 2026
<div className="bg-[#38BDF8]">
```

### "This skeleton uses animate-pulse in a loading.tsx"

**Verdict:** origin: `runtime`, structure: `cohesive`, gap: `abstraction`

**Reasoning:** Loading files use the standard Next.js pattern. Skeleton primitives (Circle, Text, Block) could be CPS-extracted but the pattern is correct as-is.

### "I don't know why this color is here"

**Verdict:** Set `requires_followup: true`

**Next step:** Team discussion or code history review (`git blame`). Cannot determine origin without context.

---

## Quality Checks

Before marking entry as `reviewed: true`:

- [ ] `system.origin` assigned (formal/legacy/emergent/runtime/isolate)
- [ ] `system.structure` assigned (cohesive/fragmented/emergent-cohesive)
- [ ] `maturity_gap` assigned (tokenization/abstraction/coverage/migration/none)
- [ ] `bucket` derived from system ontology
- [ ] `classification_confidence` set
- [ ] `notes` explains reasoning (especially for LEGITIMATE-OVS or NOISE)
- [ ] `requires_followup` set if uncertain
- [ ] Cross-reference: does this hex appear elsewhere? Consistent classification?

---

## Tracking Progress

```bash
# Count reviewed entries
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);const data=d.entries||d;console.log('Reviewed:',data.filter(e=>e.reviewed).length+'/'+data.length)"

# Count by bucket
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);const data=d.entries||d;const b={};data.forEach(e=>b[e.bucket||'unclassified']=(b[e.bucket||'unclassified']||0)+1);console.log(b)"

# Count by system origin
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);const data=d.entries||d;const o={};data.forEach(e=>{const org=e.system?.origin||'unset';o[org]=(o[org]||0)+1});console.log('Origin:',o)"

# Count by maturity gap
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);const data=d.entries||d;const g={};data.forEach(e=>{const gap=e.system?.maturity_gap||'unset';g[gap]=(g[gap]||0)+1});console.log('Gap:',g)"

# Find entries needing followup
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);const data=d.entries||d;console.log('Followup:',data.filter(e=>e.requires_followup).length)"

# Schema validation
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);console.log('schema_version:',d.schema_version);console.log('export_mode:',d.export_mode);console.log('total_entries:',d.total_entries)"
```

---

## Deliverable

After Fase 0:

1. **Classified sample:** `warn-review-sample.json` with all 75 entries reviewed using system ontology
2. **Taxonomy v1.0:** `WARN-TAXONOMY-v1.md` with 3-axis system ontology + bucket projections
3. **Distribution analysis:** Origin, structure, maturity_gap breakdown (not just bucket)
4. **Edge case log:** Ambiguities discovered (for scanner tuning)
5. **Cross-system insights:** Boundary overlaps between formal/legacy/emergent/runtime/isolate

Then proceed to **Fase 1: Full Classification** (659 entries).
