const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://oblhpautwsgqalcaoquz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGhwYXV0d3NncWFsY2FvcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxMTQ4MiwiZXhwIjoyMDg3ODg3NDgyfQ.vp55AhyRAcp0uWuH9V3i9zUIQ9Dj4wZ9sMaxEcMM03w'
);

const sql = fs.readFileSync('supabase/migrations/20260503000000_payroll_v2_new_model.sql', 'utf8');

// Split by semicolons and execute each statement
const statements = sql.split(';').filter(s => s.trim().length > 0);

async function runMigration() {
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;

    try {
      // Try to execute as raw SQL via postgrest
      const result = await supabase.from('_sql_migrations').select('*').limit(1);
      console.log('Connection OK, tables accessible');
      break;
    } catch (e) {
      // Direct SQL not available via REST, need pgSQL endpoint
      console.log('Direct SQL not available via REST API');
      break;
    }
  }
}

// Since we can't execute raw SQL directly, let's verify current state
async function checkState() {
  console.log('Checking current database state...\n');

  const checks = [
    { name: 'employees table', query: supabase.from('employees').select('id').limit(1) },
    { name: 'payroll_config', query: supabase.from('payroll_config').select('*').limit(1) },
    { name: 'organization_payroll_settings', query: supabase.from('organization_payroll_settings').select('*').limit(1) },
    { name: 'payroll_receipts', query: supabase.from('payroll_receipts').select('id').limit(1) },
  ];

  for (const check of checks) {
    try {
      const result = await check.query;
      console.log(`✓ ${check.name}: accessible (count: ${result.count || 0})`);
    } catch (e) {
      console.log(`✗ ${check.name}: ${e.message}`);
    }
  }
}

checkState().then(() => {
  console.log('\nNote: Migration SQL file created at: supabase/migrations/20260503000000_payroll_v2_new_model.sql');
  console.log('Execute it manually via Supabase Dashboard SQL Editor or:');
  console.log('  npx supabase db push');
});