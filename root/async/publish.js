const { isRoot, SCHEMA_VERSION } = require('dark-crystal-schemas')

module.exports = function (server) {
  return function publish (params, callback) {
    var content = Object.assign({}, {
      type: 'dark-crystal/root',
      version: SCHEMA_VERSION,
      recps: [server.id]
    }, params)

    if (isRoot(content)) server.publish(content, callback)
    else callback(content.errors)
  }
}
