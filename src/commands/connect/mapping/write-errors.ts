import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

export default class MappingWriteErrors extends Command {
  static args = {
    name: Args.string({description: 'Name of the mapping to retrieve errors for', required: true}),
  }
  static description = 'Display the last 24 hours of write errors on this mapping'
  static examples = [
    '$ heroku connect:mapping:write-errors -a myapp --resource herokuconnect-twisted-123 Account',
  ]
  static flags = {
    app: flags.app({required: true}),
    json: flags.boolean({description: 'print errors as styled JSON'}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(MappingWriteErrors)
    const context: ConnectContext = {
      app: flags.app,
      args,
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    await api.getWriteErrors(context)
  }
}
