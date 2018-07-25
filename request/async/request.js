
const GetRoot = require('../../root/async/get')
const Invites = require('scuttle-invite')
const pull = require('pull-stream')

module.exports = function (server) {
  
  const invites = Invites(server)
  const getRoot = GetRoot(server)
  
  return function request (rootId, callback) {
   
    getRoot(rootId, (err,root) => {
      if (err) callback(err)

      const recps = getRecps(rootId) 

      params = {
        root: rootId,
        body: `Request for shard for ${root.name}`,
        recps
      }
      
      invites.async.private.publish(params, (err,msg) => {
        if (err) callback(err)
        else callback(null,msg)
      })
    })

  }
}


function getRecps (rootId) {
  
  const optsForType = (type) => {
    return {
      query: [{
        $filter: { value: { content: { type } } }
      }]
    }
  }
  
  pull(
    // createBacklinkStream(rootId),
    
    server.query.read(optsForType('dark-crystal/shard')),
    pull.filter((msg) => (msg.root === rootId)),
    pull.map((msg) => {
      // we want the recipient which is not ourself.
      msg.recps.filter((r)=>(r != server.id))
      return msg.recps[0]
    }),
    pull.collect(recps)
  )
  // hopefully we now have an array of recps 
  return recps
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
