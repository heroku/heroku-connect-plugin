const axios = require('axios')
const baseURL = process.env['CONNECT_DISCOVERY_SERVER'] || (process.env['CONNECT_ADDON'] === 'connectqa'
  ? 'https://hc-central-qa.herokai.com'
  : 'https://hc-central.heroku.com')

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

  searchConnections (appName, resourceName, addonType) {
    const resourceNameQueryParam = resourceName ? `&resource_name=${resourceName}` : ''
    const addonTypeQueryParam = addonType ? `&addon_type=${addonType}` : ''
    const url = `/connections?app=${appName}${resourceNameQueryParam}${addonTypeQueryParam}`
    return this.client(url)
  }

  requestAppAccess (appName, addonType) {
    const addonTypeQueryParam = addonType ? `?addon_type=${addonType}` : ''
    const url = `/auth/${appName}${addonTypeQueryParam}`
    return this.client({url: url, method: 'POST'})
  }
}

exports.DiscoveryClient = DiscoveryClient
