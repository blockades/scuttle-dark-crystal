const { isForward, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publish (root, shard, recp, callback) {
    var content = {
      type: 'dark-crystal/forward',
      version: SCHEMA_VERSION,
      root,
      shard,
      recps: [recp, server.id]
    }

    if (isForward(content)) {
      server.private.publish(content, [server.id], (err, root) => {
        if (err) callback(err)
        else server.private.unbox(root, callback)
      })
    } else callback(isForward.errors)
  }
}
