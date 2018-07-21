const { isRoot, SCHEMA_VERSION } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function publish (params, callback) {
    var content = Object.assign({}, {
      type: 'dark-crystal/root',
      version: SCHEMA_VERSION,
      recps: [server.id]
    }, params)

    if (isRoot(content)) server.private.publish(content,[server.id], (err,root) => {
      callback(err,server.private.unbox(root))
    })
    else callback(content.errors)
  }
}
