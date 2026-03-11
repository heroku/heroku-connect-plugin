import * as api from '../../../lib/connect/api.js'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'

export default class MappingWriteErrors extends Command {
  static description = 'Display the last 24 hours of write errors on this mapping'

  static examples = [
    '$ heroku connect:mapping:write-errors -a myapp --resource herokuconnect-twisted-123 Account'
  ]

  static args = {
    name: Args.string({ description: 'Name of the mapping to retrieve errors for', required: true })
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    json: flags.boolean({ description: 'print errors as styled JSON' })
  }

  async run () {
    const { args, flags } = await this.parse(MappingWriteErrors)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    await api.getWriteErrors(context, this.heroku)
  }
}
