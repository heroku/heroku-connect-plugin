const axios = require('axios')
const baseURL = process.env['CONNECT_ADDON'] === 'connectqa'
  ? 'https://hc-central-qa.herokai.com'
  : 'https://hc-central.heroku.com'

class DiscoveryClient {
  constructor (context) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.auth.password}`,
        'Heroku-Client': 'cli'
      }
    })
  }

  searchConnections (appName, resourceName) {
    const resourceNameQueryParam = resourceName ? `&resource_name=${resourceName}` : ''
    return this.client(`/connections?app=${appName}${resourceNameQueryParam}`)
  }
}

exports.DiscoveryClient = DiscoveryClient
