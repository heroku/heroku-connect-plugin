import {APIClient} from '@heroku-cli/command'

import {Connection, ConnectionDetails} from './types'

export async function getDetails(heroku: APIClient, connection: Connection): Promise<ConnectionDetails> {
  const regionUrl = new URL(connection.region_url)
  const detailUrl = new URL(connection.detail_url)
  const {body: connectionDetails} = await heroku.get<ConnectionDetails>(`${detailUrl.pathname}?deep=true`, {
    hostname: regionUrl.hostname,
    headers: {
      Accept: 'application/json',
      'Heroku-Client': 'cli',
    },
  })
  return connectionDetails
}
