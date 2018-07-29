const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')

const { isMsgId } = require('ssb-ref')
const { isInvite, isReply } = require('scuttle-invite-schema')

module.exports = function (server) {
  const scuttle = ScuttleInvite(server)

  return function reply (inviteId, callback) {

    if (!isMsgId(inviteId)) return callback(new Error('Invalid inviteId'))

    const findShard = (root) => {
      return {
        query: [{
          $filter: {
            value: {
              content: {
                type: 'dark-crystal/shard',
                root
              }
            }
          }
        }]
      }
    }

    server.get(inviteId, (err, invite) => {
      if (err) return callback(err)
      if (!isInvite(invite)) return callback(new Error('This record is not an invite'))

      const rootId = getContent(invite).root

      pull(
        server.query.read(findShard(rootId)),
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

          const shardMsg = shards[0]
          const { value: { author } } = shardMsg

          if (author !== invite.author) {
            let error = new Error('Invite author does not match associated shard author.')
            return callback(error)
          }

          // TODO: Verify that this author also published the root message using:
          // server.get(rootId,  )
          // (currently this wont work as our test does not publish a root message)

          const shard = getContent(shardMsg).shard
          const theDecryptedShard = server.private.unbox(shard)

          const reply = {
            root: rootId,
            branch: inviteId,
            accept: true,
            body: theDecryptedShard,
            recps: [author, server.id]
          }

          scuttle.invites.async.private.reply(reply, callback)
        })
      )
    })
  }
}
