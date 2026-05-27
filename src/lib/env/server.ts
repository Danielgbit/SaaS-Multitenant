import 'server-only'
import { appLog } from '@/lib/app-logger'
import { SERVER_ENV_KEYS, serverSchema } from './schema'

const raw = Object.fromEntries(
  SERVER_ENV_KEYS.map((k) => [k, process.env[k]])
)

export const serverEnv = serverSchema.parse(raw)

if (process.env.NEXT_PHASE !== 'phase-production-build') {
  appLog('info', 'env validation passed', {
    flow: 'env',
    operation: 'validation',
    serverVars: SERVER_ENV_KEYS.length,
  })
}
