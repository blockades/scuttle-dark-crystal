
const Invites = require('scuttle-invite')
const ref = require('ssb-ref')
const pull = require('pull-stream')

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
   
    server.get(inviteId, (err,inviteMsg) => {
      if (err) return callback(new Error('Cannot find invite with given inviteId'))
      // TODO: validate invite message with isInvite(inviteMsg)

      rootId = inviteMsg.content.root
      
      // find the shard associated with this rootId
      pull(
        server.query.read(findShard(rootId)),
        pull.collect((err, shards) => {
          if (shards.length < 1) return callback(new Error('There are no shards associated with rootId ',rootId))

          if (err) return callback(err)
          console.log('Shards looks like: ',shards); 
          callback(null,shards)

          // theDecryptedShard = server.private.unbox(msg.value.content.shard)
          // should really use that module which returns just the message part
          
          // var reply = {
          //   root: rootId,
          //   branch: inviteId,
          //   accept: true,
          //   body: theDecryptedShard
          // }
          
          
          // invites.invites.async.private.reply(reply, (err,msg) => {
          //   if (err) callback(err)
          //   else callback(null,msg) 
          // })
        })
      )
    })
  }
}
