import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = '94019707-e3c0-4bdc-9aac-58d2f06cddd2';
const EMPLOYEE_ID = '56f30a07-c347-4cf5-86aa-a4472782eed7';
const CLIENT_ID = 'e74346a2-a4a1-46c9-9788-874377c4860c';
const SERVICE_ID = '444fc9c2-5e95-49de-a2b6-e9cc07ecc6a2';

let counter = 0;

async function createAppt(status, confirmationStatus, label) {
  counter++;
  const start = new Date(Date.now() + 3600000 * counter);
  const end = new Date(start.getTime() + 3600000);
  const { data, error } = await supabase.from('appointments').insert({
    organization_id: ORG_ID,
    client_id: CLIENT_ID,
    employee_id: EMPLOYEE_ID,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status,
    confirmation_status: confirmationStatus,
    notes: label,
    is_commissionable: true,
    price_adjustment: 0,
  }).select('id').single();
  if (error) throw error;

  await supabase.from('appointment_services').insert({
    appointment_id: data.id,
    service_id: SERVICE_ID,
  });

  return data.id;
}

async function main() {
  console.log('\n=== Creating 5 test appointments for admin "Confirmar Servicio" flow ===\n');

  const ids = [];
  for (let i = 0; i < 5; i++) {
    const id = await createAppt('pending', 'scheduled', `test-shadow-mark-manually-${i + 1}`);
    ids.push(id);
    console.log(`  [#${i + 1}] ${id.slice(0, 8)} - test-shadow-mark-manually-${i + 1}`);
  }

  console.log('\n========================================');
  console.log('  READY FOR MANUAL TESTING');
  console.log('========================================\n');
  console.log('  Login: http://localhost:3000/login');
  console.log('  Email: gedaset877@keecs.com');
  console.log('  Password: 123456\n');
  console.log('  Flow:');
  console.log('    1. Open calendar, click appt -> "Confirmar Servicio"');
  console.log('    2. Go to /confirmations -> "Cobrar"');
  console.log('    3. Repeat x5\n');
  console.log('  After: node test-query-logs.mjs\n');
  console.log('  IDs:', ids.join(', '));

  const fs = await import('fs');
  fs.writeFileSync('./.test-ids.json', JSON.stringify({ ids }));
}

main().catch(console.error);
