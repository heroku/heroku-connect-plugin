import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'

export default class MappingReload extends Command {
  static args = {
    mapping: Args.string({description: 'mapping name'}),
  }
  static description = "Reload a mapping's data from Salesforce"
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(MappingReload)
    const context: ConnectContext = {
      app: flags.app,
      args,
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    ux.action.start(`initiating reload of ${args.mapping}`)
    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping as string | undefined)

    const response = await api.request(context, 'POST', `/api/v3/mappings/${mapping.id}/actions/reload`)
    if (response.status !== 202) {
      throw new Error(response.data.message || 'unknown error')
    }

    ux.action.stop()
  }
}
