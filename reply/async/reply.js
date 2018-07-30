const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const PullShardsByRoot = require('../../shard/pull/byRoot')

const { isMsgId } = require('ssb-ref')
const { isInvite, isReply } = require('scuttle-invite-schema')

module.exports = function (server) {
  const invites = ScuttleInvite(server)
  const pullShardsByRoot = PullShardsByRoot(server)

  return function reply (inviteId, callback) {
    if (!isMsgId(inviteId)) return callback(new Error('Invalid inviteId'))

    server.get(inviteId, (err, invite) => {
      if (err) return callback(err)
      if (!isInvite(invite)) return callback(new Error('This record is not an invite'))

      const rootId = getContent(invite).root

      pull(
        pullShardsByRoot(rootId, { limit: 0 }),
        pull.collect((err, shards) => {
          if (err) return callback(err)

          if (shards.length < 1) {
            let error = new Error('There are no shards associated with rootId ',rootId)
            return callback(error)
          }

          if (shards.length > 1) {
            let error = new Error('You have more than one shard for this secret, not yet supported')
            return callback(error)
          }

          const {
            value: {
              author,
              content: { shard }
            }
          } = shards[0]

          if (author !== invite.author) {
            let error = new Error('Invite author does not match associated shard author.')
            return callback(error)
          }

          // TODO: Verify that this author also published the root message using:
          // server.get(rootId,  )
          // (currently this wont work as our test does not publish a root message)

          const theDecryptedShard = server.private.unbox(shard)

          const reply = {
            root: rootId,
            branch: inviteId,
            accept: true,
            body: theDecryptedShard,
            recps: [author, server.id]
          }

          invites.async.private.reply(reply, callback)
        })
      )
    })
  }
}
