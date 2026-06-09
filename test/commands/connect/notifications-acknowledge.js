import { runCommand } from '@heroku-cli/test-utils'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Acknowledge from '../../../commands/connect/notifications/acknowledge.js'

const password = '584151d78d318185'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:notifications:acknowledge', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('acknowledges notifications successfully', async () => {
    const appName = 'fake-app'
    const resourceName = 'connectqa-chocolate-12345'

    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName })
      .reply(200, {
        results: [
          {
            id: 1234,
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, {
        id: 1234,
        resource_name: resourceName,
        region_url: 'https://hc-virginia-qa.herokai.com'
      })

    const acknowledgeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/notifications/acknowledge')
      .query({
        page_size: 1000
      })
      .reply(204)

    const { stdout, stderr } = await runCommand(Acknowledge, ['--app', appName])

    expect(stdout).toBe('')
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
    acknowledgeApi.done()
  })

  it('acknowledges notifications with filters', async () => {
    const appName = 'fake-app'
    const resourceName = 'connectqa-chocolate-12345'

    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName })
      .reply(200, {
        results: [
          {
            id: 1234,
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, {
        id: 1234,
        resource_name: resourceName,
        region_url: 'https://hc-virginia-qa.herokai.com'
      })

    const acknowledgeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/notifications/acknowledge')
      .query({
        page_size: 1000,
        after: '2024-01-01',
        before: '2024-01-31',
        event_type: 'mapping-error'
      })
      .reply(204)

    const { stdout, stderr } = await runCommand(Acknowledge, ['--app', appName, '--after', '2024-01-01', '--before', '2024-01-31', '--event-type', 'mapping-error'])

    expect(stdout).toBe('')
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
    acknowledgeApi.done()
  })

  it('handles API errors correctly', async () => {
    const appName = 'fake-app'
    const resourceName = 'connectqa-chocolate-12345'

    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName })
      .reply(200, {
        results: [
          {
            id: 1234,
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, {
        id: 1234,
        resource_name: resourceName,
        region_url: 'https://hc-virginia-qa.herokai.com'
      })

    const acknowledgeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/notifications/acknowledge')
      .query({
        page_size: 1000
      })
      .reply(400, {
        message: 'Invalid request parameters'
      })

    const { error } = await runCommand(Acknowledge, ['--app', appName])
    expect(error).toBeDefined()
    expect(error.message).toContain('400')

    discoveryApi.done()
    connectionDetailApi.done()
    acknowledgeApi.done()
  })

  it('handles non-204 status codes with generic error', async () => {
    const appName = 'fake-app'
    const resourceName = 'connectqa-chocolate-12345'

    const discoveryApi = nock('https://hc-central-qa.herokai.com/', { headers })
      .get('/connections')
      .query({ app: appName })
      .reply(200, {
        results: [
          {
            id: 1234,
            detail_url: 'https://hc-virginia-qa.herokai.com/connections/1234'
          }
        ]
      })

    const connectionDetailApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/connections/1234')
      .query({ deep: true })
      .reply(200, {
        id: 1234,
        resource_name: resourceName,
        region_url: 'https://hc-virginia-qa.herokai.com'
      })

    const acknowledgeApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .post('/api/v3/connections/1234/notifications/acknowledge')
      .query({
        page_size: 1000
      })
      .reply(500)

    const { error } = await runCommand(Acknowledge, ['--app', appName])
    expect(error).toBeDefined()
    expect(error.message).toContain('500')

    discoveryApi.done()
    connectionDetailApi.done()
    acknowledgeApi.done()
  })
})
