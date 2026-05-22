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

export function captureError(context: string, error: unknown, metadata?: ErrorMetadata) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    metadata: {
      ...globalMetadata,
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
