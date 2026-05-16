import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('\n=== SHADOW VALIDATION LOGS ===\n');

  const { data: logs, error } = await supabase
    .from('shadow_validation_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { console.error('Query error:', error); return; }

  console.log(`Total entries: ${logs.length}\n`);

  const byCommand = {};
  for (const log of logs) {
    const cmd = log.command;
    if (!byCommand[cmd]) byCommand[cmd] = { total: 0, drift: 0, snapChanged: 0 };
    byCommand[cmd].total++;
    if (log.drift_detected) byCommand[cmd].drift++;
    if (log.snapshot_changed) byCommand[cmd].snapChanged++;
  }

  console.log('Summary by command:');
  console.log('  Command               Total   Drift   SnapChanged');
  console.log('  ' + '-'.repeat(50));
  for (const [cmd, stats] of Object.entries(byCommand)) {
    console.log(`  ${cmd.padEnd(22)} ${String(stats.total).padStart(5)} ${String(stats.drift).padStart(7)} ${String(stats.snapChanged).padStart(13)}`);
  }

  const drifted = logs.filter(l => l.drift_detected);
  if (drifted.length > 0) {
    console.log('\n--- DRIFT DETAILS ---\n');
    for (const log of drifted) {
      console.log(`  [${log.created_at}] ${log.command}`);
      console.log(`    Appointment: ${log.appointment_id}`);
      console.log(`    Legacy:    ${JSON.stringify(log.legacy_result)}`);
      console.log(`    Orchestrator: ${JSON.stringify(log.orchestrator_result)}`);
      console.log(`    Detail:    ${JSON.stringify(log.drift_detail)}`);
      console.log('');
    }
  }

  // Classification
  console.log('\n=== CLASSIFICATION ===\n');
  for (const log of logs) {
    if (!log.drift_detected) {
      console.log(`  ✅ [${log.command}] No drift — model matches legacy`);
      continue;
    }
    const detail = log.drift_detail || [];
    for (const d of detail) {
      const legacy = d.legacy;
      const orchestrator = d.orchestrator;
      // Heuristic classification
      if (legacy === undefined || legacy === null) {
        console.log(`  🔶 [${log.command}] Operational exception: field '${d.field}' missing in legacy result`);
      } else if (String(legacy) === String(orchestrator)) {
        console.log(`  ❓ [${log.command}] Observability noise: values match but drift flagged`);
      } else if (legacy === 'completed' && orchestrator === 'confirmed') {
        console.log(`  🔴 [${log.command}] Model gap: legacy goes to 'completed', orchestrator expected 'confirmed'`);
      } else if (legacy === 'cancelled' && orchestrator !== 'cancelled') {
        console.log(`  🔴 [${log.command}] Real bug or race condition: cancelled unexpectedly`);
      } else {
        console.log(`  🔶 [${log.command}] Unclassified: ${d.field} legacy=${legacy} orchestrator=${orchestrator}`);
      }
    }
    if (detail.length === 0) {
      console.log(`  🤷 [${log.command}] Drift flagged but no detail`);
    }
  }

  console.log('\n');
}

main().catch(console.error);
