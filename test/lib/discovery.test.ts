import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'

import {requestAppAccess, searchConnections} from '../../src/lib/discovery'
import {
  emptyConnectionResponse,
  singleConnectionAppAccessResponse,
  singleConnectionResponse,
} from '../support/test-fixtures'

describe('discovery lib functions', function () {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(function () {
    originalEnv = process.env
  })

  afterEach(function () {
    nock.cleanAll()
    process.env = originalEnv
  })

  describe('searchConnections', function () {
    it('fetches and returns a list of connections', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)

      const api = nock('https://hc-central.heroku.com')
        .get('/connections?app=my-app')
        .reply(200, singleConnectionResponse)

      const connections = await searchConnections(apiClient, 'my-app')
      expect(connections).to.deep.equal(singleConnectionResponse)
      api.done()
    })

    it('respects the CONNECT_DISCOVERY_SERVER environment variable', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)
      process.env = {
        ...originalEnv,
        CONNECT_DISCOVERY_SERVER: 'https://custom-discovery-server.heroku.com',
      }

      const api = nock('https://custom-discovery-server.heroku.com')
        .get('/connections?app=my-app')
        .reply(200, singleConnectionResponse)

      const connections = await searchConnections(apiClient, 'my-app')
      expect(connections).to.deep.equal(singleConnectionResponse)
      api.done()
    })

    it('respects the CONNECT_ADDON environment variable', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)
      process.env = {
        ...originalEnv,
        CONNECT_ADDON: 'connectqa',
      }

      const api = nock('https://hc-central-qa.herokai.com')
        .get('/connections?app=my-app')
        .reply(200, singleConnectionResponse)

      const connections = await searchConnections(apiClient, 'my-app')
      expect(connections).to.deep.equal(singleConnectionResponse)
      api.done()
    })

    it('fetches and returns an empty list when the resourceName parameter does not exist', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)

      const api = nock('https://hc-central.heroku.com')
        .get('/connections?app=my-app&resource_name=not-a-resource-name')
        .reply(200, emptyConnectionResponse)

      const connections = await searchConnections(apiClient, 'my-app', 'not-a-resource-name')
      expect(connections).to.deep.equal(emptyConnectionResponse)
      api.done()
    })
  })

  describe('requestAppAccess', function () {
    it('fetches the app access status', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)

      const api = nock('https://hc-central.heroku.com')
        .post('/auth/my-app')
        .reply(200, singleConnectionAppAccessResponse)

      const connections = await requestAppAccess(apiClient, 'my-app')
      expect(connections).to.deep.equal(singleConnectionAppAccessResponse)
      api.done()
    })

    it('respects the CONNECT_DISCOVERY_SERVER environment variable', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)
      process.env = {
        ...originalEnv,
        CONNECT_DISCOVERY_SERVER: 'https://custom-discovery-server.heroku.com',
      }

      const api = nock('https://custom-discovery-server.heroku.com')
        .post('/auth/my-app')
        .reply(200, singleConnectionAppAccessResponse)

      const connections = await requestAppAccess(apiClient, 'my-app')
      expect(connections).to.deep.equal(singleConnectionAppAccessResponse)
      api.done()
    })

    it('respects the CONNECT_ADDON environment variable', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)
      process.env = {
        ...originalEnv,
        CONNECT_ADDON: 'connectqa',
      }

      const api = nock('https://hc-central-qa.herokai.com')
        .post('/auth/my-app')
        .reply(200, singleConnectionAppAccessResponse)

      const connections = await requestAppAccess(apiClient, 'my-app')
      expect(connections).to.deep.equal(singleConnectionAppAccessResponse)
      api.done()
    })
  })
})
