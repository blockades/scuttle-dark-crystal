const { isMsgId, isFeed } = require('ssb-ref')

module.exports = function (server) {
  return function deleteKeyPair (rootId, recipient, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))
    if (!isFeed(recipient)) return callback(new Error('Invalid recipient'))

    const dbKey = JSON.stringify({ rootId, recp: recipient })
    server.ephemeral.deleteKeyPair(dbKey, (err) => {
      if (err) return callback(err)
      callback(null, true)
    })
  }
}
