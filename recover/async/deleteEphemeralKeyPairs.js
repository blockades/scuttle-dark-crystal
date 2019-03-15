const { isMsgId } = require('ssb-ref')
const GetReplies = require('../pull/replies')
const pull = require('pull-stream')
const DeleteKeyPair = require('./deleteKeyPair')

module.exports = function (server) {
  const deleteKeyPair = DeleteKeyPair(server)
  const getReplies = GetReplies(server)
  return function deleteKeyPairs (rootId, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))
    pull(
      getReplies(rootId, { live: false }),
      // pull.filter body contains boxed msg?
      pull.asyncMap((reply, cb) => {
        deleteKeyPair(rootId, reply.value.author, (err) => {
          if (err) cb(err)
          cb(null, reply)
        })
      }),
      pull.collect(callback)
    )
  }
}
