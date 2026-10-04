import {describe, expect, it} from 'vitest'

import * as api from '../../../src/lib/connect/api.js'

describe('api.withMapping', () => {
  it('matches the full object name', async () => {
    const con = {
      mappings: [
        {object_name: 'Account'},
        {object_name: 'AccountHistory'},
      ],
    }
    const name = 'Account'
    const mapping = await api.withMapping(con, name)
    expect(mapping.object_name).toBe(name)
  })

  it('throws an error if there is no match', async () => {
    const con = {mappings: []}
    const name = 'Account'
    await expect(api.withMapping(con, name)).rejects.toThrow('No mapping configured for Account')
  })
})
