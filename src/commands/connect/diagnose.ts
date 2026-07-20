import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {styledHeader} from '@heroku/heroku-cli-util/hux'
import {ux} from '@oclif/core'

import {ConnectContext} from '../../lib/clients/connect.js'
import * as api from '../../lib/connect/api.js'

type CheckResult = {
  display_name: string
  doc_url?: string
  message: string
  rule_id?: string
  status?: string
}

type DiagnoseResults = {
  errors: CheckResult[]
  mappings?: Record<string, DiagnoseResults>
  passes: CheckResult[]
  skips: CheckResult[]
  warnings: CheckResult[]
}

type DiagnoseFlags = {verbose?: boolean}

function colorize(name: 'dim' | 'green' | 'red' | 'yellow'): (text: string) => string {
  switch (name) {
    case 'dim': {return color.gray
    }

    case 'green': {return color.green
    }

    case 'red': {return color.red
    }

    case 'yellow': {return color.yellow
    }
  }
}

function displayResult(label: string, colorName: 'dim' | 'green' | 'red' | 'yellow', displayMessages = true) {
  const colorFn = colorize(colorName)
  return (result: CheckResult): void => {
    ux.stdout(colorFn(`${label}: ${result.display_name}`))
    if (displayMessages) {
      ux.stdout(result.message)
      if (result.doc_url) {
        ux.stdout(result.doc_url)
      }
    }
  }
}

export function displayResults(results: DiagnoseResults, flags: DiagnoseFlags): void {
  results.errors.forEach(displayResult('RED', 'red'))
  results.warnings.forEach(displayResult('YELLOW', 'yellow'))
  if (flags.verbose) {
    results.passes.forEach(displayResult('GREEN', 'green', false))
    results.skips.forEach(displayResult('SKIPPED', 'dim', false))
  }
}

function shouldDisplay(results: DiagnoseResults, flags: DiagnoseFlags): boolean {
  return results.errors.length > 0 || results.warnings.length > 0 || Boolean(flags.verbose)
}

function timeout(duration: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export default class ConnectDiagnose extends Command {
  static description = 'Display diagnostic information about a connection'
  static flags = {
    app: flags.app({required: true}),
    resource: flags.string({description: 'specific connection resource name'}),
    verbose: flags.boolean({char: 'v', description: 'display passed and skipped check information as well'}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ConnectDiagnose)
    const context: ConnectContext = {
      app: flags.app,
      args: {},
      auth: {password: (await this.heroku.getAuth()) as string},
      flags,
    }

    let didDisplayAnything = false
    const connection = await api.withConnection(context, this.heroku)
    context.region = connection.region_url

    ux.action.start('Diagnosing connection')
    const url = `/api/v3/connections/${connection.id}/validations`
    let results: DiagnoseResults | undefined
    try {
      const {data: {result_url: resultUrl}} = await api.request(context, 'POST', url)
      for (let i = 0; i <= 600; i++) {
        const response = await api.request(context, 'GET', resultUrl)
        if (response.status === 200) {
          results = response.data as DiagnoseResults
          break
        }

        await timeout(500)
      }
    } catch (error) {
      ux.action.stop('error')
      this.error(error as Error)
    }

    ux.action.stop()

    if (!results) {
      this.error('There was an issue retrieving validations')
    }

    ux.stdout()
    styledHeader(`Connection: ${connection.name || connection.internal_name}`)
    if (shouldDisplay(results, flags)) {
      didDisplayAnything = true
      displayResults(results, flags)
    }

    if (results.mappings) {
      for (const objectName in results.mappings) {
        const mappingResults = results.mappings[objectName]
        if (shouldDisplay(mappingResults, flags)) {
          didDisplayAnything = true
          ux.stdout()
          styledHeader(objectName)
          displayResults(mappingResults, flags)
        }
      }
    }

    if (!didDisplayAnything && !flags.verbose) {
      ux.stdout(color.green('Everything appears to be fine'))
    }
  }
}
