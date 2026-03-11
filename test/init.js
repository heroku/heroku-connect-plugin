import cli from '@heroku/heroku-cli-util'
import nock from 'nock'
import { commands } from '../index.js'
import MockDate from 'mockdate'

cli.raiseErrors = true
nock.disableNetConnect()
global.commands = commands

process.env.TZ = 'UTC'
MockDate.set(new Date())
process.stdout.columns = 80
process.stderr.columns = 80
