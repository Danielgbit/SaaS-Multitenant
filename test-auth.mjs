import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const session = JSON.parse(fs.readFileSync('./.test-session.json', 'utf8'));

async function main() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Try cookie-based auth
  const cookie = `sb-access-token=${session.access_token}; sb-refresh-token=${session.refresh_token}`;

  const res = await fetch(`${APP_URL}/api/auth/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
    redirect: 'manual',
  });

  console.log('Auth callback status:', res.status);

  // Try headers directly
  const res2 = await fetch(`${APP_URL}/confirmations`, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Cookie': cookie,
    },
    redirect: 'manual',
  });

  console.log('Confirmations status:', res2.status);
  const text = await res2.text();
  console.log('Response length:', text.length);
  if (text.includes('__NEXT_DATA__')) {
    console.log('Got App Shell!');
  }
}

main().catch(console.error);
