const pull = require('pull-stream')
const ref = require('ssb-ref')
const secrets = require('../../secretsWrapper')
const getContent = require('ssb-msg-content')
const { isForward } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function recombine (rootId, callback) {
    if (!ref.isMsgId(rootId)) return callback(new Error('Invalid rootId'))

    const findAssociatedMessages = (type) => {
      return {
        query: [{
          $filter: {
            value: {
              content: {
                type,
                root: rootId
              }
            }
          }
        }]
      }
    }

    pull(
      server.query.read(findAssociatedMessages('dark-crystal/forward')),
      pull.collect((err, forwardLikeMsgs) => {
        if (err) return callback(err)
        var shards = forwardLikeMsgs
          .filter(isForward)
          .map((forwardMsg) => getContent(forwardMsg).shard)

        try {
          var secret = secrets.combine(shards)
        } catch (err) {
          return callback(err)
        }
        callback(null, secret)
      })
    )
  }
}
