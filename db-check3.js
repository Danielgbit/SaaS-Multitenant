const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://oblhpautwsgqalcaoquz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGhwYXV0d3NncWFsY2FvcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxMTQ4MiwiZXhwIjoyMDg3ODg3NDgyfQ.vp55AhyRAcp0uWuH9V3i9zUIQ9Dj4wZ9sMaxEcMM03w'
);

async function main() {
  const apptId = 'ed9a5c8f-d869-4fd0-98f8-06031d136481';

  // Check full appointment with all relationships
  const { data: appt, error: err } = await supabase
    .from('appointments')
    .select(`
      *,
      clients!inner(*),
      employees!inner(*)
    `)
    .eq('id', apptId)
    .single();

  if (err) {
    console.log('Error fetching appointment:', err);
    return;
  }
  console.log('=== APPOINTMENT DETAILS ===');
  console.log(JSON.stringify(appt, null, 2));

  // Check appointment_services
  const { data: apptSvcs } = await supabase
    .from('appointment_services')
    .select('*')
    .eq('appointment_id', apptId);
  console.log('\n=== APPOINTMENT SERVICES ===');
  console.log(JSON.stringify(apptSvcs, null, 2));

  // Check notification templates exist for whatsapp
  const { data: templates } = await supabase
    .from('notification_templates')
    .select('id, channel, type, name')
    .eq('channel', 'whatsapp')
    .limit(5);
  console.log('\n=== NOTIFICATION TEMPLATES (whatsapp) ===');
  console.log(JSON.stringify(templates, null, 2));
}

main().catch(console.error);
