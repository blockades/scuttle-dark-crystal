const pull = require('pull-stream')
const ref = require('ssb-ref')
const getContent = require('ssb-msg-content')
const { isForward } = require('ssb-dark-crystal-schema')
const secrets = require('../../lib/secrets-wrapper')

module.exports = function (server) {
  return function recombine (rootId, callback) {
    if (!ref.isMsgId(rootId)) return callback(new Error('Invalid rootId'))

    let version

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
      pull.map(content => {
        version = content.version
        return content.shard
      }),
      pull.collect((err, shards) => {
        if (err) return callback(err)
        try {
          if (shards.length < 1) throw new Error('No foward messages associated with this rootId')
          return callback(null, secrets.combine(shards, version))
        } catch (err) { return callback(err) }
      })
    )
  }
}
