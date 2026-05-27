import { CLIENT_ENV_KEYS, clientSchema, type ClientEnv } from './schema'

const raw = Object.fromEntries(
  CLIENT_ENV_KEYS.map((k) => [k, process.env[k]])
)

let _clientEnv: ClientEnv

if (process.env.NODE_ENV === 'production') {
  _clientEnv = clientSchema.parse(raw)
} else {
  const result = clientSchema.safeParse(raw)
  _clientEnv = result.success ? result.data : ({} as ClientEnv)
}

export const clientEnv = _clientEnv
