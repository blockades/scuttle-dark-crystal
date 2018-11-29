const pull = require('pull-stream')
const ref = require('ssb-ref')
const getContent = require('ssb-msg-content')
const { isForward } = require('ssb-dark-crystal-schema')
const secrets = require('../../lib/secrets-wrapper')

module.exports = function (server) {
  return function recombine (root, callback) {
    if (!ref.isMsgId(root)) return callback(new Error('Invalid root'))

    let versions = []

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
      pull.through(content => versions.push(content.shardVersion)),
      pull.map(content => content),
      pull.collect((err, contents) => {
        if (err) return callback(err)
        let version = mode(versions)
        let shards = contents.filter(content => content.shardVersion === version)
          .map(content => content.shard)
        try {
          if (shards.length < 1) throw new Error('No foward messages associated with this rootId')
          if (!version) throw new Error('No versions available')

          return callback(null, secrets.combine(shards, version))
        } catch (err) { return callback(err) }
      })
    )
  }
}

function mode (array) {
  return array.sort((a, b) => (
    array.filter(v => v === a).length -
      array.filter(v => v === b).length
  )).pop();
}
