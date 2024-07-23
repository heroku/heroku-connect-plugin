'use strict'
const api = require('../../lib/connect/api.js')
const cli = require('@heroku/heroku-cli-util')
const co = require('co')

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

module.exports = {
  topic: 'connect',
  command: 'diagnose',
  description: 'Display diagnostic information about a connection',
  help: 'Checks a connection for common configuration errors. ',
  flags: [
    { name: 'resource', description: 'specific connection resource name', hasValue: true },
    { name: 'verbose', char: 'v', description: 'display passed and skipped check information as well' }
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    let mappingResults
    let didDisplayAnything = false
    const connection = yield api.withConnection(context, heroku)
    context.region = connection.region_url
    const results = yield cli.action('Diagnosing connection', co(function * () {
      const url = '/api/v3/connections/' + connection.id + '/validations'
      try {
        const { data: { result_url: resultUrl } } = yield api.request(context, 'POST', url)

        let i = 0

        while (true) {
          if (i > 600) {
            cli.error('There was an issue retrieving validations')
            break
          }
          const response = yield api.request(context, 'GET', resultUrl)

          if (response.status === 200) {
            return response.data
          }

          i++

          yield timeout(500)
        }
      } catch (err) {
        cli.error(err)
      }
    }))

    cli.log() // Blank line to separate each section
    cli.styledHeader(`Connection: ${connection.name || connection.internal_name}`)
    if (shouldDisplay(results, context.flags)) {
      didDisplayAnything = true
      displayResults(results, context.flags)
    }

    for (const objectName in results.mappings) {
      mappingResults = results.mappings[objectName]
      if (shouldDisplay(mappingResults, context.flags)) {
        didDisplayAnything = true
        cli.log() // Blank line to separate each section
        cli.styledHeader(objectName)
        displayResults(mappingResults, context.flags)
      }
    }

    if (!didDisplayAnything && !context.flags.verbose) {
      cli.log(cli.color.green('Everything appears to be fine'))
    }
  })),

  // Additional exports for code sharing
  displayResults: displayResults
}
