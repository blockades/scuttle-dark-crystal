const pull = require('pull-stream')
const ref = require('ssb-ref')
const getContent = require('ssb-msg-content')

const secrets = require('../../lib/secrets-wrapper')
const isReply = require('../../isReply')

// const pullRitual = require('../../ritual/pull/mine')

module.exports = function (server) {
  return function recombine (root, callback) {
    if (!ref.isMsgId(root)) return callback(new Error('Invalid root'))

    // get the quorum from the ritual message
    // TODO: use pullRitual( need to give the root to opts ) )

    pull(
      pullAssociatedMessages('dark-crystal/ritual'),
      pull.collect((err, rituals) => {
        if (err) return callback(err)
        if (rituals.length !== 1) {
          let error = new Error('There must be exactly one ritual message for each root message')
          return callback(error)
        }

        const { quorum, version } = getContent(rituals[0])

        // get the unencrypted shards from the reply messages
        pull(
          pullAssociatedMessages('invite-reply'),
          pull.collect((err, replyLikeMsgs) => {
            if (err) return callback(err)
            var shards = replyLikeMsgs
              .filter(r => isReply(r, version))
              .map((replyMsg) => getContent(replyMsg).body)

            if (shards.length < quorum) {
              var errorMsg = 'Not enough shards to recombine.'
              if (shards.length < replyLikeMsgs.length) {
                // TODO: give more details - who are the bad shards from?
                //       what exactly is wrong with them
                const numberInvalidReplies = replyLikeMsgs.length - shards.length
                errorMsg += ' You have ' + String(numberInvalidReplies) + ' invalid reply message(s).'
              }
              return callback(new Error(errorMsg))
            }
            try {
              var secret = secrets.combine(shards, version)
            } catch (err) {
              return callback(err)
            }
            callback(null, buildSecretObject(secret))
          })
        )
      })
    )

    function pullAssociatedMessages (type) {
      const opts = {
        query: [{
          $filter: {
            value: {
              content: {
                type,
                root
              }
            }
          }
        }]
      }

      return server.query.read(opts)
    }
    function buildSecretObject (secret) {
      let secretObject
      try {
        secretObject = JSON.parse(secret)
        // TODO should we use is-my-json-valid to be a bit stricter here?
        if (Object.keys(secretObject).indexOf('secret') < 0) throw new Error('missing secret')
        if (Object.keys(secretObject).indexOf('nickname') < 0) throw new Error('missing nickname')
        if (Object.keys(secretObject).length > 2) throw new Error('too many properties')
      } catch (err) {
        secretObject = { secret }
      }
      return secretObject
    }
  }
}
