const methods = require('./methods')
const PLUGIN_DEPS = ['private', 'query']
const inject = require('scuttle-inject')

module.exports = function (server, opts) {
  return inject(server, { darkcrystal: methods }, PLUGIN_DEPS)
}
