import nock from 'nock'
import { afterEach } from 'vitest'

nock.disableNetConnect()
afterEach(() => nock.cleanAll())

process.env.TZ = 'UTC'
process.env.CI = process.env.CI || '1'
process.stdout.columns = 80
process.stderr.columns = 80
