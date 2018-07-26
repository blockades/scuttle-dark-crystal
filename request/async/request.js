
const GetRoot = require('../../root/async/get')
const Invites = require('scuttle-invite')
var ref = require('ssb-ref')


const pull = require('pull-stream')

const { isInvite, isReply } = require('scuttle-invite-schema')

module.exports = function (server) {
  const invites = Invites(server)

  return function request (rootId, callback) {
    if (!ref.isMsgId(rootId)) return callback(new Error('Invalid rootId'))
    const crystalShards = (root) => {
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

    pull(
      server.query.read(crystalShards(rootId)),
      pull.map((msg) => {
        return {
          root: rootId,
          body: "Hi you've been holding a shard for me, can I please have it back?",
          recps: msg.value.content.recps
        }
      }),
      pull.map((inv) => {
        if ((ref.isMsgId(inv.root)) && (inv.recps.every(ref.isFeedId)))
          return inv
        else
          return callback(new Error('Error validating invite',inv))
      }),
      pull.collect((err, requests) => {
        if (requests.length < 1) return callback(new Error('There are no shards associated with rootId ',rootId))
        pull(
          pull.values(requests),
          pull.asyncMap((oneRequest, cb) => {
            invites.invites.async.private.publish(oneRequest, (err,msg) => {
              if (err) cb(err)
              else cb(null,msg) 
            })
          }),
          pull.collect(callback)
        )
      })
    )
  }
}

// function createBacklinkStream (id) {
//   // how to get only messages of type 'dark-crystal/shard'?
//   var filterQuery = {
//     $filter: {
//       dest: id
//       // type: 'dark-crystal/shard'
//       // root: id
//     }
//   }
//   return server.backlinks.read({
//     query: [filterQuery],
//     index: 'DTA',
//     live: false
//   })
// }
