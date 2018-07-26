
const GetRoot = require('../../root/async/get')
const Invites = require('scuttle-invite')
const pull = require('pull-stream')

const { isInvite, isReply } = require('scuttle-invite-schema')

module.exports = function (server) {
  const invites = Invites(server)

  return function request (rootId, callback) {
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
        // we want the recipient which is not ourself.
        const recp = msg.value.content.recps.find(r => r !== server.id)
        return {
          root: rootId,
          body: "Hi you've been holding a shard for me, can I please have it back?",
          recps: [recp]
        }
      }),
      // pull.map((inv) => {
      //   isInvite(inv) 
      //   return inv
      // }),
      pull.collect((err, requests) => {
        // const errors = getErrors(requests)
        // if (errors) return callback(new Error(errors))
        pull(
          pull.values(requests),
          pull.asyncMap((oneRequest, cb) => {
console.log('one req',oneRequest);
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

function getErrors (msgs) {
  const errors = msgs
    .filter(s => s.errors)
    .map(s => s.errors)

  return errors.length ? errors : null
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
