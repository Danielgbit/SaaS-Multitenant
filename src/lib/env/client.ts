import { clientSchema, type ClientEnv } from './schema'

const EMPTY_CLIENT_ENV: ClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_BASE_URL: '',
  NEXT_PUBLIC_APP_URL: '',
  NEXT_PUBLIC_FLAG_NEW_WIDGETS: 'false',
  NEXT_PUBLIC_FLAG_STAFF_UTIL: 'false',
}

const raw = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FLAG_NEW_WIDGETS: process.env.NEXT_PUBLIC_FLAG_NEW_WIDGETS,
  NEXT_PUBLIC_FLAG_STAFF_UTIL: process.env.NEXT_PUBLIC_FLAG_STAFF_UTIL,
} satisfies Record<string, string | undefined>

let _clientEnv: ClientEnv

if (process.env.NODE_ENV === 'production') {
  // Production must fail hard on invalid public env.
  // Silent fallback would generate broken browser bundles.
  _clientEnv = clientSchema.parse(raw)
} else {
  const result = clientSchema.safeParse(raw)
  if (!result.success) {
    console.error('[env] Client env validation failed:', result.error.flatten().fieldErrors)
    _clientEnv = EMPTY_CLIENT_ENV
  } else {
    _clientEnv = result.data
  }
}

export const clientEnv = _clientEnv
