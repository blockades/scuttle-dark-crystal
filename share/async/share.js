const secrets = require('secrets.js-grempe')

const GetRoot = require('../../root/async/get')
const PublishRoot = require('../../root/async/publish')
const PublishRitual = require('../../ritual/async/publish')
const PublishShard = require('../../shard/async/publish')

const { isFeed } = require('ssb-ref')

module.exports = function (server) {
  const getRoot = GetRoot(server)
  const publishRitual = PublishRitual(server)

  return function ({ name, rootId, secret, quorum, recps }, callback) {
    recps = sanitize(recps)
    let includesSelf = recps.includes(server.id)

    if (recps.length < 1) return callback(new Error(`recps: must be a feedId`))
    if (includesSelf) return callback(new Error(`recps: doesn't need to include self`))

    const numOfShards = recps.length
    if (Number(numOfShards) < Number(quorum)) {
      var error = new Error(`data.quorum: greater than number of recps`)
      return callback(error)
    }

    const shards = secrets.share(secret, numOfShards, quorum)

    getRoot(rootId, (err, root) => {
      if (!root) return publishRoot({ name }, performSecretRitual)
      else {
        const opts = {
          live: false,
          reverse: false,
          query: [{
            $filter: {
              value: {
                timestamp: { gt: 0 },
                author: server.id,
                content: {
                  type: `dark-crystal/ritual`,
                  root: root.key
                }
              }
            }
          }]
        }

        pull(
          server.query.read(opts),
          pull.collect((err, msgs) => {
            if (err) return callback(err)
            if (msgs.length > 1) return callback(new Error('data.root: already has ritual'))
            performSecretRitual(err, root)
          })
        )
      }
    })

    function performSecretRitual (err, root) {
      if (err) return callback(err)

      publishRitual({ root: root.key, shards: numOfShards, quorum }, (err, ritual) => {
        if (err) return callback(err)

        var params = Array.from(Array(numOfShards).keys()).reduce((acc, index) => {
          acc.push({
            root: root.key,
            shard: box(shard, [recp]),
            recps: [ recps[index], server.id ]
          })
          return acc
        }, [])

        pull(
          pull.values(params),
          pull.asyncMap(publishShard),
          pull.collect((err, shards) => {
            if (err) return callback(err)
            callback(null, msgs)
          })
        )
      })
    }

    function sanitizeRecps (recps) {
      let feedIds = recps
        .map(recp => typeof recp === 'string' ? recp : recp.link)
        .filter(Boolean)
        .filter(isFeed)

      return [...new Set(feedIds)]
    }
  }
}
