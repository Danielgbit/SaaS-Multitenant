type LogLevel = 'info' | 'warn' | 'error'

function normalizeMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata) return undefined

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (value instanceof Error) {
        return [
          key,
          {
            message: value.message,
            stack: value.stack,
            name: value.name,
          },
        ]
      }

      return [key, value]
    })
  )
}

export function appLog(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...normalizeMetadata(metadata),
  }

  try {
    const serialized = JSON.stringify(payload)

    if (level === 'error') console.error(serialized)
    else if (level === 'warn') console.warn(serialized)
    else console.log(serialized)
  } catch (serializationError) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'appLog serialization failed',
        originalMessage: message,
        serializationError:
          serializationError instanceof Error
            ? serializationError.message
            : String(serializationError),
      })
    )
  }
}
