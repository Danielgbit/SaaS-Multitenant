import { readdirSync, writeFileSync, existsSync, statSync, readFileSync } from 'fs'
import { join, relative, extname, parse } from 'path'

const ROOT = join(__dirname, '..')
const DOCS_AUTO = join(ROOT, 'docs', 'auto-generated')

// ──────────────────────────────────────────────
// Configuration — banned patterns for drift detection
// ──────────────────────────────────────────────
const bannedPatterns = [
  '44 migrations',
  '44 migraciones',
  '21 actions',
  '21 módulos',
  'Cormorant',
  'Jakarta',
]

const bannedExcludePaths = [
  'docs/audits/',
  'docs/archive/',
  'docs/decisions/005-system-inventory-authority.md',
  'docs/architecture/CURRENT/SYSTEM_INVENTORY.md',
  'docs/governance/ARCHITECTURE_SNAPSHOT.md',
  'docs/operations/DEPLOYMENT.md',
]

const requiredSections = [
  'Métricas Rápidas',
  'Stack Tecnológico',
  'Mapa de Rutas',
  'Schema de Base de Datos',
  'Drift Documental Detectado',
]

const SYSTEM_INVENTORY_PATH = 'docs/architecture/CURRENT/SYSTEM_INVENTORY.md'

// ──────────────────────────────────────────────
// Validate mode
// ──────────────────────────────────────────────
const isValidateMode = process.argv.includes('--validate')
if (isValidateMode) {
  const exitCode = runValidate()
  process.exit(exitCode)
}

interface ValidationResult {
  id: string
  severity: 'ERROR' | 'WARN'
  message: string
}

function runValidate(): number {
  const results: ValidationResult[] = []

  results.push(...validateLinks())
  results.push(...validateFreshness())
  results.push(...validateBannedPatterns())
  results.push(...validateADRs())
  results.push(...validateRequiredSections())
  results.push(...validateNoDuplicates())
  results.push(...validateADRNumbering())

  // Sort: ERRORs first, then WARNs, then PASS
  const sortOrder = { ERROR: 0, WARN: 1, PASS: 2 }
  results.sort((a, b) => sortOrder[a.severity as keyof typeof sortOrder] - sortOrder[b.severity as keyof typeof sortOrder])

  const errors = results.filter(r => r.severity === 'ERROR')
  const warns = results.filter(r => r.severity === 'WARN')

  console.log(`\nDocumentation Validation Report`)
  console.log(`===============================`)
  console.log(`ERRORS: ${errors.length}, WARNINGS: ${warns.length}\n`)

  for (const r of results) {
    if (r.severity === 'PASS') {
      console.log(`✅ ${r.id} — ${r.message}`)
    } else if (r.severity === 'WARN') {
      console.log(`⚠️  ${r.id} — ${r.message}`)
    } else {
      console.log(`❌ ${r.id} — ${r.message}`)
    }
  }

  console.log()
  return errors.length > 0 ? 1 : 0
}

function generateMigrationsIndex(): string {
  const migrationsDir = join(ROOT, 'supabase', 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  const header = `# Migrations Index

> AUTO-GENERATED — DO NOT EDIT MANUALLY
> Regenerar con: \`pnpm docs:gen\`
> Generated: ${new Date().toISOString().split('T')[0]}

Total: ${files.length} migrations

| File | Description |
|------|-------------|
`

  const rows = files.map(f => {
    const name = f.replace('.sql', '')
    const readable = name
      .replace(/^\d{14}_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    return `| \`${f}\` | ${readable} |`
  }).join('\n')

  return header + rows
}

function generateCronIndex(): string {
  const cronDir = join(ROOT, 'src', 'app', 'api', 'cron')
  let cronDirs: string[]
  try {
    cronDirs = readdirSync(cronDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  } catch {
    cronDirs = []
  }

  const header = `# Cron Endpoints Index

> AUTO-GENERATED — DO NOT EDIT MANUALLY
> Regenerar con: \`pnpm docs:gen\`
> Generated: ${new Date().toISOString().split('T')[0]}

| Endpoint | Route File |
|----------|------------|
`

  const rows = cronDirs.map(d =>
    `| \`/api/cron/${d}\` | \`src/app/api/cron/${d}/route.ts\` |`
  ).join('\n')

  return header + rows
}

function generateRoutesIndex(): string {
  const appDir = join(ROOT, 'src', 'app')
  const routes: string[] = []

  function walk(dir: string, prefix: string) {
    let entries: string[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
        .filter(d => d.isDirectory() || (d.isFile() && (d.name === 'page.tsx' || d.name === 'route.ts')))
        .map(d => d.name)
    } catch { return }

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const isDir = entry.startsWith('(') || entry.startsWith('[') || entry.endsWith('}')

      if (entry === 'page.tsx') {
        const route = prefix || '/'
        routes.push(route)
      } else if (entry === 'route.ts') {
        routes.push(prefix)
      } else if (entry.startsWith('(')) {
        // Route group, skip in path
        walk(fullPath, prefix)
      } else if (entry.startsWith('[')) {
        const param = entry.replace(/\[(.*)\]/, '{$1}')
        walk(fullPath, `${prefix}/${param}`)
      } else if (entry.endsWith('}')) {
        // dynamic folder, add param
        walk(fullPath, prefix)
      } else if (!entry.includes('.')) {
        walk(fullPath, `${prefix}/${entry}`)
      }
    }
  }

  walk(appDir, '')
  routes.sort()

  const header = `# App Router Routes

> AUTO-GENERATED — DO NOT EDIT MANUALLY
> Regenerar con: \`pnpm docs:gen\`
> Generated: ${new Date().toISOString().split('T')[0]}

| Route | Type |
|-------|------|
`

  const rows = routes.map(r => {
    const type = r.startsWith('/api/') ? 'API' : 'Page'
    return `| \`${r || '/'}\` | ${type} |`
  }).join('\n')

  return header + rows
}

// ──────────────────────────────────────────────
// V001 — Links in INDEX.md resolve to real files
// ──────────────────────────────────────────────
function validateLinks(): ValidationResult[] {
  const results: ValidationResult[] = []
  const indexPath = join(ROOT, 'docs', 'INDEX.md')

  if (!existsSync(indexPath)) {
    results.push({ id: 'V001', severity: 'ERROR', message: 'docs/INDEX.md not found' })
    return results
  }

  const content = readFileSync(indexPath, 'utf-8')
  // Match paths in backticks that end with .md
  const linkRegex = /`((?:docs|\.agents)\/[^`]+\.md)`/g
  let match: RegExpExecArray | null
  const seen = new Map<string, number>()
  const broken: string[] = []

  while ((match = linkRegex.exec(content)) !== null) {
    const ref = match[1]
    seen.set(ref, (seen.get(ref) || 0) + 1)
    const fullPath = join(ROOT, ref)

    if (!existsSync(fullPath)) {
      broken.push(ref)
      continue
    }

    const stat = statSync(fullPath)
    if (!stat.isFile()) {
      broken.push(`${ref} (exists but is not a file)`)
      continue
    }

    if (extname(ref) !== '.md') {
      broken.push(`${ref} (not a .md file)`)
      continue
    }
  }

  if (broken.length > 0) {
    results.push({
      id: 'V001',
      severity: 'ERROR',
      message: `${broken.length} broken reference(s) found:\n${broken.map(p => `  - ${p}`).join('\n')}`,
    })
  } else {
    results.push({ id: 'V001', severity: 'PASS', message: `${seen.size} references verified` })
  }

  return results
}

// ──────────────────────────────────────────────
// V002 — SYSTEM_INVENTORY freshness
// ──────────────────────────────────────────────
function validateFreshness(): ValidationResult[] {
  const results: ValidationResult[] = []
  const fullPath = join(ROOT, SYSTEM_INVENTORY_PATH)

  if (!existsSync(fullPath)) {
    results.push({ id: 'V002', severity: 'ERROR', message: `${SYSTEM_INVENTORY_PATH} not found` })
    return results
  }

  const content = readFileSync(fullPath, 'utf-8')
  const dateMatch = content.match(/^> Generated:\s*(\d{4}-\d{2}-\d{2})/m)

  if (!dateMatch) {
    results.push({ id: 'V002', severity: 'ERROR', message: 'No "Generated:" date found in SYSTEM_INVENTORY' })
    return results
  }

  const generatedDate = new Date(dateMatch[1])
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays > 90) {
    results.push({ id: 'V002', severity: 'ERROR', message: `${SYSTEM_INVENTORY_PATH} generated ${diffDays} days ago (>90 day threshold)` })
  } else if (diffDays > 30) {
    results.push({ id: 'V002', severity: 'WARN', message: `${SYSTEM_INVENTORY_PATH} generated ${diffDays} days ago (31-90 day window)` })
  } else {
    results.push({ id: 'V002', severity: 'PASS', message: `${diffDays} days since last generation` })
  }

  return results
}

// ──────────────────────────────────────────────
// V003 — Banned drift patterns
// ──────────────────────────────────────────────
function validateBannedPatterns(): ValidationResult[] {
  const results: ValidationResult[] = []

  function isExcluded(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/')
    return bannedExcludePaths.some(ex => normalized.includes(ex))
  }

  function collectMdFiles(dir: string): string[] {
    const files: string[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          files.push(...collectMdFiles(fullPath))
        } else if (entry.name.endsWith('.md') && !isExcluded(fullPath)) {
          files.push(fullPath)
        }
      }
    } catch { /* skip unreadable dirs */ }
    return files
  }

  const docsFiles = collectMdFiles(join(ROOT, 'docs'))
  const agentsFiles = collectMdFiles(join(ROOT, '.agents'))
  const allFiles = [...docsFiles, ...agentsFiles]

  const findings: string[] = []

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8')
    const relativePath = relative(ROOT, file).replace(/\\/g, '/')
    for (const pattern of bannedPatterns) {
      if (content.includes(pattern)) {
        const lineNum = content.split('\n').findIndex(l => l.includes(pattern)) + 1
        findings.push(`"${pattern}" in ${relativePath}:${lineNum}`)
      }
    }
  }

  if (findings.length > 0) {
    results.push({
      id: 'V003',
      severity: 'ERROR',
      message: `${findings.length} banned pattern(s) found:\n${findings.map(f => `  - ${f}`).join('\n')}`,
    })
  } else {
    results.push({ id: 'V003', severity: 'PASS', message: 'no banned patterns found' })
  }

  return results
}

// ──────────────────────────────────────────────
// V004 — ADRs referenced in INDEX.md exist
// ──────────────────────────────────────────────
function validateADRs(): ValidationResult[] {
  const results: ValidationResult[] = []
  const indexPath = join(ROOT, 'docs', 'INDEX.md')

  if (!existsSync(indexPath)) {
    results.push({ id: 'V004', severity: 'ERROR', message: 'docs/INDEX.md not found' })
    return results
  }

  const content = readFileSync(indexPath, 'utf-8')
  const adrRegex = /`(docs\/decisions\/\d+-[^`]+\.md)`/g
  let match: RegExpExecArray | null
  const broken: string[] = []

  while ((match = adrRegex.exec(content)) !== null) {
    const ref = match[1]
    const fullPath = join(ROOT, ref)
    if (!existsSync(fullPath)) {
      broken.push(ref)
    }
  }

  if (broken.length > 0) {
    results.push({
      id: 'V004',
      severity: 'ERROR',
      message: `${broken.length} ADR(s) referenced but not found:\n${broken.map(p => `  - ${p}`).join('\n')}`,
    })
  } else {
    results.push({ id: 'V004', severity: 'PASS', message: 'all ADRs exist' })
  }

  return results
}

// ──────────────────────────────────────────────
// V005 — Required sections in SYSTEM_INVENTORY
// ──────────────────────────────────────────────
function validateRequiredSections(): ValidationResult[] {
  const results: ValidationResult[] = []
  const fullPath = join(ROOT, SYSTEM_INVENTORY_PATH)

  if (!existsSync(fullPath)) {
    results.push({ id: 'V005', severity: 'ERROR', message: `${SYSTEM_INVENTORY_PATH} not found` })
    return results
  }

  const content = readFileSync(fullPath, 'utf-8')
  const missing: string[] = []

  for (const section of requiredSections) {
    // Match flexible format: "## N. Section Name [TAG]" or "## Section Name"
    const sectionRegex = new RegExp(`^##\\s+\\d*\\.?\\s*${escapeRegex(section)}(?:\\s+\\[\\w+\\])?`, 'm')
    if (!sectionRegex.test(content)) {
      missing.push(section)
    }
  }

  if (missing.length > 0) {
    results.push({
      id: 'V005',
      severity: 'ERROR',
      message: `${missing.length} required section(s) missing:\n${missing.map(s => `  - ${s}`).join('\n')}`,
    })
  } else {
    results.push({ id: 'V005', severity: 'PASS', message: 'all required sections present' })
  }

  return results
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ──────────────────────────────────────────────
// V006 — Duplicate entries in INDEX.md
// ──────────────────────────────────────────────
function validateNoDuplicates(): ValidationResult[] {
  const results: ValidationResult[] = []
  const indexPath = join(ROOT, 'docs', 'INDEX.md')

  if (!existsSync(indexPath)) {
    results.push({ id: 'V006', severity: 'WARN', message: 'docs/INDEX.md not found' })
    return results
  }

  const content = readFileSync(indexPath, 'utf-8')
  const linkRegex = /`((?:docs|\.agents)\/[^`]+\.md)`/g
  let match: RegExpExecArray | null
  const counts = new Map<string, number>()

  while ((match = linkRegex.exec(content)) !== null) {
    const ref = match[1]
    counts.set(ref, (counts.get(ref) || 0) + 1)
  }

  const duplicates = Array.from(counts.entries()).filter(([, count]) => count > 1)

  if (duplicates.length > 0) {
    results.push({
      id: 'V006',
      severity: 'WARN',
      message: `${duplicates.length} duplicate entry(ies):\n${duplicates.map(([ref, count]) => `  - ${ref} (${count}x)`).join('\n')}`,
    })
  } else {
    results.push({ id: 'V006', severity: 'PASS', message: 'no duplicates' })
  }

  return results
}

// ──────────────────────────────────────────────
// V007 — ADR numbering consistency
// ──────────────────────────────────────────────
function validateADRNumbering(): ValidationResult[] {
  const results: ValidationResult[] = []
  const decisionsDir = join(ROOT, 'docs', 'decisions')

  if (!existsSync(decisionsDir)) {
    results.push({ id: 'V007', severity: 'WARN', message: 'docs/decisions/ not found' })
    return results
  }

  const files = readdirSync(decisionsDir)
    .filter(f => /^\d{3}-.+\.md$/.test(f))
    .sort()

  const numbers = files.map(f => parseInt(f.slice(0, 3), 10))
  const expected = Array.from({ length: numbers.length }, (_, i) => i + 1)
  const missing: number[] = []

  for (const num of expected) {
    if (!numbers.includes(num)) {
      missing.push(num)
    }
  }

  if (missing.length > 0) {
    results.push({
      id: 'V007',
      severity: 'WARN',
      message: `ADR numbering gap(s): ${missing.map(n => `ADR-${String(n).padStart(3, '0')}`).join(', ')}`,
    })
  } else {
    results.push({ id: 'V007', severity: 'PASS', message: `ADR-001 to ADR-${String(numbers.length).padStart(3, '0')} sequential` })
  }

  return results
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
function main() {
  const banner = '> AUTO-GENERATED — DO NOT EDIT MANUALLY\n> Regenerar con: `pnpm docs:gen`\n'

  // Migrations
  writeFileSync(join(DOCS_AUTO, 'migrations-index.md'), generateMigrationsIndex())
  console.log('✓ docs/auto-generated/migrations-index.md')

  // Cron
  writeFileSync(join(DOCS_AUTO, 'cron-index.md'), generateCronIndex())
  console.log('✓ docs/auto-generated/cron-index.md')

  // Routes
  writeFileSync(join(DOCS_AUTO, 'routes.md'), generateRoutesIndex())
  console.log('✓ docs/auto-generated/routes.md')

  console.log(`\nGenerated at ${new Date().toISOString()}`)
}

main()
