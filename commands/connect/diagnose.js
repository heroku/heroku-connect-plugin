'use strict'
const api = require('../../lib/connect/api.js')
const regions = require('../../lib/connect/regions.js')
const cli = require('heroku-cli-util')
const co = require('co')

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
      let url = '/api/v3/connections/' + connection.id + '/diagnose'
      return yield api.request(context, 'GET', url)
    }))

    cli.log() // Blank line to separate each section
    cli.styledHeader(`Connection: ${connection.name}`)
    displayResults(results);

    for (let object_name in results.mappings) {
      cli.log() // Blank line to separate each section
      cli.styledHeader(`Mapping: ${object_name}`)
      displayResults(results.mappings[object_name])
    }
  }))
}

function displayResults(results) {
  results.errors.forEach(displayResult('red'))
  results.warnings.forEach(displayResult('yellow'))
  results.passes.forEach(displayResult('green'))
}

function displayResult(color) {
  return function(result) {
    if(result.message) {
    cli.log(cli.color[color](`${color.toUpperCase()}: ${result.display_name}`))
      cli.log(result.message)
      if(result.doc_url) {
        cli.log(result.doc_url)
      }
    }
  }
}
