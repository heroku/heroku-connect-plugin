'use strict'

const api = require('../../../lib/connect/api')
const expect = require('unexpected')

describe('api.withMapping', () => {
  it('it matches the full object name', () => {
      let con = {
          mappings: [
              {object_name: 'Account'},
              {object_name: 'AccountHistory'}
          ]
      }
      let name = 'Account'
      return api.withMapping(con, name).then((mapping) => {
          expect(mapping.object_name, 'to be', name)
      })
  })
})
