import { Command, flags } from '@heroku-cli/command'
import cli from '@heroku/heroku-cli-util'
import * as api from '../../lib/connect/api.js'

function displayResults (results, flags) {
  results.errors.forEach(displayResult('RED', 'red'))
  results.warnings.forEach(displayResult('YELLOW', 'yellow'))
  if (flags.verbose) {
    results.passes.forEach(displayResult('GREEN', 'green', false))
    results.skips.forEach(displayResult('SKIPPED', 'dim', false))
  }
}

function shouldDisplay (results, flags) {
  return (results.errors.length > 0 || results.warnings.length > 0 || flags.verbose)
}

function displayResult (label, color, displayMessages) {
  // Default to displaying messages, unless overridden
  if (displayMessages === undefined) {
    displayMessages = true
  }
  return function (result) {
    cli.log(cli.color[color](`${label}: ${result.display_name}`))
    if (displayMessages) {
      cli.log(result.message)
      if (result.doc_url) {
        cli.log(result.doc_url)
      }
    }
  }
}

function timeout (duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export default class ConnectDiagnose extends Command {
  static description = 'Display diagnostic information about a connection'

  static flags = {
    app: flags.app({ required: true }),
    resource: flags.string({ description: 'specific connection resource name' }),
    verbose: flags.boolean({ char: 'v', description: 'display passed and skipped check information as well' })
  }

  async run () {
    const { flags } = await this.parse(ConnectDiagnose)
    const context = {
      app: flags.app,
      flags,
      args: {},
      auth: { password: this.heroku.auth }
    }

    let mappingResults
    let didDisplayAnything = false
    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url
    const results = await cli.action('Diagnosing connection', (async function () {
      const url = '/api/v3/connections/' + connection.id + '/validations'
      try {
        const { data: { result_url: resultUrl } } = await api.request(context, 'POST', url)

        let i = 0

        while (true) {
          if (i > 600) {
            cli.error('There was an issue retrieving validations')
            break
          }
          const response = await api.request(context, 'GET', resultUrl)

          if (response.status === 200) {
            return response.data
          }

          i++

          await timeout(500)
        }
      } catch (err) {
        cli.error(err)
      }
    }.bind(this))())

    cli.log() // Blank line to separate each section
    cli.styledHeader(`Connection: ${connection.name || connection.internal_name}`)
    if (shouldDisplay(results, flags)) {
      didDisplayAnything = true
      displayResults(results, flags)
    }

    for (const objectName in results.mappings) {
      mappingResults = results.mappings[objectName]
      if (shouldDisplay(mappingResults, flags)) {
        didDisplayAnything = true
        cli.log() // Blank line to separate each section
        cli.styledHeader(objectName)
        displayResults(mappingResults, flags)
      }
    }

    if (!didDisplayAnything && !flags.verbose) {
      cli.log(cli.color.green('Everything appears to be fine'))
    }
  }
}

// Additional exports for code sharing
export { displayResults }
