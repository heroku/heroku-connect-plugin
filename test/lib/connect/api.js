'use strict'
/* globals describe it */

const api = require('../../../lib/connect/api')
const expect = require('unexpected')

describe('api.withMapping', () => {
  it('matches the full object name', () => {
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

  it('throws an error if there is no match', () => {
    let con = {mappings: []}
    let name = 'Account'
    return api.withMapping(con, name)
          .then((mapping) => { throw new Error(`Did not expect mapping ${mapping}`) })
          .catch((err) => expect(err.message, 'to be', 'No mapping configured for Account'))
  })
})

describe('api.withStream', () => {
  it('matches the full stream name', () => {
    let con = {
      streams: [
              {object_name: 'Account'},
              {object_name: 'AccountHistory'}
      ]
    }
    let name = 'Account'
    return api.withStream({}, con, name).then((mapping) => {
      expect(mapping.object_name, 'to be', name)
    })
  })

  it('throws an error if there is no match', () => {
    let con = {streams: []}
    let name = 'Account'
    return api.withStream({}, con, name)
          .then((mapping) => { throw new Error(`Did not expect mapping ${mapping}`) })
          .catch((err) => expect(err.message, 'to be', 'No stream configured for Account'))
  })
})
