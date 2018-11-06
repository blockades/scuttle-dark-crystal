const pull = require('pull-stream')
const ref = require('ssb-ref')
const secrets = require('secrets.js-grempe')
const getContent = require('ssb-msg-content')
const crypto = require('crypto')

const isReply = require('../../isReply')

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
          pull.collect((err, replyLikeMsgs) => {
            if (err) return callback(err)
            var shards = replyLikeMsgs
              .filter(isReply)
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
              const hex = secrets.combine(shards)
              const hashOfSecret = hex.slice(-40)
              var secret = secrets.hex2str(hex.slice(0, -40))
              if (crypto.createHash('sha1').update(secret, 'binary').digest('hex') !== hashOfSecret) {
                throw new Error('This does not look like a secret')
              }
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
