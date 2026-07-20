import nock from 'nock'
import {afterEach} from 'vitest'

for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
  delete process.env[key]
}

process.env.NO_PROXY = '*'
process.env.no_proxy = '*'

nock.disableNetConnect()
afterEach(() => nock.cleanAll())

process.env.TZ = 'UTC'
process.env.CI = process.env.CI || '1'
process.stdout.columns = 80
process.stderr.columns = 80
