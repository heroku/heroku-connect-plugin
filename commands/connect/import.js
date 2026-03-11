import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'
import fs from 'fs'

export default {
  topic: 'connect',
  command: 'import',
  description: 'Import configuration from an export file',
  help: 'Imports the mapping configuration from a json export file',
  args: [
    { name: 'file', desciption: 'JSON export file name' }
  ],
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    const fName = context.args.file
    await cli.action(`uploading ${fName}`, (async function () {
      const connection = await api.withConnection(context, heroku)
      context.region = connection.region_url
      const url = '/api/v3/connections/' + connection.id + '/actions/import'
      const data = JSON.parse(fs.readFileSync(fName, 'utf8'))
      await api.request(context, 'POST', url, data)
    })())
  })
}
