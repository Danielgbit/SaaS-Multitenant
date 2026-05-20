const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://oblhpautwsgqalcaoquz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGhwYXV0d3NncWFsY2FvcXV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjMxMTQ4MiwiZXhwIjoyMDg3ODg3NDgyfQ.vp55AhyRAcp0uWuH9V3i9zUIQ9Dj4wZ9sMaxEcMM03w'
);
const orgId = '94019707-e3c0-4bdc-9aac-58d2f06cddd2';

async function setup() {
  console.log('=== PASO 1: SETUP DB ===\n');

  // 1. UPSERT notification_providers with mock via config
  //    Use provider='n8n' (allowed by DB constraint) but config='{"provider":"mock"}'
  const { data: existing } = await supabase
    .from('notification_providers')
    .select('id')
    .eq('organization_id', orgId)
    .eq('channel', 'whatsapp');

  if (existing?.length > 0) {
    const { error: upErr } = await supabase
      .from('notification_providers')
      .update({
        provider: 'n8n',
        is_enabled: true,
        config: { provider: 'mock' },
      })
      .eq('organization_id', orgId)
      .eq('channel', 'whatsapp');
    console.log('UPDATE notification_providers:', upErr || 'OK');
  } else {
    const { error: insErr } = await supabase
      .from('notification_providers')
      .insert({
        organization_id: orgId,
        channel: 'whatsapp',
        provider: 'n8n',
        is_enabled: true,
        config: { provider: 'mock' },
      });
    console.log('INSERT notification_providers:', insErr || 'OK');
  }

  // 2. UPSERT whatsapp_settings (V1 legacy)
  const { data: wsExisting } = await supabase
    .from('whatsapp_settings')
    .select('id')
    .eq('organization_id', orgId);

  if (wsExisting?.length > 0) {
    const { error: wsErr } = await supabase
      .from('whatsapp_settings')
      .update({
        webhook_url: 'mock://webhook',
        api_key: 'mock_key',
        enabled: true,
        reminder_hours_before: 24,
      })
      .eq('organization_id', orgId);
    console.log('UPDATE whatsapp_settings:', wsErr || 'OK');
  } else {
    const { error: wsErr } = await supabase
      .from('whatsapp_settings')
      .insert({
        organization_id: orgId,
        webhook_url: 'mock://webhook',
        api_key: 'mock_key',
        enabled: true,
        reminder_hours_before: 24,
      });
    console.log('INSERT whatsapp_settings:', wsErr || 'OK');
  }

  // 3. UPSERT automation_rules for V2 orchestrator
  const triggers = ['appointment_reminder', 'confirmation_requested', 'appointment_created', 'appointment_cancelled'];
  for (const trigger of triggers) {
    const { data: ruleExisting } = await supabase
      .from('automation_rules')
      .select('id')
      .eq('organization_id', orgId)
      .eq('trigger_event', trigger)
      .eq('channel', 'whatsapp');

    if (ruleExisting?.length > 0) {
      const { error: ruleErr } = await supabase
        .from('automation_rules')
        .update({ is_enabled: true, delay_minutes: 0 })
        .eq('organization_id', orgId)
        .eq('trigger_event', trigger)
        .eq('channel', 'whatsapp');
      console.log('UPDATE rule', trigger, ':', ruleErr || 'OK');
    } else {
      const { error: ruleErr } = await supabase
        .from('automation_rules')
        .insert({
          organization_id: orgId,
          trigger_event: trigger,
          channel: 'whatsapp',
          delay_minutes: 0,
          is_enabled: true,
        });
      console.log('INSERT rule', trigger, ':', ruleErr || 'OK');
    }
  }

  // Verify
  console.log('\n--- VERIFICATION ---');
  const { data: v1 } = await supabase.from('notification_providers').select('*').eq('organization_id', orgId);
  console.log('notification_providers:', JSON.stringify(v1, null, 2));

  const { data: v2 } = await supabase.from('whatsapp_settings').select('*').eq('organization_id', orgId);
  console.log('\nwhatsapp_settings:', JSON.stringify(v2, null, 2));

  const { data: v3 } = await supabase.from('automation_rules').select('*').eq('organization_id', orgId);
  console.log('\nautomation_rules:', JSON.stringify(v3, null, 2));

  const { data: v4 } = await supabase.from('appointments').select('id,status,confirmation_status,start_time').eq('organization_id', orgId).eq('status', 'pending');
  console.log('\npending appointments:', JSON.stringify(v4, null, 2));

  const { data: v5 } = await supabase.from('clients').select('id,name,phone,confirmation_method').eq('organization_id', orgId);
  console.log('\nclients:', JSON.stringify(v5, null, 2));
}

setup().catch(console.error);
