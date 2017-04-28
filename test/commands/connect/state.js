'use strict'
const cli = require('heroku-cli-util')
const nock = require('nock')
const unexpected = require('unexpected')
const cmd = require('../../../lib/commands/connect/state')

describe('connect:state', () => {
  // prevent stdout/stderr from displaying
  // redirects to cli.stdout/cli.stderr instead
  beforeEach(() => cli.mockConsole())

  it('retrieves the state of the connect addon', () => {
    let api = nock('https://connect-us.heroku.com:443')
      //.get
  })
})
