const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')

const PullShardsByRoot = require('../../shard/pull/by-root')

module.exports = function (server) {
  const invites = ScuttleInvite(server)
  const pullShardsByRoot = PullShardsByRoot(server)

  return function reply (inviteId, callback) {
    invites.async.getInvite(inviteId, (err, invite) => {
      if (err) return callback(err)

      const {
        value: {
          author: inviteAuthor,
          content: {
            root: rootId,
            ephPublicKey
          }
        }
      } = invite

      pull(
        pullShardsByRoot(rootId),
        pull.collect((err, shards) => {
          if (err) return callback(err)

          if (shards.length < 1) {
            let error = new Error('There are no shards associated with rootId ', rootId)
            return callback(error)
          }

          if (shards.length > 1) {
            let error = new Error('You have more than one shard for this secret, not yet supported')
            return callback(error)
          }

          const {
            value: {
              author,
              content: { shard, version }
            }
          } = shards[0]

          if (author !== inviteAuthor) {
            let error = new Error('Invite author does not match associated shard author.')
            return callback(error)
          }

          // TODO: Verify that this author also published the root message using:
          // server.get(rootId,  )
          // (currently this wont work as our test does not publish a root message)

          server.private.unbox(shard, (err, theDecryptedShard) => {
            if (err) return callback(err)

            let shardToSend
            if (ephPublicKey) {
              const contextMessage = JSON.stringify({ rootId, recp: server.id })
              shardToSend = server.ephemeral.boxMessage(theDecryptedShard, ephPublicKey, contextMessage)
            } else {
              shardToSend = theDecryptedShard
            }

            const reply = {
              root: rootId,
              branch: inviteId,
              accept: true,
              body: shardToSend,
              recps: [author, server.id],
              shareVersion: version
            }

            invites.async.private.reply(inviteId, reply, callback)
          })
        })
      )
    })
  }
}
