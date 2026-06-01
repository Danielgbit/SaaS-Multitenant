interface ErrorMetadata {
  route?: string
  userId?: string
  organizationId?: string
  component?: string
  action?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  context: string
  message: string
  stack?: string
  metadata?: ErrorMetadata
}

let globalMetadata: Partial<ErrorMetadata> = {}

export function setGlobalErrorMetadata(metadata: Partial<ErrorMetadata>) {
  globalMetadata = { ...globalMetadata, ...metadata }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; details?: string; hint?: string; code?: string }

    if (typeof err.message === 'string') {
      return err.message
    }

    try {
      return JSON.stringify(error)
    } catch {
      return '[unserializable error object]'
    }
  }

  return String(error)
}

function getErrorMetadata(error: unknown): Record<string, unknown> {
  if (typeof error === 'object' && error !== null) {
    const err = error as { details?: string; hint?: string; code?: string }
    const result: Record<string, unknown> = {}

    if (err.code) result.code = err.code
    if (err.details) result.details = err.details
    if (err.hint) result.hint = err.hint

    return result
  }

  return {}
}

export function captureError(context: string, error: unknown, metadata?: ErrorMetadata) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    context,
    message: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    metadata: {
      ...globalMetadata,
      ...getErrorMetadata(error),
      ...metadata,
    },
  }

  console.error(`[error:${context}]`, JSON.stringify(entry, null, 2))

  return entry
}

export function captureWarning(context: string, message: string, metadata?: ErrorMetadata) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    context,
    message,
    metadata: {
      ...globalMetadata,
      ...metadata,
    },
  }

  console.warn(`[warning:${context}]`, JSON.stringify(entry, null, 2))

  return entry
}
