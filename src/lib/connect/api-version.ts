const NUMERIC_RE = /^(\d{2,3})(\.\d+)?$/

export function normalizeApiVersion(value: unknown): null | string {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!NUMERIC_RE.test(trimmed)) return null
  return `${Math.trunc(Number(trimmed))}.0`
}
