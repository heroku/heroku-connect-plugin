import {HTTP} from '@heroku/http-call'
import {APIClient} from '@heroku-cli/command'

import {Connection, ConnectionDetails} from './types'

export async function getDetails(heroku: APIClient, connection: Connection): Promise<HTTP<ConnectionDetails>> {
  const detailUrl = new URL(connection.detail_url)
  return heroku.get<ConnectionDetails>(`${detailUrl.pathname}?deep=true`, {
    hostname: detailUrl.hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
}
