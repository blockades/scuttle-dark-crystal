const { isFeed } = require('ssb-ref')
const get = require('lodash.get')

const getBacklinks = require('../../lib/get-backlinks')
const getRoot = require('../../root/async/get')

const isRitual = require('../../isRitual')
const isShard = require('../../isShard')
const isRequest = require('../../isRequest')
const isReply = require('../../isReply')
const isForward = require('../../isForward')

// calls back with an object of form:
//
// {
//   root,
//   ritual,
//   shardsData: [
//     {
//       feedId,
//       shard,
//       requestsData: [
//         { request } // request with no reply
//         { request, reply }, // later request paired with a reply
//       ]
//     },
//     {
//       feedId,
//       shard,
//       requestsData: [
//         { request, reply }
//       ]
//     },
//     {
//       feedId,
//       shard,
//       requestsData: [
//         { request }
//       ]
//     },
//   ]
// }
//
// OR in the case if asking about forwarded shards
//
// {
//   root: null,
//   ritual: null,
//   shardsData: [
//     {
//       feedId,
//       shard: null, // don't know the original shard message
//       requestsData: [],
//       forwardsData: [
//         { forward }
//       ]
//     },
//     {
//       feedId,
//       shard: null,
//       requestsData: [],
//       forwardsData: [
//         { forward }
//       ]
//     }
//   ]
// }

module.exports = function fetch (server) {
  return function (rootId, cb) {
    getRoot(server)(rootId, (err, root) => {
      if (err) return cb(err)

      getBacklinks(server)(rootId, (err, backlinks) => {
        if (err) return cb(err)

        const rituals = backlinks.filter(isRitual)
        if (rituals.length > 1) return cb(new Error(`only one ritual allowed, found ${rituals.length}`))
        const ritual = get(rituals, '[0]', null)

        const shareVersion = get(ritual, 'value.content.version')
        const shardsData = backlinks
          .filter(isShard)
          .reduce((acc, shard) => {
            const feedId = getCustodian(shard)
            if (!isFeed(feedId)) return acc

            const dialogue = backlinks.filter(msg => getCustodian(msg) === feedId)

            const replies = dialogue.filter(msg => isReply(msg))
              .filter(reply => getShareVersion(reply) === shareVersion)

            const requestsData = dialogue.filter(isRequest)
              .map(request => {
                return {
                  request,
                  reply: getReply(request, replies)
                }
              })
            acc.push({ feedId, shard, requestsData })
            return acc
          }, [])

        backlinks.filter(isForward)
          .forEach(forward => {
            const feedId = forward.value.author

            var entry = shardsData.find(data => data.feedId === feedId)
            if (!entry) {
              entry = { feedId, shard: null, requestsData: [], forwardsData: [] }
              shardsData.push(entry)
            }
            if (!entry.forwardsData) entry.forwardsData = []

            entry.forwardsData.push({ forward })
          })

        cb(null, { root, ritual, shardsData })
      })
    })
  }

  function getCustodian (msg) {
    return msg.value.content.recps.find(r => r !== server.id)
  }
}

function getShareVersion (reply) {
  return get(reply, 'value.content.shareVersion', '1.0.0')
}

// NOTE - this is a bit brittle - there's not a 1:1 relationship between what's in the branch field and the invite it was replying to
// e.g. if there were 2 requests, I think the next reply will always point to the _last_ request, not just any request
// this will cause problems with ephemeral requests / replies maybe?
function getReply (request, replies) {
  return replies.find(reply => getBranch(reply) === request.key)
}

function getBranch (msg) {
  return (Array.isArray(msg.value.content.branch))
    ? msg.value.content.branch[0]
    : msg.value.content.branch
}
