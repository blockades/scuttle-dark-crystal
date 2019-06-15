const { isMsgId } = require('ssb-ref')
const GetReplies = require('../pull/replies')
const pull = require('pull-stream')
const DeleteEphemeralKeyPair = require('./deleteEphemeralKeyPair')

module.exports = function (server) {
  const deleteEphemeralKeyPair = DeleteEphemeralKeyPair(server)
  const getReplies = GetReplies(server)
  return function deleteEphemeralKeyPairs (rootId, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))
    pull(
      getReplies(rootId, { live: false }),
      // pull.filter body contains boxed msg?
      pull.asyncMap((reply, cb) => {
        deleteEphemeralKeyPair(rootId, reply.value.author, (err) => {
          if (err) cb(err)
          cb(null, reply)
        })
      }),
      pull.collect(callback)
    )
  }
}