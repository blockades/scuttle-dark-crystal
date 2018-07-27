
const Invites = require('scuttle-invite')

const ref = require('ssb-ref')



module.exports = function (server) {
  const invites = Invites(server)

  return function request (rootId, inviteId, callback) {
    // Maybe we dont need to take rootId as an argument because
    // we can get it from the invite message itself

    if (!ref.isMsgId(rootId)) return callback(new Error('Invalid rootId'))
    if (!ref.isMsgId(inviteId)) return callback(new Error('Invalid inviteId'))

    // we need to write a query to find the shard message
    // associated with rootId, and unbox the shard part

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
    
    // not sure if we need a pull stream since we are 
    // expecting to find exactly one message
    // hmmm... 
    msg = server.query.read(findShard(rootId))
    
    // should really use that module which
    // returns just the message part
    theDecryptedShard = server.private.unbox(msg.value.content.shard)

    var reply = {
      root: rootId,
      branch: inviteId,
      accept: true,
      body: theDecryptedShard
    }

    invites.invites.async.private.reply(reply, (err,msg) => {
      if (err) cb(err)
      else cb(null,msg) 
    })
  }
}
