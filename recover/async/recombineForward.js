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
      pull.filter(isForward),
      pull.map(getContent),
      pull.map(content => content.shard),
      pull.collect((err, shards) => {
        if (err) return callback(err)
        try {
          return callback(null, secrets.combine(shards))
        } catch (err) { return callback(err) }
      })
    )
  }
}
