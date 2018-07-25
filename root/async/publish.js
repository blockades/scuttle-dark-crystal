const { isRoot, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publish (name, callback) {
    var content = {
      type: 'dark-crystal/root',
      version: SCHEMA_VERSION,
      name,
      recps: [server.id]
    }

    if (isRoot(content)) {
      server.private.publish(content, [server.id], (err, root) => {
        callback(err, server.private.unbox(root))
      })
    } else callback(content.errors)
  }
}
