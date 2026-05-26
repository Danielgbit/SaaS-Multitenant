const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

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
  console.log('\nNOTE: This script cannot execute DDL via REST API.');
  console.log('Run migrations with:  npx supabase db push');
}).catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
