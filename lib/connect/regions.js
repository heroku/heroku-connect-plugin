'use strict'
const co = require('co')

const prodRegions = ['us', 'eu', 'dublin', 'tokyo', 'virginia', 'oregon', 'frankfurt', 'sydney']
const prodRegionsMap = {}
const qaRegions = ['dublin', 'frankfurt', 'virginia']
const qaRegionsMap = {}

prodRegions.forEach(region => {
  prodRegionsMap[region] = `connect-${region}.heroku.com`
})
qaRegions.forEach(region => {
  qaRegionsMap[region] = `hc-qa-${region}.herokai.com`
})
// Also map Cedar-based regions to the right places
qaRegionsMap['us'] = `hc-qa-virginia.herokai.com`
qaRegionsMap['eu'] = `hc-qa-dublin.herokai.com`

exports.prodRegions = prodRegions
exports.prodRegionsMap = prodRegionsMap

exports.qaRegions = qaRegions
exports.qaRegionsMap = qaRegionsMap

exports.flag = {
  name: 'region',
  description: 'region of Heroku Connect to work with',
  hasValue: true
}

let determineRegion = exports.determineRegion = co.wrap(function * (context, heroku) {
  let appRegion

  // The --region flag should override the region set on the App.
  if (context.flags.region) {
    appRegion = context.flags.region
  } else {
    appRegion = (yield heroku.apps(context.app).info()).region.name
  }
  if (!prodRegions.includes(appRegion)) {
    throw new Error(`Unknown region '${appRegion}'. Supported regions: ${prodRegions.join(', ')}`)
  }
  return appRegion
})

if (process.env['CONNECT_ADDON'] === 'connectqa') {
  exports.urlFromRegion = regionName => qaRegionsMap[regionName]
} else {
  exports.urlFromRegion = regionName => prodRegionsMap[regionName]
}

exports.requireRegion = function (fn) {
  return (context, heroku) => {
    context.region = determineRegion(context)
    return fn(context, heroku)
  }
}
