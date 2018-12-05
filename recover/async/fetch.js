const pull = require('pull-stream')
const { isFeed } = require('ssb-ref')

const isRoot = require('../../isRoot')
const isRitual = require('../../isRitual')
const isShard = require('../../isShard')
const isRequest = require('../../isRequest')
const isReply = require('../../isReply')

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
        const shards = backlinks
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

        cb(null, { root, ritual, shards })
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

function getRoot (server) {
  return function (rootId, cb) {
    const query = [{
      $filter: {
        key: rootId,
        value: {
          author: server.id,
          content: {
            type: 'dark-crystal/root'
          }
        }
      }
    }]

    pull(
      server.query.read({ query }),
      pull.collect((err, roots) => {
        if (err) return cb(err)
        const root = roots[0]
        if (!isRoot(root)) return cb(isRoot.errors)

        cb(null, root)
      })
    )
  }
}

function getBacklinks (server) {
  return function (rootId, cb) {
    const query = [{
      $filter: {
        dest: rootId,
        value: {
          content: { root: rootId }
        }
      }
    }]

    pull(
      server.backlinks.read({ query }),
      // pull.through(log),
      pull.collect(cb)
    )
  }
}

function log (msg) { console.log(JSON.stringify(msg, null, 2)) }
