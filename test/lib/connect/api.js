'use strict'
/* globals describe it */

const api = require('../../../lib/connect/api')
const expect = require('unexpected')

describe('api.withMapping', () => {
  it('matches the full object name', () => {
    const con = {
      mappings: [
        { object_name: 'Account' },
        { object_name: 'AccountHistory' }
      ]
    }
    const name = 'Account'
    return api.withMapping(con, name).then((mapping) => {
      expect(mapping.object_name, 'to be', name)
    })
  })

  it('throws an error if there is no match', () => {
    const con = { mappings: [] }
    const name = 'Account'
    return api.withMapping(con, name)
      .then((mapping) => { throw new Error(`Did not expect mapping ${mapping}`) })
      .catch((err) => expect(err.message, 'to be', 'No mapping configured for Account'))
  })
})

describe('api.withStream', () => {
  it('matches the full stream name', () => {
    const con = {
      streams: [
        { object_name: 'Account' },
        { object_name: 'AccountHistory' }
      ]
    }
    const name = 'Account'
    return api.withStream({}, con, name).then((mapping) => {
      expect(mapping.object_name, 'to be', name)
    })
  })

  it('throws an error if there is no match', () => {
    const con = { streams: [] }
    const name = 'Account'
    return api.withStream({}, con, name)
      .then((mapping) => { throw new Error(`Did not expect mapping ${mapping}`) })
      .catch((err) => expect(err.message, 'to be', 'No stream configured for Account'))
  })
})
