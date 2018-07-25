
const GetRoot = require('../../root/async/get')
// const Invites = require('scuttle-invite')
const pull = require('pull-stream')

module.exports = function (server) {
  
  // const invites = Invites(server)
  const getRoot = GetRoot(server)
  
  return function request (rootId, callback) {
   
    const optsForType = (type) => {
      return {
        query: [{
          $filter: { value: { content: { type } } }
        }]
      }
    }

    // TODO: fix this (doesnt work) and use it to get root.name
    //    getRoot(rootId, (err,root) => {})
    const name = 'coming soon'

    pull(
      server.query.read(optsForType('dark-crystal/shard')),
      pull.filter((msg) => (msg.value.content.root === rootId)),
      pull.map((msg) => {
        // we want the recipient which is not ourself.
        msg.value.content.recps.filter((r)=>(r != server.id))
        return msg.value.content.recps[0]
      }),
      pull.collect((err,recps) => {
        if (err) callback(err)
        // hopefully we now have an array of recps 
        var params = {
          root: rootId,
          body: `Request for shard for ${name}`,
          recps
        } 
       
        // Commented out until it installs properly
        // invites.async.private.publish(params, (err,msg) => {})
        callback(null,params)
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
