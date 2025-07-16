import nock from 'nock'
import mockdate from 'mockdate'

globalThis.setInterval = () => ({unref: () => {}})
const tm = globalThis.setTimeout
globalThis.setTimeout = cb => {
  return tm(cb)
}

process.env.TZ = 'UTC'
process.stdout.columns = 120 // Set screen width for consistent wrapping
process.stderr.columns = 120 // Set screen width for consistent wrapping

nock.disableNetConnect()
mockdate.set(new Date())
