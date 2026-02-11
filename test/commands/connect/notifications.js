'use strict'
/* globals describe beforeEach it */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const notificationsCmd = require('../../../commands/connect/notifications')

const password = 'b3b1b13be4249eaf'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:notifications', () => {
  beforeEach(() => cli.mockConsole())

  it('retrieves unacknowledged notifications for a connection', () => {
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

    return notificationsCmd.run({
      app: appName,
      flags: {},
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to contain', 'mapping-error')
        expect(cli.stdout, 'to contain', 'Failed to sync Account records due to validatio...')
        expect(cli.stdout, 'to contain', 'postgres')
        expect(cli.stdout, 'to contain', 'Database cannot connect')
        expect(cli.stdout, 'to contain', '01/15/2024')
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        notificationsApi.done()
      })
  })

  it('applies filters when provided', () => {
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

    return notificationsCmd.run({
      app: appName,
      flags: {
        after: '2024-01-01',
        before: '2024-01-31',
        'event-type': 'mapping-error'
      },
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to contain', 'mapping-error')
        expect(cli.stdout, 'to contain', 'Failed to sync Account records due to validatio...')
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        notificationsApi.done()
      })
  })

  it('handles empty notifications response', () => {
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

    return notificationsCmd.run({
      app: appName,
      flags: {},
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to contain', 'Event Type')
        expect(cli.stdout, 'to contain', 'Message')
        expect(cli.stdout, 'to contain', 'Created At')
      })
      .then(() => expect(cli.stderr, 'to be empty'))
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        notificationsApi.done()
      })
  })
})

describe('notifications helper functions', () => {
  it('formatDate formats dates correctly', () => {
    const { formatDate } = notificationsCmd
    expect(formatDate('2024-01-15T10:30:00Z'), 'to equal', '01/15/2024, 10:30 AM')
    expect(formatDate(null), 'to equal', '')
    expect(formatDate(undefined), 'to equal', '')
  })

  it('truncateMessage truncates long messages', () => {
    const { truncateMessage } = notificationsCmd
    expect(truncateMessage('Short message'), 'to equal', 'Short message')
    expect(truncateMessage('This is a very long message that should be truncated because it exceeds the maximum length'), 'to equal', 'This is a very long message that should be trun...')
    expect(truncateMessage('Exactly fifty characters in this message here!'), 'to equal', 'Exactly fifty characters in this message here!')
    expect(truncateMessage(null), 'to equal', '')
    expect(truncateMessage(undefined), 'to equal', '')
    expect(truncateMessage('Custom length test', 10), 'to equal', 'Custom ...')
  })
})
