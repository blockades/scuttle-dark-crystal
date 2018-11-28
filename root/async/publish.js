const { isRoot } = require('ssb-dark-crystal-schema')
const publish = require('../../lib/publish-msg')

module.exports = function publishRoot (server) {
  return function (name, callback) {
    var content = {
      type: 'dark-crystal/root',
      version: '2.0.0',
      name,
      recps: [server.id]
    }

    if (!isRoot(content)) return callback(isRoot.errors)

    publish(server)(content, callback)
  }
}
