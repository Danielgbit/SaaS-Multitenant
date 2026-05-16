import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = 'http://localhost:3000';
const ORG_ID = '94019707-e3c0-4bdc-9aac-58d2f06cddd2';

async function queryLogs() {
  const { data } = await supabase
    .from('shadow_validation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

async function main() {
  const ids = JSON.parse(fs.readFileSync('./.test-ids.json', 'utf8'));
  const { pendingIds, cancelIds, edgeId } = ids;

  console.log('=== LAUNCHING BROWSER ===\n');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Login
  console.log('[1/9] Logging in...');
  await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' });
  await page.fill('input[name="email"]', 'sasofah883@dwseal.com');
  await page.fill('input[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/calendar**', { timeout: 15000 });
  console.log('  ✓ Logged in, on calendar\n');

  // 2. Navigate to confirmations
  console.log('[2/9] Navigating to confirmations...');
  await page.goto(`${APP_URL}/confirmations`, { waitUntil: 'networkidle0' });
  console.log('  ✓ On confirmations page\n');

  // First, let me take a screenshot to see what the page looks like
  await page.screenshot({ path: '.test-screenshots/initial.png', fullPage: true });

  // I need to figure out the UI to mark an appointment complete.
  // Let me try navigating to the specific appointment
  const apptId = pendingIds[0];
  console.log(`[3/9] Trying to mark appointment complete: ${apptId}\n`);

  // Look for the appointment in the UI
  try {
    // Try to find and interact with the appointment
    const apptElement = await page.locator(`text=${apptId.substring(0, 8)}`).first();
    if (await apptElement.isVisible({ timeout: 3000 })) {
      console.log('  Found appointment in UI');
      await apptElement.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('  Appointment not visible by ID in UI');
    }
  } catch (e) {
    console.log('  Could not find appointment directly in UI');
  }

  // Take a screenshot to see what's on screen
  await page.screenshot({ path: '.test-screenshots/confirmations-list.png', fullPage: true });
  console.log('  Screenshot saved to .test-screenshots/confirmations-list.png\n');

  // Let me try a different approach - navigate to each appointment's detail page
  // The URL pattern might be /calendar or /confirmations/{id}
  console.log('[4/9] Trying to navigate to appointment detail...');
  await page.goto(`${APP_URL}/confirmations/${apptId}`, { waitUntil: 'networkidle0', timeout: 10000 }).catch(async () => {
    console.log('  Appointment detail page not found, trying different route');
    await page.goto(`${APP_URL}/appointments/${apptId}`, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
      console.log('  Appointment route not found either');
    });
  });
  
  await page.screenshot({ path: '.test-screenshots/appointment-detail.png', fullPage: true });

  // Let me navigate back and look for action buttons
  console.log('[5/9] Looking for mark complete buttons...');
  await page.goto(`${APP_URL}/confirmations`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(3000);
  
  // Find all buttons on the page
  const buttons = await page.locator('button').all();
  console.log(`  Found ${buttons.length} buttons on page`);
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text) console.log(`    Button: "${text.trim()}"`);
  }
  
  await page.screenshot({ path: '.test-screenshots/confirmations-with-buttons.png', fullPage: true });

  // Let me also look at links
  const links = await page.locator('a').all();
  console.log(`  Found ${links.length} links on page`);
  
  console.log('\n=== MANUAL TESTING PAUSED ===\n');
  console.log('The Playwright automation reached this point.');
  console.log('Screenshots are saved for debugging.');
  console.log('\nRecommended next steps:');
  console.log('1. Open http://localhost:3000/confirmations in your browser');
  console.log('2. Log in with sasofah883@dwseal.com / Test1234!');
  console.log('3. Complete the 5 pending appointments via the UI');
  console.log('4. Cancel 2 appointments via the UI');
  console.log('5. Try edge cases');
  console.log('6. Run: node test-query-logs.mjs\n');

  await browser.close();
}

main().catch(err => { console.error('Test error:', err); process.exit(1); });
