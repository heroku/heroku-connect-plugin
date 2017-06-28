'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

function displayResults (results) {
  results.errors.forEach(displayResult('red'))
  results.warnings.forEach(displayResult('yellow'))
  results.passes.forEach(displayResult('green', false))
}

function displayResult (color, displayMessages) {
  // Default to displaying messages, unless overridden
  if (displayMessages === undefined) {
    displayMessages = true
  }
  return function (result) {
    cli.log(cli.color[color](`${color.toUpperCase()}: ${result.display_name}`))
    if (displayMessages) {
      cli.log(result.message)
      if (result.doc_url) {
        cli.log(result.doc_url)
      }
    }
  }
}

module.exports = {
  topic: 'connect',
  command: 'diagnose',
  description: 'Display diagnostic information about a connection',
  help: 'Checks a connection for common configuration errors. ',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function * (context, heroku) {
    context.region = regions.determineRegion(context)
    let connection = yield api.withConnection(context, heroku)
    let results = yield cli.action('Diagnosing connection', co(function * () {
      let url = '/api/v3/connections/' + connection.id + '/validations'
      return yield api.request(context, 'GET', url)
    }))

    cli.log() // Blank line to separate each section
    cli.styledHeader(`Connection: ${connection.name || connection.internal_name}`)
    displayResults(results.json)

    for (let objectName in results.json.mappings) {
      cli.log() // Blank line to separate each section
      cli.styledHeader(objectName)
      displayResults(results.json.mappings[objectName])
    }
  })),

  // Additional exports for code sharing
  displayResults: displayResults
}
