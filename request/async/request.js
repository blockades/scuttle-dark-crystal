
const GetRoot = require('../../root/async/get')
// const Invites = require('scuttle-invite')
const pull = require('pull-stream')

module.exports = function (server) {
  const invites = Invites(server)

  return function request (rootId, callback) {
    const crystalShards = (root) => {
      return {
        query: [{
          $filter: {
            value: {
              content: {
                type: 'dark-crysal/shard',
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
          recps: msg.value.content.recps
        }
      }),
      pull.collect((err, recps) => {
        //
        // (mix) 
        // this is as far as I got with this.
        // I think the collect should do a check of all invites like in publishAll
        // and then it should run the publishing of all invites? 
        //
        //
        if (err) callback(err)
        // hopefully we now have an array of recps

        // Commented out until it installs properly
        // invites.async.private.publish(params, (err,msg) => {})
        callback(null, params)
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
