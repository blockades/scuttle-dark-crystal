const inject = require('scuttle-inject')

const raw = require('./methods')
const PLUGIN_DEPS = ['private', 'query']

const niceMappings = {}

module.exports = function (server, opts) {
  const methods = Object.assign({}, raw, niceMappings)

  return inject(server, { darkcrystal: methods }, PLUGIN_DEPS)
}
