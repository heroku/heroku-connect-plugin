import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'

import {getDetails} from '../../src/lib/connect'
import {Connection} from '../../src/lib/types'
import {
  connectionDetailsResponse,
  connectionId,
  regionalInstanceDomain,
  singleConnectionResponse,
} from '../support/test-fixtures'

describe('connect lib functions', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  describe('getDetails', function () {
    it('fetches and returns details for a connection', async function () {
      const config = await Config.load()
      const apiClient = new APIClient(config)
      const connection = singleConnectionResponse.results[0]

      const api = nock(`https://${regionalInstanceDomain}`)
        .get(`/api/v3/connections/${connectionId}?deep=true`)
        .reply(200, connectionDetailsResponse)

      const details = await getDetails(apiClient, connection as Connection)
      expect(details).to.deep.equal(connectionDetailsResponse)
      api.done()
    })
  })
})
