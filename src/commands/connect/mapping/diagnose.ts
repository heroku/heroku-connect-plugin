import {Command, flags} from '@heroku-cli/command'
import {styledHeader} from '@heroku/heroku-cli-util/hux'
import {Args, ux} from '@oclif/core'

import {ConnectContext} from '../../../lib/clients/connect.js'
import * as api from '../../../lib/connect/api.js'
import {displayResults} from '../diagnose.js'

export default class MappingDiagnose extends Command {
  static args = {
    mapping: Args.string({description: 'mapping name'}),
  }
  static description = 'Display diagnostic information about a mapping'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
    verbose: flags.boolean({char: 'v', description: 'display passed and skipped check information as well'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(MappingDiagnose)
    const context: ConnectContext = {
      app: flags.app,
      args,
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping as string | undefined)

    ux.action.start('Diagnosing mapping')
    const url = `/api/v3/mappings/${mapping.id}/validations`
    const results = await api.request(context, 'GET', url)
    ux.action.stop()

    ux.stdout('')
    styledHeader(mapping.object_name)
    displayResults(results.data, flags)
  }
}
