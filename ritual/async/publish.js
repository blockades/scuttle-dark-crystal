
const { isRitual, SCHEMA_VERSION } = require('dark-crystal-schemas')

module.exports = function (server) {
  return function publish (params, callback) {
    var content = Object.assign({}, {
      type: 'dark-crystal/ritual',
      version: SCHEMA_VERSION,
      recps: [server.id]
    }, params)

    if (isRitual(content)) server.publish(content, callback)
    else callback(content.errors)
  }
}
