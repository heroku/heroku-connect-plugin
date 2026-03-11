import * as api from '../../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import { displayResults } from '../diagnose.js'
import { Command, flags } from '@heroku-cli/command'
import { Args } from '@oclif/core'

export default class MappingDiagnose extends Command {
  static description = 'Display diagnostic information about a mapping'

  static args = {
    mapping: Args.string({ description: 'mapping name' })
  }

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    verbose: flags.boolean({ char: 'v', description: 'display passed and skipped check information as well' })
  }

  async run () {
    const { args, flags } = await this.parse(MappingDiagnose)
    const context = { app: flags.app, flags, args, auth: { password: this.heroku.auth } }

    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping)
    const results = await cli.action('Diagnosing mapping', (async function () {
      const url = '/api/v3/mappings/' + mapping.id + '/validations'
      return await api.request(context, 'GET', url)
    })())
    cli.log() // Blank line to separate each section
    cli.styledHeader(mapping.object_name)
    displayResults(results.data, flags)
  }
}
