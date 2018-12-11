const Config = require('ssb-config/inject')
const ssbKeys = require('ssb-keys')
const Path = require('path')
const merge = require('lodash.merge')
const createConnection = require('ssb-client')

// TODO ? check if server is running, start one temporarliy if it's not!

module.exports = function Connection (cb) {
  var config = getConfig
  createConnection(config.keys, null, cb)
}

// copied from patchbay

function getConfig () {
  const appName = process.env.ssb_appname || 'ssb'
  const opts = null

  var config = Config(appName, opts)
  config = merge(
    config,
    Keys(config),
    Connections(config),
    Remote(config)
  )
  config.appKey = config.caps.shs
  return config
}

function Keys (config) {
  const keyPath = Path.join(config.path, 'secret')
  return { keys: ssbKeys.loadOrCreateSync(keyPath) }
}

function Connections (config) {
  const connections = (process.platform === 'win32')
    ? undefined // this seems wrong?
    : { incoming: { unix: [{ 'scope': 'local', 'transform': 'noauth' }] } }

  return connections ? { connections } : {}
}

function Remote (config) {
  const pubkey = config.keys.id.slice(1).replace(`.${config.keys.curve}`, '')
  const remote = (process.platform === 'win32')
    ? undefined // `net:127.0.0.1:${config.port}~shs:${pubkey}` // currently broken
    : `unix:${Path.join(config.path, 'socket')}:~noauth:${pubkey}`

  return remote ? { remote } : {}
}
