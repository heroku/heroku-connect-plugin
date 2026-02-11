'use strict'
/* globals describe beforeEach it */

const cli = require('@heroku/heroku-cli-util')
const nock = require('nock')
const expect = require('unexpected')
const acknowledgeCmd = require('../../../commands/connect/notifications-acknowledge')

const password = '584151d78d318185'
const headers = {
  'content-type': 'application/json',
  authorization: `Bearer ${password}`,
  'heroku-client': 'cli'
}

describe('connect:notifications:acknowledge', () => {
  beforeEach(() => cli.mockConsole())

  it('acknowledges notifications successfully', () => {
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

    return acknowledgeCmd.run({
      app: appName,
      flags: {},
      auth: {
        password
      }
    }, {})
      .then(() => {
        expect(cli.stdout, 'to be empty')
        expect(cli.stderr, 'to be empty')
      })
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        acknowledgeApi.done()
      })
  })

  it('acknowledges notifications with filters', () => {
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

    return acknowledgeCmd.run({
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
        expect(cli.stdout, 'to be empty')
        expect(cli.stderr, 'to be empty')
      })
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        acknowledgeApi.done()
      })
  })

  it('handles API errors correctly', () => {
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

    return acknowledgeCmd.run({
      app: appName,
      flags: {},
      auth: {
        password
      }
    }, {})
      .then(() => {
        throw new Error('Expected command to throw an error')
      })
      .catch((error) => {
        expect(error.message, 'to contain', '400')
      })
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        acknowledgeApi.done()
      })
  })

  it('handles non-204 status codes with generic error', () => {
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

    return acknowledgeCmd.run({
      app: appName,
      flags: {},
      auth: {
        password
      }
    }, {})
      .then(() => {
        throw new Error('Expected command to throw an error')
      })
      .catch((error) => {
        expect(error.message, 'to contain', '500')
      })
      .then(() => {
        discoveryApi.done()
        connectionDetailApi.done()
        acknowledgeApi.done()
      })
  })
})
