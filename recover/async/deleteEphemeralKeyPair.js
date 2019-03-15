const { isMsgId, isFeed } = require('ssb-ref')

module.exports = function (server) {
  return function deleteKeyPair (rootId, recipient, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))
    if (!isFeed(recipient)) return callback(new Error('Invalid recipient'))

    server.ephemeral.deleteKeyPair({ rootId, recp: recipient }, (err) => {
      if (err) return callback(err)
      callback(null, true)
    })
  }
}
