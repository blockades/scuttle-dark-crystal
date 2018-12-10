const { isFeed } = require('ssb-ref')

const getBacklinks = require('../../lib/get-backlinks')
const getRoot = require('../../root/async/get')

const isRitual = require('../../isRitual')
const isShard = require('../../isShard')
const isRequest = require('../../isRequest')
const isReply = require('../../isReply')

// calls back with an object of form:
//
// {
//   root,
//   ritual,
//   shardsData: [
//     {
//       feedId,
//       shard,
//       requests: [
//         { request } // request with no reply
//         { request, reply }, // later request paired with a reply
//       ]
//     },
//     {
//       feedId,
//       shard,
//       requests: [
//         { request, reply }
//       ]
//     },
//     {
//       feedId,
//       shard,
//       requests: [
//         { request }
//       ]
//     },
//   ]
// }

module.exports = function fetch (server) {
  return function (rootId, cb) {
    getRoot(server)(rootId, (err, root) => {
      if (err) return cb(err)

      getBacklinks(server)(rootId, (err, backlinks) => {
        if (err) return cb(err)

        const rituals = backlinks.filter(isRitual)
        if (rituals.length !== 1) return cb(new Error(`only one ritual allowed, found ${rituals.length}`))
        const ritual = rituals[0]

        const shardVersion = ritual.value.content.version
        const shardsData = backlinks
          .filter(isShard)
          .reduce((acc, shard) => {
            const feedId = getCustodian(shard)
            if (!isFeed(feedId)) return acc

            const dialogue = backlinks.filter(msg => getCustodian(msg) === feedId)
            const replies = dialogue.filter(msg => isReply(msg, shardVersion))

            const requests = dialogue.filter(isRequest)
              .map(request => {
                return {
                  request,
                  reply: replies.find(reply => getBranch(reply) === request.key)
                }
              })

            acc.push({ feedId, shard, requests })
            return acc
          }, [])

        cb(null, { root, ritual, shardsData })
      })
    })
  }

  function getCustodian (msg) {
    return msg.value.content.recps.find(r => r !== server.id)
  }
}

function getBranch (msg) {
  return (Array.isArray(msg.value.content.branch))
    ? msg.value.content.branch[0]
    : msg.value.content.branch
}
