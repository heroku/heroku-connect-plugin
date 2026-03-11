import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import diagnose from './diagnose.js'

export default {
  topic: 'connect:mapping',
  command: 'diagnose',
  description: 'Display diagnostic information about a mapping',
  help: 'Checks a mapping for common configuration errors. ',
  args: [
    { name: 'mapping' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'verbose', char: 'v', description: 'display passed and skipped check information as well' }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    const connection = await api.withConnection(context, heroku)
    context.region = connection.region_url
    const mapping = await api.withMapping(connection, context.args.mapping)
    const results = await cli.action('Diagnosing mapping', (async function () {
      const url = '/api/v3/mappings/' + mapping.id + '/validations'
      return await api.request(context, 'GET', url)
    })())
    cli.log() // Blank line to separate each section
    cli.styledHeader(mapping.object_name)
    diagnose.displayResults(results.data, context.flags)
  })
}
