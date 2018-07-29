const ScuttleInvite = require('scuttle-invite')
const pull = require('pull-stream')
const getContent = require('ssb-msg-content')

const { isMsgId, isFeedId } = require('ssb-ref')
const { isInvite, isReply } = require('scuttle-invite-schema')

module.exports = function (server) {
  const scuttle = ScuttleInvite(server)

  return function request (rootId, callback) {
    if (!isMsgId(rootId)) return callback(new Error('Invalid rootId'))

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
      pull.map(shard => {
        return {
          root: rootId,
          body: "Hi you've been holding a shard for me, can I please have it back?",
          recps: getContent(shard).recps,
        }
      }),
      pull.through(request => {
        if ((isMsgId(request.root)) && (request.recps.every(isFeedId))) return request
        else return callback(new Error('Error validating request ', request))
      }),
      pull.collect((err, requests) => {
        if (err) return callback(err)
        if (requests.length < 1) return callback(new Error('There are no shards associated with rootId ', rootId))

        pull(
          pull.values(requests),
          pull.asyncMap(scuttle.invites.async.private.publish),
          pull.collect(callback)
        )
      })
    )
  }
}
