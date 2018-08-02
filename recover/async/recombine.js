const pull = require('pull-stream')
const ref = require('ssb-ref')
const secrets = require('secrets.js-grempe')
const getContent = require('ssb-msg-content')
const { isReply } = require('ssb-invite-schema')

// const pullRitual = require('../../ritual/pull/mine')

module.exports = function (server) {
  return function recombine (rootId, callback) {
    if (!ref.isMsgId(rootId)) return callback(new Error('Invalid rootId'))

    const findAssociatedMessages = (type) => {
      return {
        query: [{
          $filter: {
            value: {
              content: {
                type,
                root: rootId
              }
            }
          }
        }]
      }
    }

    // get the quorum from the ritual message
    // TODO: use pullRitual( need to give the rootId to opts ) )

    pull(
      server.query.read(findAssociatedMessages('dark-crystal/ritual')),
      pull.collect((err, rituals) => {
        if (err) return callback(err)
        if (rituals.length !== 1) {
          let error = new Error('There must be exactly one ritual message for each root message')
          return callback(error)
        }

        var quorum = getContent(rituals[0]).quorum

        // get the unencrypted shards from the reply messages
        pull(
          server.query.read(findAssociatedMessages('invite-reply')),
          pull.filter(isReply),
          pull.map((replyMsg) => {
            var shard = getContent(replyMsg).body

            // validate that shard is a shard using secrets.js
            try {
              secrets.extractShareComponents(shard)
            } catch (err) {
              return callback(err)
            }

            return shard
          }),
          pull.collect((err, shards) => {
            if (err) return callback(err)
            if (shards.length < quorum) {
              let error = new Error('Not enough shards to recombine')
              return callback(error)
            }
            try {
              var hex = secrets.combine(shards)
              var secret = secrets.hex2str(hex)
            } catch (err) {
              return callback(err)
            }
            callback(null, secret)
          })
        )
      })
    )
  }
}
