// Salesforce API versions ship as `NN.0` (e.g. `61.0`). Heroku Connect's
// supported floor is documented at 32.0; anything below is unsupported and
// not worth a backend round-trip to find out.
const SUPPORTED_FLOOR = 32

const NUMERIC_RE = /^(\d{2,3})(\.\d+)?$/

export function normalizeApiVersion (value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!NUMERIC_RE.test(trimmed)) return value
  return `${Math.trunc(Number(trimmed))}.0`
}

export function isValidApiVersion (value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!NUMERIC_RE.test(trimmed)) return false
  return Math.trunc(Number(trimmed)) >= SUPPORTED_FLOOR
}

export function apiVersionFloor () {
  return SUPPORTED_FLOOR
}
