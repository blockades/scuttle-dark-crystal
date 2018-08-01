const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const { isMsgId } = require('ssb-ref')
const { isInvite } = require('ssb-invite-schema')

const PullShardsByRoot = require('../../shard/pull/byRoot')

module.exports = function (server) {
  const invites = ScuttleInvite(server)
  const pullShardsByRoot = PullShardsByRoot(server)

  return function Request (rootId, recipients, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))
    if (Array.isArray(recipients)) {
      let feedIds = recipients
        .map(recp => typeof recp === 'string' ? recp : recp.link)
        .filter(Boolean)
        .filter(isFeed)
      if (feedIds.length < recipients.length) return callback(new Error(`All recipients must be a feedId`))
    } else if (recipients) return callback(new Error(`Recipients must either be an array of feed Ids or falsey`))

    pull(
      pullShardsByRoot(rootId),
      pull.filter(shard => {
        if (recipients) {
          return getContent(shard).recps.find(r => recipients.indexOf(r))
        } else return shard
      }),
      pull.map(shard => {
        const { recps } = getContent(shard)
        return {
          type: 'invite', // is over-written by invites.async.private.publish
          version: '1', // ditto
          root: rootId,
          recps,
          body: "Hi you've been holding a shard for me, can I please have it back?"
        }
      }),
      pull.filter(isInvite),
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
  }
}
