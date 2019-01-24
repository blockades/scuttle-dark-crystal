const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const { isMsgId, isFeed } = require('ssb-ref')
const { isRequest } = require('ssb-dark-crystal-schema')

const PullShardsByRoot = require('../../shard/pull/by-root')

module.exports = function (server) {
  const invites = ScuttleInvite(server)
  const pullShardsByRoot = PullShardsByRoot(server)

  return function Request (rootId, recipients, callback) {
    if (callback === undefined && typeof recipients === 'function') return Request(rootId, null, recipients)
    // if only 2 args, run the function with recipients set to null

    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))
    if (recipients && !Array.isArray(recipients)) return callback(new Error(`Recipients must either be an Array of feed Ids or falsey`))

    if (!recpsValid(recipients)) return callback(new Error(`All recipients must be a feedId`))

    // TODO: verifiy that recipients.indexOf(server.id) < 0

    pull(
      pullShardsByRoot(rootId),
      recipients
        ? pull.filter(isShardForNamedRecipient)
        : pull.through(),
      pull.asyncMap((shard, cb) => {
        const { recps } = getContent(shard)

        // TODO: not sure if we need to tell level that dbkey is an object
        const dbKey = JSON.stringify({ rootId, recp: recps.find(notMe) })
        server.ephemeral.generateAndStore(dbKey, (err, ephPublicKey) => {
          if (err) cb(err)
          cb(null, {
            type: 'invite', // is over-written by invites.async.private.publish
            version: '1', // ditto
            root: rootId,
            recps,
            body: 'Hi, you are holding a shard for me, can I please have it back?',
            ephPublicKey
          })
        })
      }),
      pull.filter(isRequest),
      pull.collect((err, requests) => {
        if (err) return callback(err)
        if (requests.length < 1) return callback(new Error('There are no shards associated with rootId ', rootId))

        pull(
          pull.values(requests),
          pull.asyncMap(invites.async.private.publish),
          pull.collect(callback)
        )
      })
    )

    function isShardForNamedRecipient (shard) {
      const { recps } = getContent(shard)

      return recps.some(r => recipients.includes(r))
    }
  }

  function notMe (recp) {
    return recp !== server.id
  }
}

function recpsValid (recipients) {
  if (!recipients) return true

  const feedIds = recipients
    .map(recp => typeof recp === 'string' ? recp : recp.link)
    .filter(Boolean)
    .filter(isFeed)

  return feedIds.length === recipients.length
}

