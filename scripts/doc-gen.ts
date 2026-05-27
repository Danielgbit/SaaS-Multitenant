import { readdirSync, writeFileSync } from 'fs'
import { join, relative } from 'path'

const ROOT = join(__dirname, '..')
const DOCS_AUTO = join(ROOT, 'docs', 'auto-generated')

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
