
const Invites = require('scuttle-invite')
const ref = require('ssb-ref')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')
const { isInvite, isReply } = require('scuttle-invite-schema')


module.exports = function (server) {
  const invites = Invites(server)

  return function reply (inviteId, callback) {

    if (!ref.isMsgId(inviteId)) return callback(new Error('Invalid inviteId'))

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
    
    // Could maybe rather use this to get the invite, which i think does some 
    // validation but it also strips the author which we need.
    // server.invites.getInvite(inviteId, (err,inviteMsg) => {
    
    server.get(inviteId, (err,inviteMsg) => {
      if (err) return callback(err)
    
      // TODO: validate invite message with isInvite(inviteMsg)
      
      rootId = getContent(inviteMsg).root
      
      // find the shard associated with this rootId
      pull(
        server.query.read(findShard(rootId)),
        pull.collect((err, shards) => {
          if (err) return callback(err)
          if (shards.length < 1) return callback(new Error('There are no shards associated with rootId ',rootId))
          
          if (shards.length > 1) {
            return callback(new Error('You have more than one shard for this secret, not yet supported'))
          }
          
          // Verify that the invite has the same author as the shard message
          if (shards[0].value.author != inviteMsg.author) {
            return callback(new Error('Invite author does not match associated shard author.'))
          }
          // TODO: Verify that this author also published the root message using:
          // server.get(rootId,  )
          // (currently this wont work as our test does not publish a root message)

          var shard = getContent(shards[0]).shard

          theDecryptedShard = server.private.unbox(shard)
          
          var reply = {
            root: rootId,
            branch: inviteId,
            accept: true,
            body: theDecryptedShard,
            recps: [shards[0].value.author, server.id]
          }

          invites.invites.async.private.reply(reply, (err,msg) => {
            if (err) callback(err)
            else callback(null,msg) 
          })
          
        })
      )
    })
  }
}
