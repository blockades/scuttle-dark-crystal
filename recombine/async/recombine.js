

const Invites = require('scuttle-invite')
const ref = require('ssb-ref')
const pull = require('pull-stream')
const { isInvite, isReply } = require('scuttle-invite-schema')
const pullRitual = require('../../ritual/pull/mine')
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
        // validate that body is a shard using secrets.js 
        try {
          var shardComponents = secrets.extractShareComponents(msg.body)
        }
        catch (err) {
          return callback(err)
        }
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
