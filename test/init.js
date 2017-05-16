'use strict'

const cli = require('heroku-cli-util')
const nock = require('nock')
cli.raiseErrors = true
nock.disableNetConnect()
global.commands = require('../index').commands

process.env.TZ = 'UTC'
require('mockdate').set(new Date())
process.stdout.columns = 80
process.stderr.columns = 80
