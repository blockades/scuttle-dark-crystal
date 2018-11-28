const pull = require('pull-stream')
const ref = require('ssb-ref')
const getContent = require('ssb-msg-content')
const { isForward } = require('ssb-dark-crystal-schema')
const secrets = require('../../lib/secrets-wrapper')

module.exports = function (server) {
  return function recombine (root, callback) {
    if (!ref.isMsgId(root)) return callback(new Error('Invalid root'))

    let version

    const opts = {
      query: [{
        $filter: {
          value: {
            content: {
              type: 'dark-crystal/forward',
              root
            }
          }
        }
      }]
    }

    pull(
      server.query.read(opts),
      pull.filter(isForward),
      pull.map(getContent),
      pull.map(content => {
        version = content.shardVersion
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
