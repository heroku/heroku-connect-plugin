import { describe, expect, it } from 'vitest'
import * as api from '../../../lib/connect/api.js'

describe('api.withMapping', () => {
  it('matches the full object name', async () => {
    const con = {
      mappings: [
        { object_name: 'Account' },
        { object_name: 'AccountHistory' }
      ]
    }
    const name = 'Account'
    const mapping = await api.withMapping(con, name)
    expect(mapping.object_name).toBe(name)
  })

  it('throws an error if there is no match', async () => {
    const con = { mappings: [] }
    const name = 'Account'
    await expect(api.withMapping(con, name)).rejects.toThrow('No mapping configured for Account')
  })
})

describe('api.withStream', () => {
  it('matches the full stream name', async () => {
    const con = {
      streams: [
        { object_name: 'Account' },
        { object_name: 'AccountHistory' }
      ]
    }
    const name = 'Account'
    const mapping = await api.withStream({}, con, name)
    expect(mapping.object_name).toBe(name)
  })

  it('throws an error if there is no match', async () => {
    const con = { streams: [] }
    const name = 'Account'
    await expect(api.withStream({}, con, name)).rejects.toThrow('No stream configured for Account')
  })
})
