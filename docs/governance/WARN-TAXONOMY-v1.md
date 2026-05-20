# WARN Taxonomy v1.0

**Status:** Stable — validated through Calibration Round 1 (15 diverse findings)

**Core insight:** WARN is not "bad colors." WARN is a map of unresolved system boundaries across coexisting visual systems with different origins, structures, and maturity levels.

---

## System Ontology (Primary Classification)

Every entry is classified across 3 independent axes:

### 1. `origin` — Genealogy

Where does this visual decision come from?

| Origin | Definition | Examples |
|--------|-------------|---------|
| `formal` | Current design system / framework palette | Tailwind semantic colors (`green-600`, `amber-500`), `useThemeColors()` tokens |
| `legacy` | Pre-existing era or external palette | FlatUI colors (`#27AE60`, `#E74C3C`) |
| `emergent` | Implicit cross-feature system not yet formalized | Teal proto-system (`#0F4C5C` → `#0C3E4A`), dark-mode convergence layer |
| `runtime` | Execution-layer workaround for architectural limitation | Hover handlers for runtime theme tokens, inline skeletons |
| `isolate` | Non-systemic decorative value, no cross-feature reuse | `#5eead4` in single modal, one-off accent colors |

### 2. `structure` — Internal Form

How internally consistent is this visual decision within its own context?

| Structure | Definition | Calibration Examples |
|-----------|-------------|---------------------|
| `cohesive` | Consistent rules, coordinated channels, intentional hierarchy | Teal system (5 channels, base→hover), FlatUI (hover darkening), Tailwind tríada (orgs+promos) |
| `fragmented` | No internal consistency, isolated choices | `#5eead4` as isolate, ad-hoc inline skeletons without pattern |
| `emergent-cohesive` | Internally coherent patterns but not yet formalized as system | Conditional theme pairs, dark-mode convergence fallbacks |

**Key insight from Round 1:** Structure is independent of origin. A legacy system (FlatUI) can be cohesive. An emergent system (teal) can be cohesive. Structure measures internal form, not external maturity.

### 3. `maturity_gap` — Governance Debt

What is missing to formalize this into the target design system?

| Gap | Definition | Typical Origin | Remediation |
|-----|-------------|---------------|-------------|
| `tokenization` | Correct values need extraction as named tokens | formal, emergent | Create token in `theme.tokens.ts` |
| `abstraction` | UI primitives need CPS component extraction | runtime | Create CPS (Skeleton, Button with hover) |
| `coverage` | Theme variant missing (e.g., dark mode gaps) | formal, emergent | Extend theme config |
| `migration` | Requires replacement of entire era/palette | legacy | Migrate FlatUI → Tailwind tokens |
| `none` | Already formalized — scanner false positive | isolate, formal | Suppress or tune scanner |

---

## Bucket Projections (Derived, Legacy-Compatible)

The 5 buckets are **projections** of the primary system ontology — derived for backward compatibility and query convenience. They are NOT the primary classification.

| Bucket | Typical Ontology Combination | Description |
|--------|------------------------------|-------------|
| `WARN-LEGITIMATE-OVS` | origin: any, structure: cohesive, maturity_gap: tokenization | Color encodes operational domain meaning — removing it loses semantic information |
| `WARN-THEMING` | origin: formal/legacy/emergent, structure: cohesive, maturity_gap: tokenization/coverage/migration | Proto-token or legacy system needing formalization |
| `WARN-CPS-CANDIDATE` | origin: runtime, structure: cohesive/fragmented, maturity_gap: abstraction | Duplicated UI pattern extractable as canonical component |
| `WARN-TRANSITIONAL` | origin: runtime/legacy, maturity_gap: migration | Intentionally accepted debt with known remediation path |
| `WARN-NOISE` | origin: isolate, maturity_gap: none | False positive — not actually drift |

---

## Heuristics (Emergent from Calibration Round 1)

### Structure Heuristics

- **Conditional theme pairs** (`light:#X dark:#Y`) reduce ontology severity — they indicate implicit theme governance even when inline
- **Cross-channel color coordination** (ring+border+bg+text+shadow sharing one hex) is strong evidence of intentional local governance, not drift
- **Base→hover darkening** (e.g., `#0F4C5C`→`#0C3E4A`) indicates valid tonal system structure
- **Coordinated semantic triads** (green/amber/red status system) appearing cross-feature = implicit design system

### Origin Heuristics

- **Repeated dark-mode convergence** toward a single hex across different features = emergent system layer, not drift
- **Same hex in same semantic role across features** = proto-governance
- **Same hex in different semantic roles across features** = contextual ontology — meaning depends on position, not value
- **FlatUI or other non-Tailwind palettes** with internal hover coordination = legacy system, not arbitrary choices

### Maturity Heuristics

- **Runtime theme workaround** (hover handlers for dynamic tokens) ≠ UI logic leakage — it's an architectural gap between runtime theme and compile-time CSS
- **Dedicated skeleton component** with theme tokens = low severity CPS gap; **inline ad-hoc animate-pulse** in live component = higher severity
- **Token-inline from framework palette** (e.g., `bg-[#16A34A]` vs `bg-green-600`) = lowest severity, purely mechanical remediation
- **Light mode tokenized + dark mode inline** = asymmetric theme coverage, not missing governance

---

## Classification Workflow

### Step 1: Open the source file

```bash
code src/app/(path)/to/file.tsx
```

### Step 2: Navigate to the line

Go to the `line` number in the entry.

### Step 3: Determine `system.origin`

Ask: *"Where does this visual decision come from?"*

- Is it a standard Tailwind color? → `formal`
- Is it from an older palette (FlatUI, custom legacy)? → `legacy`
- Is it a cross-feature pattern not yet documented? → `emergent`
- Is it a workaround for runtime/architectural limitations? → `runtime`
- Is it a one-off decorative value? → `isolate`

### Step 4: Determine `system.structure`

Ask: *"How internally consistent is this?"*

- Does it follow rules (hover darkening, coordinated channels)? → `cohesive`
- Is it isolated and uncoordinated? → `fragmented`
- Is it coherent but not formalized as system? → `emergent-cohesive`

### Step 5: Determine `maturity_gap`

Ask: *"What is missing to formalize this?"*

- Needs token extraction? → `tokenization`
- Needs CPS component? → `abstraction`
- Needs dark/light variant? → `coverage`
- Needs era migration? → `migration`
- Already fine? → `none`

### Step 6: Derive `bucket`

Use the projection table above to derive the bucket for backward compatibility.

### Step 7: Add context

**component_type:** Infer from filename or parent element:
- `button`, `badge`, `card`, `modal`, `form`, `table`, `calendar`, `analytics`, `navigation`, etc.

**notes:** Free-text reasoning:
- "Brand accent — used consistently across auth pages"
- "Destructive action semantic — should be OVS"
- "FlatUI legacy — needs migration to Tailwind green-600"

### Step 8: Flag for followup if uncertain

Set `requires_followup: true` if:
- Can't determine origin or structure from code alone
- Need team discussion on classification
- Edge case not covered by the ontology

---

## Schema Reference

**Dataset wrapper (root):**

```json
{
  "schema_version": "warn-review-v1.2",
  "generated_at": "2026-05-19T22:34:31.587Z",
  "export_mode": "sample",
  "total_entries": 75,
  "entries": [...]
}
```

**Entry schema:**

```json
{
  "id": "warn-arbitrary-color-0008",
  "file": "src/app/(auth)/forgot-password/page.tsx",
  "line": 37,
  "pattern": "arbitrary-color",
  "value": "#38BDF8",
  "context": "text",
  "component_type": null,
  "confidence": "medium",
  "classification_confidence": null,
  "system": null,
  "bucket": null,
  "requires_followup": false,
  "notes": "",
  "reviewed": false
}
```

**Field semantics:**

| Field | Type | Description |
|-------|------|-------------|
| `confidence` | `"high" \| "medium" \| "heuristic"` | Scanner epistemology: "¿esto existe?" |
| `classification_confidence` | `"high" \| "medium" \| "uncertain" \| null` | Semantic epistemology: "¿qué significa?" |
| `system.origin` | `"formal" \| "legacy" \| "emergent" \| "runtime" \| "isolate" \| null` | Genealogy — de dónde viene |
| `system.structure` | `"cohesive" \| "fragmented" \| "emergent-cohesive" \| null` | Internal form — cómo se organiza |
| `system.maturity_gap` | `"tokenization" \| "abstraction" \| "coverage" \| "migration" \| "none" \| null` | Governance debt — qué falta |
| `bucket` | 5-bucket union \| `null` | Derived projection (legacy-compatible) |
| `requires_followup` | `boolean` | Flag for ambiguous cases |
| `reviewed` | `boolean` | Entry has been manually classified |

---

## Next Steps

1. Classify remaining ~60 entries in `warn-review-sample.json` using v1.0 ontology
2. Validate that all 10 sub-bucket patterns are covered
3. Run full classification: `tsx scripts/architecture-guard.ts --export-warn-review`
4. Analyze distribution by system origin, structure, and maturity gap
5. Generate policy recommendations (Fase 3)
