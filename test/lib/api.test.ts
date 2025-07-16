import {expect} from 'chai'

import * as api from '../../src/lib/api'
import {ConnectionWithDetails, Mapping, Stream} from '../../src/lib/types'
import {APIClient} from '@heroku-cli/command'

describe('api', function () {
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
})
