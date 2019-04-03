const { isForwardRequest } = require('ssb-dark-crystal-schema')
const publish = require('../../lib/publish-msg')

module.exports = function (server) {
  return function publishRitual ({ secretOwner, recp }, callback) {
    var content = {
      type: 'dark-crystal/forward-request',
      version: '1.0.0',
      secretOwner,
      recps: [recp, server.id]
    }

    // TODO: check that secretOwner !== recp or sever.id

    if (!isForwardRequest(content)) return callback(isForwardRequest.errors)

    publish(server)(content, callback)
  }
}
