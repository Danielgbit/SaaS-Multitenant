const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://oblhpautwsgqalcaoquz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGhwYXV0d3NncWFsY2FvcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxMTQ4MiwiZXhwIjoyMDg3ODg3NDgyfQ.vp55AhyRAcp0uWuH9V3i9zUIQ9Dj4wZ9sMaxEcMM03w'
);

async function main() {
  const orgId = '94019707-e3c0-4bdc-9aac-58d2f06cddd2';

  // Get all columns from appointments
  const { data: colData, error: colErr } = await supabase
    .rpc('get_table_columns', { table_name: 'appointments' });
  
  if (colErr) {
    // Try direct select with limit 1
    const { data: sample } = await supabase.from('appointments').select().limit(1);
    if (sample && sample.length > 0) {
      console.log('=== APPOINTMENT COLUMNS ===');
      console.log(Object.keys(sample[0]).join(', '));
    }
  } else {
    console.log(JSON.stringify(colData, null, 2));
  }

  const { data: apps, error: err } = await supabase
    .from('appointments')
    .select('id, client_id, status, start_time, confirmation_status')
    .eq('organization_id', orgId)
    .order('start_time', { ascending: false })
    .limit(20);

  if (err) { console.log('Error:', err); return; }
  console.log('\n=== ALL CANDELA APPOINTMENTS ===');
  apps.forEach(a => {
    console.log(a.id + ' | ' + a.status + ' | ' + a.confirmation_status + ' | client=' + a.client_id + ' | ' + a.start_time);
  });

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone, confirmation_method')
    .eq('organization_id', orgId);
  console.log('\n=== CLIENTS IN CANDELA ===');
  console.log(JSON.stringify(clients, null, 2));
}

main().catch(console.error);
