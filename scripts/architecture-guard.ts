#!/usr/bin/env tsx
/**
 * architecture-guard — Prevention Layer Phase 1
 *
 * Detects frontend architectural drift across 3 scanners:
 *   - Colors: hardcoded hex/rgba/Tailwind arbitrary colors
 *   - Primitives: local re-implementations of UI primitives (Loader2 spinners, animate-pulse skeletons)
 *   - Hover: decorative onMouseEnter/onMouseLeave handlers
 *
 * Usage:
 *   tsx scripts/architecture-guard.ts
 *   tsx scripts/architecture-guard.ts --ci
 *   tsx scripts/architecture-guard.ts --json
 *   tsx scripts/architecture-guard.ts --verbose
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Category = 'ALLOWED_OVS' | 'ALLOWED_CPS' | 'WARN' | 'CRITICAL' | 'DEFERRED_BY_DESIGN'
type Confidence = 'high' | 'medium' | 'heuristic'

interface Finding {
  category: Category
  confidence: Confidence
  file: string
  line: number
  reason: string
  detail: string
}

interface OVSWhitelistEntry {
  pattern: RegExp
  files: string[]
  id: string
}

interface DeferredEntry {
  pattern: RegExp
  files: string[]
  id: string
  reason: string
}

interface ScannerResult {
  scanner: string
  findings: Finding[]
}

/* ------------------------------------------------------------------ */
/*  OVS Whitelist (sourced from docs/OPERATIONAL_VISUAL_SYSTEMS.md)   */
/* ------------------------------------------------------------------ */

const OVS_WHITELIST: OVSWhitelistEntry[] = [
  {
    id: 'OVS-001',
    pattern: /WORKLOAD_COLORS/,
    files: ['EmployeeChip.tsx'],
  },
  {
    id: 'OVS-002',
    pattern: /EMPLOYEE_COLORS|DEFAULT_EMPLOYEE_COLORS/,
    files: [
      'CalendarView.tsx',
      'AppointmentClusterCard.tsx',
      'AppointmentCardV2.tsx',
    ],
  },
  {
    id: 'OVS-003',
    pattern: /STATUS_CONFIG/,
    files: ['CalendarView.tsx'],
  },
  {
    id: 'OVS-004',
    pattern: /conic-gradient/i,
    files: ['AppointmentClusterCard.tsx'],
  },
  {
    id: 'OVS-005',
    pattern: /animate-pulse/,
    files: ['EmployeeChip.tsx'],
  },
  {
    id: 'OVS-006',
    pattern: /EmptyDay/,
    files: ['CalendarGrid.tsx', 'AppointmentCard.tsx'],
  },
]

const DEFERRED: DeferredEntry[] = [
  {
    id: 'SKL-001',
    pattern: /min-h-\[500px\]/,
    files: ['CalendarView.tsx'],
    reason: 'Structural skeleton — layout-specific 7-column calendar grid',
  },
]

const CPS_PATTERNS: Array<{ pattern: RegExp; id: string }> = [
  {
    id: 'CPS-001',
    pattern: /<Spinner[\s/>]/g,
  },
]

const SUPPRESSION_RE = /\/\/\s*architecture-guard-ignore-next-line\s+reason:\s*(.+)/

function parseSuppressions(content: string): Map<number, string> {
  const lines = content.split('\n')
  const suppressed = new Map<number, string>()
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(SUPPRESSION_RE)
    if (match) {
      suppressed.set(i + 2, match[1].trim())
    }
  }
  return suppressed
}

/* ------------------------------------------------------------------ */
/*  File discovery                                                     */
/* ------------------------------------------------------------------ */

function discoverFiles(dir: string, extensions: string[] = ['.tsx', '.ts']): string[] {
  const results: string[] = []

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
        walk(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (extensions.includes(ext)) {
          results.push(fullPath)
        }
      }
    }
  }

  walk(dir)
  return results.sort()
}

/* ------------------------------------------------------------------ */
/*  Scanner: Colors                                                    */
/* ------------------------------------------------------------------ */

const TAILWIND_ARBITRARY_COLOR_RE = /\b(bg|text|border|ring|outline|decoration|accent|caret)-\[(#[\dA-Fa-f]{3,8}|rgba?\([^)]+\)|hsl\([^)]+\))\]/g

const INLINE_HEX_RE = /(color|backgroundColor|borderColor|background):\s*['"`]?(#[\dA-Fa-f]{3,8}|rgba?\([^)]+\))['"`]?/g

function isOVSAllowed(fileName: string, content: string): string | null {
  for (const entry of OVS_WHITELIST) {
    const fileMatch = entry.files.some((f) => fileName.endsWith(f))
    if (fileMatch && entry.pattern.test(content)) {
      return entry.id
    }
  }
  return null
}

function isDeferred(fileName: string, content: string): DeferredEntry | null {
  for (const entry of DEFERRED) {
    const fileMatch = entry.files.some((f) => fileName.endsWith(f))
    if (fileMatch && entry.pattern.test(content)) {
      return entry
    }
  }
  return null
}

function scanColors(content: string, filePath: string): Finding[] {
  const findings: Finding[] = []
  const fileName = path.basename(filePath)

  const ovsId = isOVSAllowed(fileName, content)
  const deferred = isDeferred(fileName, content)

  if (ovsId) {
    return [
      {
        category: 'ALLOWED_OVS',
        confidence: 'high',
        file: filePath,
        line: 1,
        reason: `${ovsId}: ${getOVSDescription(ovsId)}`,
        detail: 'Allowed by OVS Registry — intentional operational visual system',
      },
    ]
  }

  if (deferred) {
    return [
      {
        category: 'DEFERRED_BY_DESIGN',
        confidence: 'medium',
        file: filePath,
        line: 1,
        reason: deferred.reason,
        detail: 'Intentionally preserved',
      },
    ]
  }

  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    TAILWIND_ARBITRARY_COLOR_RE.lastIndex = 0
    let match
    while ((match = TAILWIND_ARBITRARY_COLOR_RE.exec(line)) !== null) {
      const full = match[0]
      findings.push({
        category: 'WARN',
        confidence: 'medium',
        file: filePath,
        line: lineNum,
        reason: `Tailwind arbitrary color: ${full}`,
        detail: 'Replace with token from useThemeColors() or register as OVS exception',
      })
    }

    INLINE_HEX_RE.lastIndex = 0
    let hexMatch
    while ((hexMatch = INLINE_HEX_RE.exec(line)) !== null) {
      const full = hexMatch[0]
      const val = hexMatch[2]
      if (val.startsWith('#FFF') || val.startsWith('#000') || val.startsWith('rgba')) {
        const isWhite = val === '#FFFFFF' || val.startsWith('rgba(255,255,255')
        const isBlack = val === '#000000' || val.startsWith('rgba(0,0,0,')
        if (isWhite || isBlack || val === '#FFF' || val === '#000') continue
      }
      findings.push({
        category: 'CRITICAL',
        confidence: 'high',
        file: filePath,
        line: lineNum,
        reason: `Hardcoded color value: ${val}`,
        detail: `Replace with token from useThemeColors() — inline style with ${full}`,
      })
    }
  }

  return findings
}

function getOVSDescription(id: string): string {
  const map: Record<string, string> = {
    'OVS-001': 'Workload Semaphore (WORKLOAD_COLORS)',
    'OVS-002': 'Employee Differentiation Palette (EMPLOYEE_COLORS)',
    'OVS-003': 'Appointment Status Colors (STATUS_CONFIG)',
    'OVS-004': 'Cluster Gradient Borders',
    'OVS-005': 'Temporal Density Pulse (animate-pulse on overloaded)',
    'OVS-006': 'Calendar Empty Day (EmptyDay placeholder)',
  }
  return map[id] ?? id
}

function getLineForMatch(content: string, matchIndex: number): number {
  return content.substring(0, matchIndex).split('\n').length
}

/* ------------------------------------------------------------------ */
/*  Scanner: Primitives                                                */
/* ------------------------------------------------------------------ */

const UI_PRIMITIVES_DIR = /[/\\]ui[/\\]/ // exclude primitives themselves from self-reporting

const PRIMITIVE_PATTERNS: Array<{
  name: string
  pattern: RegExp
  critical: boolean
}> = [
  {
    name: 'Loader2 + animate-spin (manual spinner)',
    pattern: /Loader2.*animate-spin/g,
    critical: true,
  },
  {
    name: 'Manual skeleton animate-pulse not in OVS',
    pattern: /animate-pulse/g,
    critical: false,
  },
]

function isCPSCompliant(content: string): string | null {
  for (const cps of CPS_PATTERNS) {
    if (cps.pattern.test(content)) {
      return cps.id
    }
  }
  return null
}

function scanPrimitives(content: string, filePath: string): Finding[] {
  const findings: Finding[] = []
  const fileName = path.basename(filePath)

  const ovsId = isOVSAllowed(fileName, content)
  if (ovsId) return []
  if (isDeferred(fileName, content)) return []
  if (UI_PRIMITIVES_DIR.test(filePath)) return [] // skip canonical primitives

  const cpsId = isCPSCompliant(content)

  for (const primitive of PRIMITIVE_PATTERNS) {
    primitive.pattern.lastIndex = 0
    let match
    while ((match = primitive.pattern.exec(content)) !== null) {
      const lineNum = getLineForMatch(content, match.index)
      findings.push({
        category: cpsId && primitive.critical ? 'WARN' : primitive.critical ? 'CRITICAL' : 'WARN',
        confidence: primitive.critical ? 'high' : 'heuristic',
        file: filePath,
        line: lineNum,
        reason: `Manual UI primitive: ${primitive.name}`,
        detail: primitive.critical
          ? cpsId
            ? `${cpsId} imported — migrate this usage to the canonical component`
            : 'Use the canonical component from @/components/ui/ instead'
          : 'Consider using the canonical component or verify this is domain-specific',
      })
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  Scanner: Decorative Hover Handlers                                 */
/* ------------------------------------------------------------------ */

function scanHover(content: string, filePath: string): Finding[] {
  const findings: Finding[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
    const lineNum = i + 1

    const hasEnter = line.includes('onMouseEnter') && line.includes('style')
    const hasLeave = nextLine.includes('onMouseLeave') && nextLine.includes('style')

    if (hasEnter && hasLeave) {
      const combined = line + nextLine
      if (combined.includes('stopPropagation') || combined.includes('setShow') || combined.includes('setIs')) {
        continue
      }
      findings.push({
        category: 'WARN',
        confidence: 'medium',
        file: filePath,
        line: lineNum,
        reason: 'Decorative hover handler — use Tailwind hover: classes instead',
        detail: 'onMouseEnter/onMouseLeave pair that only changes appearance should be replaced with hover: variants',
      })
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  Scanner: Canonical Primitives (CPS)                                */
/* ------------------------------------------------------------------ */

function scanCanonicalPrimitives(content: string, filePath: string): Finding[] {
  const findings: Finding[] = []
  if (UI_PRIMITIVES_DIR.test(filePath)) return []

  for (const cps of CPS_PATTERNS) {
    cps.pattern.lastIndex = 0
    let match
    while ((match = cps.pattern.exec(content)) !== null) {
      const lineNum = getLineForMatch(content, match.index)
      findings.push({
        category: 'ALLOWED_CPS',
        confidence: 'high',
        file: filePath,
        line: lineNum,
        reason: `${cps.id}: canonical primitive detected`,
        detail: `${cps.id} usage — replaces manual implementation`,
      })
    }
  }

  return findings
}

/* ------------------------------------------------------------------ */
/*  Output                                                             */
/* ------------------------------------------------------------------ */

interface OutputOptions {
  ci: boolean
  json: boolean
  verbose: boolean
}

function getSummary(allFindings: Finding[]) {
  return {
    ALLOWED_OVS: allFindings.filter((f) => f.category === 'ALLOWED_OVS').length,
    ALLOWED_CPS: allFindings.filter((f) => f.category === 'ALLOWED_CPS').length,
    WARN: allFindings.filter((f) => f.category === 'WARN').length,
    CRITICAL: allFindings.filter((f) => f.category === 'CRITICAL').length,
    DEFERRED: allFindings.filter((f) => f.category === 'DEFERRED_BY_DESIGN').length,
  }
}

function printResults(results: ScannerResult[], options: OutputOptions): void {
  const allFindings = results.flatMap((r) => r.findings)

    if (options.json) {
    const jsonFindings = allFindings.map((f) => ({
      category: f.category,
      confidence: f.confidence,
      file: path.relative(process.cwd(), f.file),
      line: f.line,
      reason: f.reason,
      detail: f.detail,
    }))
    const summary = getSummary(allFindings)
    console.log(JSON.stringify({ findings: jsonFindings, summary }, null, 2))
    return
  }

  const separator = '─'.repeat(74)

  if (options.ci) {
    for (const finding of allFindings) {
      if (finding.category === 'ALLOWED_OVS' || finding.category === 'ALLOWED_CPS') continue
      const level = finding.category === 'CRITICAL' ? 'error' : 'warning'
      const file = path.relative(process.cwd(), finding.file)
      console.log(
        `::${level} file=${file},line=${finding.line},title=${finding.category}::${finding.reason}`,
      )
    }
    return
  }

  let output = '\n'
  output += `┌${separator}┐\n`
  output += `│  ${'ARCHITECTURE GUARD — Prevention Layer Phase 1'.padEnd(72)}│\n`
  output += `│  ${`Scanned: ${results.reduce((s, r) => s + r.findings.length, 0)} findings · ${new Date().toISOString().split('T')[0]}`.padEnd(72)}│\n`
  output += `└${separator}┘\n\n`

  for (const finding of allFindings) {
    if ((finding.category === 'ALLOWED_OVS' || finding.category === 'ALLOWED_CPS') && !options.verbose) continue
    if (finding.category === 'DEFERRED_BY_DESIGN' && !options.verbose) continue

    const icon =
      finding.category === 'ALLOWED_OVS' || finding.category === 'ALLOWED_CPS'
        ? '[✓]'
        : finding.category === 'DEFERRED_BY_DESIGN'
          ? '[~]'
          : finding.category === 'CRITICAL'
            ? '[✗]'
            : '[!]'

    const colorTag =
      finding.category === 'ALLOWED_OVS'
        ? 'ALLOWED_OVS'
        : finding.category === 'ALLOWED_CPS'
          ? 'ALLOWED_CPS'
          : finding.category === 'DEFERRED_BY_DESIGN'
            ? 'DEFERRED'
            : finding.category === 'CRITICAL'
              ? 'CRITICAL'
              : 'WARN'

    const relPath = path.relative(process.cwd(), finding.file)
    output += `  ${icon} ${colorTag}  ${relPath}:${finding.line}\n`
    output += `  ${' '.repeat(icon.length + 1)} Reason: ${finding.reason}\n`
    output += `  ${' '.repeat(icon.length + 1)} Detail: ${finding.detail}\n`
    if (options.verbose) {
      output += `  ${' '.repeat(icon.length + 1)} Confidence: ${finding.confidence}\n`
    }
    output += '\n'
  }

  const summary = getSummary(allFindings)

  output += `${'─'.repeat(50)}\n`
  output += `  Summary: ${summary.ALLOWED_OVS} ALLOWED_OVS · ${summary.ALLOWED_CPS} ALLOWED_CPS · ${summary.WARN} WARN · ${summary.CRITICAL} CRITICAL · ${summary.DEFERRED} DEFERRED\n`
  output += `  ${summary.ALLOWED_OVS + summary.ALLOWED_CPS} allowed · ${summary.WARN + summary.CRITICAL} items need review · ${summary.DEFERRED} deferred\n`

  console.log(output)
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

function main(): void {
  const args = process.argv.slice(2)
  const options: OutputOptions = {
    ci: args.includes('--ci'),
    json: args.includes('--json'),
    verbose: args.includes('--verbose'),
  }

  const srcDir = path.resolve(process.cwd(), 'src')
  if (!fs.existsSync(srcDir)) {
    console.error('Error: src/ directory not found')
    process.exit(1)
  }

  const files = discoverFiles(srcDir)

  const results: ScannerResult[] = [
    { scanner: 'colors', findings: [] },
    { scanner: 'primitives', findings: [] },
    { scanner: 'hover', findings: [] },
    { scanner: 'cps', findings: [] },
  ]

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const suppressedLines = parseSuppressions(content)

    const colorFindings: Finding[] = []
    const primitiveFindings: Finding[] = []
    const hoverFindings: Finding[] = []
    const cpsFindings: Finding[] = []

    try {
      colorFindings.push(...scanColors(content, file))
    } catch (e) {
      process.stderr.write(`[error] colors: ${path.relative(process.cwd(), file)}: ${e}\n`)
    }

    try {
      primitiveFindings.push(...scanPrimitives(content, file))
    } catch (e) {
      process.stderr.write(`[error] primitives: ${path.relative(process.cwd(), file)}: ${e}\n`)
    }

    try {
      hoverFindings.push(...scanHover(content, file))
    } catch (e) {
      process.stderr.write(`[error] hover: ${path.relative(process.cwd(), file)}: ${e}\n`)
    }

    try {
      cpsFindings.push(...scanCanonicalPrimitives(content, file))
    } catch (e) {
      process.stderr.write(`[error] cps: ${path.relative(process.cwd(), file)}: ${e}\n`)
    }

    for (const finding of [...colorFindings, ...primitiveFindings, ...hoverFindings, ...cpsFindings]) {
      const reason = suppressedLines.get(finding.line)
      if (reason) {
        finding.category = 'DEFERRED_BY_DESIGN'
        finding.detail = `Suppressed: ${reason}`
      }
    }

    results[0].findings.push(...colorFindings)
    results[1].findings.push(...primitiveFindings)
    results[2].findings.push(...hoverFindings)
    results[3].findings.push(...cpsFindings)
  }

  printResults(results, options)
}

main()
