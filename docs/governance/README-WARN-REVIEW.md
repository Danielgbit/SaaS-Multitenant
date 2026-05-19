# WARN Review — Classification Guide

## Quick Start

1. **Open the sample:** `docs/governance/warn-review-sample.json` (75 entries)
2. **Read taxonomy:** `docs/governance/WARN-TAXONOMY-v1.md` (bucket definitions)
3. **Classify each entry:** Set `bucket`, optionally `component_type` and `notes`
4. **Flag uncertainties:** Set `requires_followup: true` if unsure
5. **Mark as reviewed:** Set `reviewed: true` when done

---

## Classification Methods

### Method A: Direct JSON edit (recommended for bulk)

```json
{
  "bucket": "WARN-THEMING",
  "component_type": "form",
  "notes": "Brand accent — primary action color",
  "reviewed": true
}
```

### Method B: Script-assisted (future)

After taxonomy stabilization, we'll add:
```bash
tsx scripts/architecture-guard.ts --classify-warn
```

---

## Heuristics by Pattern

### arbitrary-color + brand values (`#38BDF8`, `#0F4C5C`, `#0C3E4A`)

**Default hypothesis:** WARN-THEMING

**Questions:**
- ¿Es color de marca/acentos? → THEMING
- ¿Codifica estado operacional? → LEGITIMATE-OVS
- ¿Es decorativo sin semántica? → THEMING o NOISE

### arbitrary-color + semantic values (`#DC2626`, `#16A34A`, `#F59E0B`)

**Default hypothesis:** WARN-LEGITIMATE-OVS

**Questions:**
- ¿Indica estado (success/error/warning)? → LEGITIMATE-OVS
- ¿Es decorativo? → THEMING
- ¿Es inconsistente con otros estados? → CPS-CANDIDATE (necesita unificación)

### arbitrary-color + neutrals (`#475569`, `#0F172A`, `#E2E8F0`)

**Default hypothesis:** WARN-THEMING

**Questions:**
- ¿Reemplaza token existente (textMuted, surface, etc.)? → THEMING
- ¿Es para experimento o caso especial? → NOISE
- ¿Es temporal pending refactor? → TRANSITIONAL

### hover-handler

**Default hypothesis:** WARN-CPS-CANDIDATE o WARN-THEMING

**Questions:**
- ¿El hover es decorativo puro? → CPS-CANDIDATE (extraer a componente)
- ¿Tiene semántica (ej: highlight row seleccionable)? → LEGITIMATE-OVS
- ¿Es patrón repetido? → THEMING (crear token de hover)

### manual-skeleton (animate-pulse)

**Default hypothesis:** WARN-CPS-CANDIDATE

**Questions:**
- ¿Ya existe CPS-002 Skeleton en el archivo? → CPS-CANDIDATE (migrar)
- ¿Es loading estructural específico del dominio? → LEGITIMATE-OVS
- ¿Es decorativo/animación de fondo? → NOISE o THEMING

---

## Context Clues

### By `context` field

| Context | Likely Buckets | Notes |
|---------|---------------|-------|
| `text` | THEMING, LEGITIMATE-OVS | Text color often semantic (status, hierarchy) |
| `bg` | THEMING, CPS-CANDIDATE | Backgrounds often theming or component patterns |
| `border` | LEGITIMATE-OVS, THEMING | Borders often encode state (error, focus) |
| `ring` | LEGITIMATE-OVS | Ring often indicates focus/selection state |

### By `component_type` (to infer)

| Component | Likely Buckets | Rationale |
|-----------|---------------|-----------|
| `button` | LEGITIMATE-OVS, THEMING | Action semantics (destructive, primary) |
| `badge` | LEGITIMATE-OVS | Status indicators |
| `modal` | THEMING, CPS-CANDIDATE | Structural patterns |
| `form` | THEMING | Input styling, labels |
| `calendar` | LEGITIMATE-OVS, THEMING | Date states, availability |
| `analytics` | LEGITIMATE-OVS, THEMING | Data visualization semantics |
| `table` | THEMING, CPS-CANDIDATE | Row/cell patterns |
| `card` | THEMING, CPS-CANDIDATE | Layout patterns |

---

## Common Edge Cases

### "This color IS the brand"

**Verdict:** WARN-THEMING (not OVS)

**Reasoning:** Brand colors should be centralized as tokens, not scattered as arbitrary values. OVS is for **operational semantics**, not brand identity.

### "We use this everywhere — it's basically a token"

**Verdict:** WARN-THEMING

**Reasoning:** Exactly! That's the definition of a proto-theme token. Migrate to `useThemeColors()`.

### "This is for a loading state"

**Verdict:** WARN-CPS-CANDIDATE

**Reasoning:** Loading states should use CPS components (Spinner, Skeleton), not inline `animate-pulse` or manual spinners.

### "This file will be refactored next quarter"

**Verdict:** WARN-TRANSITIONAL

**Action:** Add suppression comment with reason and expiry:
```tsx
// architecture-guard-ignore-next-line reason: transitional - Calendar V2 migration Q2 2026
<div className="bg-[#38BDF8]">
```

### "I don't know why this color is here"

**Verdict:** Set `requires_followup: true`

**Next step:** Team discussion or code history review (`git blame`).

---

## Quality Checks

Before marking entry as `reviewed: true`:

- [ ] Bucket assigned
- [ ] `component_type` inferred (if obvious from filename)
- [ ] `notes` explains reasoning (especially for LEGITIMATE-OVS or NOISE)
- [ ] `requires_followup` set if uncertain

---

## Tracking Progress

```bash
# Count reviewed entries
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);console.log('Reviewed:',d.filter(e=>e.reviewed).length+'/'+d.length)"

# Count by bucket
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);const b={};d.forEach(e=>b[e.bucket||'unclassified']=(b[e.bucket||'unclassified']||0)+1);console.log(b)"

# Find entries needing followup
node -e "const j=require('fs').readFileSync('docs/governance/warn-review-sample.json');const d=JSON.parse(j);console.log('Followup:',d.filter(e=>e.requires_followup).length)"
```

---

## Deliverable

After Fase 0:

1. **Classified sample:** `warn-review-sample.json` with all 75 entries reviewed
2. **Taxonomy v1.0:** `WARN-TAXONOMY-v1.md` with finalized bucket definitions
3. **Edge case log:** List of ambiguities discovered (for scanner tuning)
4. **Distribution preview:** Bucket breakdown of the sample

Then proceed to **Fase 1: Full Classification** (659 entries).
