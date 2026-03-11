import * as api from '../../lib/connect/api.js'
import cli from '@heroku/heroku-cli-util'

export default {
  topic: 'connect-events',
  command: 'resume',
  description: 'Resume a connection',
  help: 'Resumes a paused connection',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(async function (context, heroku) {
    await cli.action('resuming connection', (async function () {
      const connection = await api.withConnection(context, heroku, api.ADDON_TYPE_EVENTS)
      context.region = connection.region_url
      const url = `/api/v3/kafka-connections/${connection.id}/actions/resume`
      await api.request(context, 'POST', url)
    })())
  })
}
