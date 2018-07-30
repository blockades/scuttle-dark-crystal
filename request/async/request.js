const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const PullShardsByRoot = require('../../shard/pull/byRoot')

const { isMsgId, isFeedId } = require('ssb-ref')
const { isInvite, isReply } = require('ssb-invite-schema')

module.exports = function (server) {
  const invites = ScuttleInvite(server)
  const pullShardsByRoot = PullShardsByRoot(server)

  return function request (rootId, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid root'))

    pull(
      pullShardsByRoot(rootId, { limit: 0 }),
      pull.map(shard => {
        const content = getContent(shard)
        return {
          type: "invite",
          version: "v1",
          root: rootId,
          body: "Hi you've been holding a shard for me, can I please have it back?",
          recps: content.recps,
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
