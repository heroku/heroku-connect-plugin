import {APIClient} from '@heroku-cli/command'
import {expect} from 'chai'
import sinon from 'sinon'

import Cmd from '../../../../src/commands/connect/mapping/write-errors'
import * as api from '../../../../src/lib/api'
import {runCommand} from '../../../run-command'
import {connectionDetailsResponse, singleConnectionResponse} from '../../../support/test-fixtures'

describe('heroku connect:mapping:write-errors', function () {
  let sandbox: sinon.SinonSandbox

  beforeEach(function () {
    sandbox = sinon.createSandbox()
  })

  afterEach(function () {
    sandbox.restore()
  })

  // Usually we would test the command output, but in this case we're only verifying the call to the lib function
  // is done with the correct parameters, because we already have tests for the lib function outputs.
  it('calls the lib function with the correct parameters without --json flag', async function () {
    const appName = 'my-app'
    const connectionWithDetails = {
      ...singleConnectionResponse.results[0],
      ...connectionDetailsResponse,
    }
    sandbox.stub(api, 'withConnection').resolves(connectionWithDetails)
    const getWriteErrorsStub = sandbox.stub(api, 'getWriteErrors').resolves()

    await runCommand(Cmd, [
      'mapping-name',
      '--app',
      appName,
    ])

    expect(getWriteErrorsStub.calledWith(sinon.match.instanceOf(APIClient), connectionWithDetails, 'mapping-name')).to.be.true
  })

  it('calls the lib function with the correct parameters with --json flag', async function () {
    const appName = 'my-app'
    const connectionWithDetails = {
      ...singleConnectionResponse.results[0],
      ...connectionDetailsResponse,
    }
    sandbox.stub(api, 'withConnection').resolves(connectionWithDetails)
    const getWriteErrorsStub = sandbox.stub(api, 'getWriteErrors').resolves()

    await runCommand(Cmd, [
      'mapping-name',
      '--app',
      appName,
      '--json',
    ])

    expect(getWriteErrorsStub.calledWith(sinon.match.instanceOf(APIClient), connectionWithDetails, 'mapping-name', true)).to.be.true
  })
})
