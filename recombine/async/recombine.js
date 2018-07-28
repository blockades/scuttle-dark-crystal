

const Invites = require('scuttle-invite')
const ref = require('ssb-ref')
const pull = require('pull-stream')
const { isInvite, isReply } = require('scuttle-invite-schema')
const pullRitual = require('../../ritual/pull/mine')
const { box } = require('ssb-keys')
const secrets = require('secrets.js-grempe')

module.exports = function (server) {
  const invites = Invites(server)

  return function recombine (rootId, callback) {
    if (!ref.isMsgId(rootId)) return callback(new Error('Invalid rootId'))

    const findReplies = (root) => {
      return {
        query: [{
          $filter: {
            value: {
              content: {
                type: 'invite-reply',
                root
              }
            }
          }
        }]
      }
    }
    
    // get the quorum from the ritual message
    // not exactly sure how to use this method
    pull ( pullRitual( need to give the rootId to opts ) )    

    pull(
      server.query.read(findReplies(rootId)),
      pull.map((replyMsg) => {

        // TODO: this unboxed shard validation should be moved
        // to a separate method so that it can be used independently

        // validate that body is a shard using secrets.js 
        try {
          var shardComponents = secrets.extractShareComponents(msg.body)
        }
        catch (err) {
          return callback(err)
        }
     
        // // TODO: need to write query to get shard messages
        // // verify that the shard is the shard we sent
        // if (shardForThatAuthor.shard != box(replyMsg.body, [replyMsg.author]))
        //   return callback(new Error('Recieved shard does not match given shard for shardholder ',replyMsg.author))


        return replyMsg.body 
      }),
      pull.collect((err, shards) => {
        if (shards.length < quorum) return callback(new Error('Not enough shards to recombine'))
        try {
          secret = secrets.combine(shards) 
        } 
        catch (err) {
          return callback(err)
        }
        callback(null,secret)
      })
    )
  }
}
