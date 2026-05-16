import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test user credentials
const TEST_USER = { email: 'sasofah883@dwseal.com', password: 'Aleja123!' };
const ORG_ID = '94019707-e3c0-4bdc-9aac-58d2f06cddd2';
const EMPLOYEE_ID = '56f30a07-c347-4cf5-86aa-a4472782eed7';
const CLIENT_ID = 'e74346a2-a4a1-46c9-9788-874377c4860c';

let appointmentCounter = 0;

async function createTestAppointment(status = 'pending', confirmation = 'scheduled') {
  appointmentCounter++;
  const now = new Date();
  const start = new Date(now.getTime() + 3600000 * appointmentCounter);
  const end = new Date(start.getTime() + 3600000);

  const { data: appt, error } = await supabase.from('appointments').insert({
    organization_id: ORG_ID,
    client_id: CLIENT_ID,
    employee_id: EMPLOYEE_ID,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    status,
    confirmation_status: confirmation,
    is_commissionable: true,
    price_adjustment: 0,
  }).select('id').single();

  if (error) { console.error('Create appointment error:', error); return null; }

  // Add service
  await supabase.from('appointment_services').insert({
    appointment_id: appt.id,
    service_id: '444fc9c2-5e95-49de-a2b6-e9cc07ecc6a2',
  });

  return appt.id;
}

async function runTests() {
  console.log('\n=== CREATING TEST APPOINTMENTS ===\n');

  // Create 5 pending appointments for completion tests
  const pendingIds = [];
  for (let i = 0; i < 5; i++) {
    const id = await createTestAppointment('pending', 'scheduled');
    if (id) pendingIds.push(id);
    console.log(`  Created pending appointment ${i + 1}: ${id}`);
  }

  // Create 2 appointments for cancellation tests
  const cancelIds = [];
  for (let i = 0; i < 2; i++) {
    const id = await createTestAppointment('pending', 'scheduled');
    if (id) cancelIds.push(id);
    console.log(`  Created cancel appointment ${i + 1}: ${id}`);
  }

  // Create 1 weird edge case: already completed appointment
  const edgeId = await createTestAppointment('completed', 'completed');
  console.log(`  Created edge case (already completed): ${edgeId}`);

  console.log('\n=== LAUNCHING BROWSER ===\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Login
  console.log('  Navigating to login page...');
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('  Logging in...');
  await page.type('input[name="email"]', TEST_USER.email);
  await page.type('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
  console.log('  Logged in!');

  // Navigate to calendar/confirmations
  console.log('  Navigating to calendar...');
  await page.goto(`${APP_URL}/calendar`, { waitUntil: 'networkidle0', timeout: 15000 });

  // Now I need to find how the markCompleted flow works in the UI
  // Let me save the appointment IDs and pause
  console.log('\n=== TEST APPOINTMENTS READY ===');
  console.log('  Pending app IDs for completion:', JSON.stringify(pendingIds));
  console.log('  Cancel app IDs:', JSON.stringify(cancelIds));
  console.log('  Edge case ID:', edgeId);
  console.log('\n  Open the browser to perform manual testing.');
  console.log('  The appointments are created and ready.\n');

  // Keep browser open for manual testing
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  // After tests, query shadow logs
  console.log('\n=== QUERYING SHADOW LOGS ===\n');
  
  const { data: logs, error } = await supabase
    .from('shadow_validation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error querying shadow logs:', error);
  } else {
    console.log(`Found ${logs.length} shadow log entries:\n`);
    for (const log of logs) {
      console.log(`  [${log.created_at}] command=${log.command} drift=${log.drift_detected} snapChanged=${log.snapshot_changed}`);
      if (log.drift_detected) {
        console.log(`    drift_detail: ${JSON.stringify(log.drift_detail)}`);
      }
    }
  }

  await browser.close();
}

runTests().catch(err => { console.error('Test failed:', err); process.exit(1); });
