const NUMERIC_RE = /^(\d{2,3})(\.\d+)?$/

export function normalizeApiVersion (value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!NUMERIC_RE.test(trimmed)) return null
  return `${Math.trunc(Number(trimmed))}.0`
}
