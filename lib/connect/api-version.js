// Salesforce API versions ship as `NN.0` (e.g. `61.0`). Heroku Connect's
// supported floor is documented at 32.0; anything below is unsupported and
// not worth a backend round-trip to find out.
const SUPPORTED_FLOOR = 32

const VERSION_RE = /^(\d{2,3})\.0$/

export function isValidApiVersion (value) {
  if (typeof value !== 'string') return false
  const match = value.match(VERSION_RE)
  if (!match) return false
  return Number(match[1]) >= SUPPORTED_FLOOR
}

export function apiVersionFloor () {
  return SUPPORTED_FLOOR
}
