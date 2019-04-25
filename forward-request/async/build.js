const { isForwardRequest } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function buildForwardRequest ({ secretOwner, recp }, callback) {
    var content = {
      type: 'dark-crystal/forward-request',
      version: '1.0.0',
      secretOwner,
      recps: [recp, server.id]
    }

    // TODO: check that secretOwner !== recp or sever.id

    if (!isForwardRequest(content)) return callback(isForwardRequest.errors)

    callback(null, content)
  }
}
