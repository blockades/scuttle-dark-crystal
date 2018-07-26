
const Invites = require('scuttle-invite')




module.exports = function (server) {
  const invites = Invites(server)

  return function request (rootId, inviteId, callback) {
    // Maybe we dont need to take rootId as an argument because
    // we can get it from the invite itself

    // we need to write a query to find the shard message
    // associated with rootId, and unbox the shard part

    var reply = {
      root: rootId,
      branch: inviteId,
      accept: true,
      body: theDecryptedShard
    }

    invites.invites.async.private.reply(reply, (err,msg) => {

    })
  }
}
