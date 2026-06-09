import { runCommand } from '@heroku-cli/test-utils'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Notifications, { formatDate, truncateMessage } from '../../../commands/connect/notifications/index.js'

const password = 'b3b1b13be4249eaf'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:notifications', () => {
  beforeEach(() => {
    process.env.HEROKU_API_KEY = password
  })

  afterEach(() => {
    delete process.env.HEROKU_API_KEY
  })

  it('retrieves unacknowledged notifications for a connection', async () => {
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

    const notificationsData = {
      results: [
        {
          id: '5678',
          event_type: 'mapping-error',
          message: 'Failed to sync Account records due to validation error',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '9101',
          event_type: 'postgres-connection',
          message: 'Database cannot connect',
          created_at: '2024-01-15T09:45:00Z'
        }
      ]
    }

    const notificationsApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/notifications')
      .query({
        page_size: 1000
      })
      .reply(200, notificationsData)

    const { stdout, stderr } = await runCommand(Notifications, ['--app', appName])

    expect(stdout).toContain('mapping-error')
    expect(stdout).toContain('Failed to sync Account records due to validatio...')
    expect(stdout).toContain('postgres')
    expect(stdout).toContain('Database cannot connect')
    expect(stdout).toContain('01/15/2024')
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
    notificationsApi.done()
  })

  it('applies filters when provided', async () => {
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

    const notificationsApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/notifications')
      .query({
        page_size: 1000,
        after: '2024-01-01',
        before: '2024-01-31',
        event_type: 'mapping-error'
      })
      .reply(200, {
        results: [
          {
            id: '5678',
            event_type: 'mapping-error',
            message: 'Failed to sync Account records due to validation error',
            created_at: '2024-01-15T10:30:00Z'
          }
        ]
      })

    const { stdout, stderr } = await runCommand(Notifications, ['--app', appName, '--after', '2024-01-01', '--before', '2024-01-31', '--event-type', 'mapping-error'])

    expect(stdout).toContain('mapping-error')
    expect(stdout).toContain('Failed to sync Account records due to validatio...')
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
    notificationsApi.done()
  })

  it('handles empty notifications response', async () => {
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

    const notificationsApi = nock('https://hc-virginia-qa.herokai.com/', { headers })
      .get('/api/v3/connections/1234/notifications')
      .query({
        page_size: 1000
      })
      .reply(200, { results: [] })

    const { stdout, stderr } = await runCommand(Notifications, ['--app', appName])

    expect(stdout).toContain('Event Type')
    expect(stdout).toContain('Message')
    expect(stdout).toContain('Created At')
    expect(stderr).toBe('')
    discoveryApi.done()
    connectionDetailApi.done()
    notificationsApi.done()
  })
})

describe('notifications helper functions', () => {
  it('formatDate formats dates correctly', () => {
    expect(formatDate('2024-01-15T10:30:00Z')).toBe('01/15/2024, 10:30 AM')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('truncateMessage truncates long messages', () => {
    expect(truncateMessage('Short message')).toBe('Short message')
    expect(truncateMessage('This is a very long message that should be truncated because it exceeds the maximum length')).toBe('This is a very long message that should be trun...')
    expect(truncateMessage('Exactly fifty characters in this message here!')).toBe('Exactly fifty characters in this message here!')
    expect(truncateMessage(null)).toBe('')
    expect(truncateMessage(undefined)).toBe('')
    expect(truncateMessage('Custom length test', 10)).toBe('Custom ...')
  })
})
