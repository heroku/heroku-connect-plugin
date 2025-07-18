import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import {stderr, stdout} from 'stdout-stderr'
import heredoc from 'tsheredoc'

import * as api from '../../src/lib/api'
import * as Connect from '../../src/lib/connect'
import * as Discovery from '../../src/lib/discovery'
import {
  ConnectionWithDetails, Mapping, Stream, AddonType,
} from '../../src/lib/types'
import {
  singleConnectionResponse,
  connectionDetailsResponse,
  emptyConnectionResponse,
  connectionWriteErrorsResponse,
  emptyWriteErrorsResponse,
  mappingWriteErrorsResponse,
} from '../support/test-fixtures'
import {trimOutput} from '../support/trim-output'

describe('api', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  describe('withUserConnections', function () {
    it('returns empty array when no connections found', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(emptyConnectionResponse)

      const result = await api.withUserConnections(heroku, appName)

      expect(result).to.deep.equal([])
      expect(searchConnectionsStub.calledWith(heroku, appName)).to.be.true
    })

    it('returns connections with details when connections found', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(singleConnectionResponse)
      const getDetailsStub = sandbox.stub(Connect, 'getDetails').resolves(connectionDetailsResponse)

      const result = await api.withUserConnections(heroku, appName)

      expect(result).to.have.length(1)
      expect(result[0]).to.deep.include({
        ...singleConnectionResponse.results[0],
        detail_url: connectionDetailsResponse.detail_url,
      })
      expect(result[0]).to.deep.include(connectionDetailsResponse)
      expect(searchConnectionsStub.calledWith(heroku, appName)).to.be.true
      expect(getDetailsStub.calledWith(heroku, singleConnectionResponse.results[0])).to.be.true
    })

    it('handles multiple connections and fetches details for each', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'

      // Create a response with multiple connections
      const multipleConnectionsResponse = {
        ...singleConnectionResponse,
        results: [
          singleConnectionResponse.results[0],
          {
            ...singleConnectionResponse.results[0],
            id: 'connection-2',
            resource_name: 'herokuconnect-angular-67890',
          },
        ],
        count: 2,
      }

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(multipleConnectionsResponse)
      const getDetailsStub = sandbox.stub(Connect, 'getDetails')
        .onFirstCall().resolves(connectionDetailsResponse)
        .onSecondCall().resolves({
          ...connectionDetailsResponse,
          id: 'connection-2',
          resource_name: 'herokuconnect-angular-67890',
        })

      const result = await api.withUserConnections(heroku, appName)

      expect(result).to.have.length(2)
      expect(result[0]).to.deep.include({
        ...singleConnectionResponse.results[0],
        detail_url: connectionDetailsResponse.detail_url,
      })
      expect(result[1]).to.deep.include({
        ...multipleConnectionsResponse.results[1],
        detail_url: connectionDetailsResponse.detail_url,
      })
      expect(searchConnectionsStub.calledWith(heroku, appName)).to.be.true
      expect(getDetailsStub.calledWith(heroku, multipleConnectionsResponse.results[0])).to.be.true
      expect(getDetailsStub.calledWith(heroku, multipleConnectionsResponse.results[1])).to.be.true
    })

    it('passes resourceName parameter to searchConnections', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const resourceName = 'my-resource'

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(emptyConnectionResponse)

      await api.withUserConnections(heroku, appName, resourceName)

      expect(searchConnectionsStub.calledWith(heroku, appName, resourceName)).to.be.true
    })

    it('passes addonType parameter to searchConnections', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const addonType: AddonType = 1 // ADDON_TYPE_SYNC

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(emptyConnectionResponse)

      await api.withUserConnections(heroku, appName, undefined, addonType)

      expect(searchConnectionsStub.calledWith(heroku, appName, undefined, addonType)).to.be.true
    })

    it('passes both resourceName and addonType parameters to searchConnections', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const resourceName = 'my-resource'
      const addonType: AddonType = 2 // ADDON_TYPE_EVENTS

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(emptyConnectionResponse)

      await api.withUserConnections(heroku, appName, resourceName, addonType)

      expect(searchConnectionsStub.calledWith(heroku, appName, resourceName, addonType)).to.be.true
    })
  })

  describe('withConnection', function () {
    it('throws error when no connections found', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(emptyConnectionResponse)

      try {
        await api.withConnection(heroku, appName)
        throw new Error('Expected method to reject.')
      } catch (error_: unknown) {
        const error = error_ as Error
        expect(error.message).to.eq('No connection(s) found')
      }

      expect(searchConnectionsStub.calledWith(heroku, appName)).to.be.true
    })

    it('returns connection with details when single connection found', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(singleConnectionResponse)
      const getDetailsStub = sandbox.stub(Connect, 'getDetails').resolves(connectionDetailsResponse)

      const result = await api.withConnection(heroku, appName)

      expect(result).to.deep.include({
        ...singleConnectionResponse.results[0],
        detail_url: connectionDetailsResponse.detail_url,
      })
      expect(result).to.deep.include(connectionDetailsResponse)
      expect(searchConnectionsStub.calledWith(heroku, appName)).to.be.true
      expect(getDetailsStub.calledWith(heroku, singleConnectionResponse.results[0])).to.be.true
    })

    it('throws error when multiple connections found', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'

      // Create a response with multiple connections
      const multipleConnectionsResponse = {
        ...singleConnectionResponse,
        results: [
          singleConnectionResponse.results[0],
          {
            ...singleConnectionResponse.results[0],
            id: 'connection-2',
            resource_name: 'herokuconnect-angular-67890',
          },
        ],
        count: 2,
      }

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(multipleConnectionsResponse)

      try {
        await api.withConnection(heroku, appName)
        throw new Error('Expected method to reject.')
      } catch (error_: unknown) {
        const error = error_ as Error
        expect(error.message).to.eq(
          'Multiple connections found. Please use \'--resource\' to specify a single connection by resource name. '
          + 'Use \'connect:info\' to list the resource names.'
        )
      }

      expect(searchConnectionsStub.calledWith(heroku, appName)).to.be.true
    })

    it('passes resourceName parameter to searchConnections', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const resourceName = 'my-resource'

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(singleConnectionResponse)
      const getDetailsStub = sandbox.stub(Connect, 'getDetails').resolves(connectionDetailsResponse)

      await api.withConnection(heroku, appName, resourceName)

      expect(searchConnectionsStub.calledWith(heroku, appName, resourceName)).to.be.true
      expect(getDetailsStub.calledWith(heroku, singleConnectionResponse.results[0])).to.be.true
    })

    it('passes addonType parameter to searchConnections', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const addonType: AddonType = 1 // ADDON_TYPE_SYNC

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(singleConnectionResponse)
      const getDetailsStub = sandbox.stub(Connect, 'getDetails').resolves(connectionDetailsResponse)

      await api.withConnection(heroku, appName, undefined, addonType)

      expect(searchConnectionsStub.calledWith(heroku, appName, undefined, addonType)).to.be.true
      expect(getDetailsStub.calledWith(heroku, singleConnectionResponse.results[0])).to.be.true
    })

    it('passes both resourceName and addonType parameters to searchConnections', async function () {
      const heroku = {} as APIClient
      const appName = 'my-app'
      const resourceName = 'my-resource'
      const addonType: AddonType = 2 // ADDON_TYPE_EVENTS

      const searchConnectionsStub = sandbox.stub(Discovery, 'searchConnections').resolves(singleConnectionResponse)
      const getDetailsStub = sandbox.stub(Connect, 'getDetails').resolves(connectionDetailsResponse)

      await api.withConnection(heroku, appName, resourceName, addonType)

      expect(searchConnectionsStub.calledWith(heroku, appName, resourceName, addonType)).to.be.true
      expect(getDetailsStub.calledWith(heroku, singleConnectionResponse.results[0])).to.be.true
    })
  })

  describe('withMapping', function () {
    it('matches the full object name', async function () {
      const connection: Partial<ConnectionWithDetails> = {
        mappings: [
          {object_name: 'Account'} as Mapping,
          {object_name: 'AccountHistory'} as Mapping,
        ],
      }
      const name = 'Account'

      const mapping = await api.withMapping(connection as ConnectionWithDetails, name)
      expect(mapping.object_name).to.eq(name)
    })

    it('throws an error if there is no match', async function () {
      const connection: Partial<ConnectionWithDetails> = {mappings: []}
      const name = 'Account'

      try {
        await api.withMapping(connection as ConnectionWithDetails, name)
        throw new Error('Expected method to reject.')
      } catch (error_: unknown) {
        const error = error_ as Error
        expect(error.message).to.eq('No mapping configured for Account')
      }
    })
  })

  describe('withStream', function () {
    it('matches the full stream name', async function () {
      const connection: Partial<ConnectionWithDetails> = {
        streams: [
          {object_name: 'Account'} as Stream,
          {object_name: 'AccountHistory'} as Stream,
        ],
      }
      const name = 'Account'

      const stream = await api.withStream({} as APIClient, connection as ConnectionWithDetails, name)
      expect(stream.object_name).to.eq(name)
    })

    it('throws an error if there is no match', async function () {
      const connection: Partial<ConnectionWithDetails> = {streams: []}
      const name = 'Account'

      try {
        await api.withStream({} as APIClient, connection as ConnectionWithDetails, name)
        throw new Error('Expected method to reject.')
      } catch (error_: unknown) {
        const error = error_ as Error
        expect(error.message).to.eq('No stream configured for Account')
      }
    })
  })

  describe('getWriteErrors', function () {
    describe('without a mapping name', function () {
      it('retrieves and displays connection write errors when there are errors', async function () {
        const config = await Config.load()
        const heroku = new APIClient(config)
        const connection: ConnectionWithDetails = {
          ...singleConnectionResponse.results[0],
          ...connectionDetailsResponse,
        }

        const connectApi = nock(connection.region_url)
          .get(`/api/v3/connections/${connection.id}/errors`)
          .reply(200, connectionWriteErrorsResponse)

        stdout.start()
        stderr.start()
        await api.getWriteErrors(heroku, connection)
        stdout.stop()
        stderr.stop()

        expect(stderr.output).to.include('Retrieving write errors for test-connection... done')
        expect(trimOutput(stdout.output)).to.eq(heredoc`
          Trigger Log ID Table Name Table ID    Error Message   Created
          ────────────── ────────── ─────────── ─────────────── ───────────────────────────
          error-id       Account    record-id   Error message   2025-07-16T19:22:08.288347Z
          error-id-2     Contact    record-id-2 Error message 2 2025-07-16T19:22:08.288347Z
        `)
        connectApi.done()
      })

      it('displays a message when there are no errors retrieved', async function () {
        const config = await Config.load()
        const heroku = new APIClient(config)
        const connection: ConnectionWithDetails = {
          ...singleConnectionResponse.results[0],
          ...connectionDetailsResponse,
        }

        const connectApi = nock(connection.region_url)
          .get(`/api/v3/connections/${connection.id}/errors`)
          .reply(200, emptyWriteErrorsResponse)

        stdout.start()
        stderr.start()
        await api.getWriteErrors(heroku, connection)
        stdout.stop()
        stderr.stop()

        expect(stderr.output).to.include('Retrieving write errors for test-connection... done')
        expect(stdout.output).to.eq('No write errors in the last 24 hours\n')
        connectApi.done()
      })

      it('displays errors as JSON when the --json flag is provided', async function () {
        const config = await Config.load()
        const heroku = new APIClient(config)
        const connection: ConnectionWithDetails = {
          ...singleConnectionResponse.results[0],
          ...connectionDetailsResponse,
        }

        const connectApi = nock(connection.region_url)
          .get(`/api/v3/connections/${connection.id}/errors`)
          .reply(200, connectionWriteErrorsResponse)

        stdout.start()
        stderr.start()
        await api.getWriteErrors(heroku, connection, undefined, true)
        stdout.stop()
        stderr.stop()

        expect(stderr.output).to.include('Retrieving write errors for test-connection... done')
        expect(JSON.parse(stdout.output)).to.deep.equal(connectionWriteErrorsResponse.results)
        connectApi.done()
      })
    })

    describe('with a mapping name', function () {
      it('retrieves and displays mapping write errors when there are errors', async function () {
        const config = await Config.load()
        const heroku = new APIClient(config)
        const connection: ConnectionWithDetails = {
          ...singleConnectionResponse.results[0],
          ...connectionDetailsResponse,
        }

        const connectApi = nock(connection.region_url)
          .get(`/api/v3/mappings/${connectionDetailsResponse.mappings[0].id}/errors`)
          .reply(200, mappingWriteErrorsResponse)

        stdout.start()
        stderr.start()
        await api.getWriteErrors(heroku, connection, 'Account')
        stdout.stop()
        stderr.stop()

        expect(stderr.output).to.include('Retrieving write errors for Account on test-connection... done')
        expect(trimOutput(stdout.output)).to.eq(heredoc`
          Trigger Log ID Table Name Table ID  Error Message Created
          ────────────── ────────── ───────── ───────────── ───────────────────────────
          error-id       Account    record-id Error message 2025-07-16T19:22:08.288347Z
        `)
        connectApi.done()
      })

      it('displays a message when there are no errors retrieved', async function () {
        const config = await Config.load()
        const heroku = new APIClient(config)
        const connection: ConnectionWithDetails = {
          ...singleConnectionResponse.results[0],
          ...connectionDetailsResponse,
        }

        const connectApi = nock(connection.region_url)
          .get(`/api/v3/mappings/${connectionDetailsResponse.mappings[0].id}/errors`)
          .reply(200, emptyWriteErrorsResponse)

        stdout.start()
        stderr.start()
        await api.getWriteErrors(heroku, connection, 'Account')
        stdout.stop()
        stderr.stop()

        expect(stderr.output).to.include('Retrieving write errors for Account on test-connection... done')
        expect(stdout.output).to.eq('No write errors in the last 24 hours\n')
        connectApi.done()
      })

      it('displays errors as JSON when the --json flag is provided', async function () {
        const config = await Config.load()
        const heroku = new APIClient(config)
        const connection: ConnectionWithDetails = {
          ...singleConnectionResponse.results[0],
          ...connectionDetailsResponse,
        }

        const connectApi = nock(connection.region_url)
          .get(`/api/v3/mappings/${connectionDetailsResponse.mappings[0].id}/errors`)
          .reply(200, mappingWriteErrorsResponse)

        stdout.start()
        stderr.start()
        await api.getWriteErrors(heroku, connection, 'Account', true)
        stdout.stop()
        stderr.stop()

        expect(stderr.output).to.include('Retrieving write errors for Account on test-connection... done')
        expect(JSON.parse(stdout.output)).to.deep.equal(mappingWriteErrorsResponse.results)
        connectApi.done()
      })
    })
  })

  describe('requestAppAccess', function () {
    it('calls Discovery.requestAppAccess and withUserConnections with correct parameters', async function () {
      const config = await Config.load()
      const heroku = new APIClient(config)
      const appName = 'my-app'
      const addonType: AddonType = 1 // ADDON_TYPE_SYNC

      const requestAppAccessStub = sandbox.stub(Discovery, 'requestAppAccess').resolves()
      const withUserConnectionsStub = sandbox.stub(api, 'withUserConnections').resolves([])

      await api.requestAppAccess(heroku, appName, addonType)

      expect(requestAppAccessStub.calledWith(heroku, appName, addonType)).to.be.true
      expect(withUserConnectionsStub.calledWith(heroku, appName, undefined, addonType)).to.be.true
    })

    it('calls functions with undefined addonType when not provided', async function () {
      const config = await Config.load()
      const heroku = new APIClient(config)
      const appName = 'my-app'

      const requestAppAccessStub = sandbox.stub(Discovery, 'requestAppAccess').resolves()
      const withUserConnectionsStub = sandbox.stub(api, 'withUserConnections').resolves([])

      await api.requestAppAccess(heroku, appName)

      expect(requestAppAccessStub.calledWith(heroku, appName)).to.be.true
      expect(withUserConnectionsStub.calledWith(heroku, appName)).to.be.true
    })
  })
})
