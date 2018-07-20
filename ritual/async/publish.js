const { isRitual, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')
const tool = 'secrets.js-grempe'
const toolVersion = require('../../package.json').dependencies[tool]

module.exports = function (server) {
  return function publish (params, callback) {
    var content = Object.assign({}, {
      type: 'dark-crystal/ritual',
      version: SCHEMA_VERSION,
      tool: tool + toolVersion,
      recps: [server.id]
    }, params)

    if (isRitual(content)) server.publish(content, callback)
    else callback(content.errors)
  }
}
