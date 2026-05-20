# Calibration Round 1 — WARN Semantic Discovery

**Date:** 2026-05-19  
**Goal:** Maximize semantic discovery (NOT correctness)  
**Findings:** 15 deliberately ambiguous entries  
**Status:** In Progress

---

## Finding #1

```yaml
id: warn-arbitrary-color-0363
file: src/app/admin/organizations/page.tsx:22
value: "#DC2626"
context: bg+text
pattern: arbitrary-color
feature_area: admin
component_type: status-badge (inferred)
semantic_intent: operational-status
visual_scope: operational
bucket: WARN-LEGITIMATE-OVS
alternative_bucket: WARN-THEMING
classification_confidence: high
ambiguity: >
  Los colores son arbitrarios pero codifican estado de negocio.
  ¿OVS semántico pero implementación "deuda de tokenización"?
taxonomy_tension: >
  WARN-LEGITIMATE-OVS vs WARN-THEMING:
  El color comunica estado operacional (OVS) pero está hardcodeado (theming debt).
  ¿El bucket clasifica por INTENCIÓN o por IMPLEMENTACIÓN?
heuristic: >
  Cuando colores forman sistema coordinado (red/green/amber/sky)
  mapeando a estados de negocio → OVS, sin importar implementación.
followup: true
reasoning: >
  Red/green/amber/sky forman una tríada semáfora codificando el ciclo de vida
  de suscripción de organizaciones. Los colores NO son decorativos; comunican
  transiciones de estado operacional (trial→active→grace→past_due→canceled).
  El patrón bg-[#COLOR]/10 text-[#COLOR] es consistente en los 5 estados.
  Mapping explícito en objeto config. Labels en español confirman intención.
  Similar a confirmation semaphores ya clasificados como OVS.
  La tensión real: semánticamente es OVS, técnicamente necesita tokenización.
```

---

## Finding #2

```yaml
id: warn-arbitrary-color-0201
file: src/app/(dashboard)/employees/[id]/availability/EmployeeAvailabilityTab.tsx:112
value: "#0F172A" + "#F8FAFC"
context: text (same line)
pattern: arbitrary-color
feature_area: employees
component_type: tab/toggle (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #3

```yaml
id: warn-arbitrary-color-0010
file: src/app/(auth)/login/page.tsx:25
value: "#38BDF8"
context: bg
pattern: arbitrary-color
feature_area: auth
component_type: button (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #4

```yaml
id: warn-arbitrary-color-0008
file: src/app/(auth)/forgot-password/page.tsx:37
value: "#38BDF8"
context: text
pattern: arbitrary-color
feature_area: auth
component_type: link (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #5

```yaml
id: warn-arbitrary-color-0000
file: src/app/(auth)/forgot-password/ForgotPasswordForm.tsx:45
value: "#0F4C5C"
context: ring+border
pattern: arbitrary-color
feature_area: auth
component_type: form-input (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #6

```yaml
id: warn-arbitrary-color-0319
file: src/app/(public)/confirmar/[token]/page.tsx:302
value: "#27AE60" + "#219A52"
context: bg (same line)
pattern: arbitrary-color
feature_area: public-confirm
component_type: status-message (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #7

```yaml
id: warn-arbitrary-color-0321
file: src/app/(public)/confirmar/[token]/page.tsx:315
value: "#E74C3C"
context: border+text
pattern: arbitrary-color
feature_area: public-confirm
component_type: status-message (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #8

```yaml
id: warn-arbitrary-color-0359
file: src/app/admin/organizations/page.tsx:20
value: "#16A34A"
context: bg+text
pattern: arbitrary-color
feature_area: admin
component_type: status-badge (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #9

```yaml
id: warn-arbitrary-color-0443
file: src/app/admin/promo-codes/page.tsx:28
value: "#F59E0B"
context: bg
pattern: arbitrary-color
feature_area: admin
component_type: warning-badge (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #10

```yaml
id: warn-manual-skeleton-0005
file: src/app/(dashboard)/clients/ClientCard.tsx:214
value: "animate-pulse"
context: null
pattern: manual-skeleton
feature_area: dashboard-clients
component_type: card-skeleton (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #11

```yaml
id: warn-hover-handler-0001
file: src/components/dashboard/AdjustPriceModal.tsx:118
value: "hover-handler"
context: null
pattern: hover-handler
feature_area: dashboard-components
component_type: interactive-row (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #12

```yaml
id: warn-arbitrary-color-0111
file: src/app/(dashboard)/employees/InviteEmployeeModal.tsx:121
value: "#5eead4"
context: text
pattern: arbitrary-color
feature_area: employees
component_type: modal-accent (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #13

```yaml
id: warn-arbitrary-color-0355
file: src/app/admin/layout.tsx:28
value: "#FAFAF9"
context: bg
pattern: arbitrary-color
feature_area: admin
component_type: layout-shell (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #14

```yaml
id: warn-arbitrary-color-0032
file: src/app/(dashboard)/calendar/page.tsx:111
value: "#0C3E4A"
context: bg
pattern: arbitrary-color
feature_area: calendar
component_type: calendar-cell (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Finding #15

```yaml
id: warn-arbitrary-color-0008
file: src/app/(auth)/forgot-password/page.tsx:37
value: "#38BDF8"
context: text
pattern: arbitrary-color
feature_area: auth
component_type: link (inferred)
semantic_intent: ?
visual_scope: ?
bucket: ?
alternative_bucket: ?
classification_confidence: ?
ambiguity: ?
taxonomy_tension: ?
heuristic: ?
followup: ?
reasoning: ?
```

---

## Round 1 Output Summary

### Taxonomy Tensions Discovered

_(to be filled after completing all 15 findings)_

### Ambiguity Clusters

_(to be filled after completing all 15 findings)_

### Semantic Conflicts

_(to be filled after completing all 15 findings)_

### Candidate Sub-Buckets

_(to be filled after completing all 15 findings)_

### Emergent Heuristics

_(to be filled after completing all 15 findings)_
