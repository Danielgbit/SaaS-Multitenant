export function toCamelCase<T = Record<string, unknown>>(
  row: Record<string, unknown> | null | undefined
): T {
  if (!row) return {} as T

  const result: Record<string, unknown> = {}

  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = row[key]
  }

  return result as T
}

export function toCamelCaseArray<T = Record<string, unknown>>(
  rows: Record<string, unknown>[] | null | undefined
): T[] {
  if (!rows) return []
  return rows.map((row) => toCamelCase<T>(row))
}
