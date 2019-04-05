const pull = require('pull-stream')
const { isMsg, isFeed } = require('ssb-ref')

const buildForwardRequest = require('../async/build')
const publish = require('../../lib/publish-msg')

module.exports = function (server) {
  return function publishAll ({ secretOwner, recps }, callback) {
    if (!validRecps(recps)) return callback(new Error('forwardRequests publishAll: all recps must be valid feedIds', recps))
    if (!isFeed(secretOwner)) return callback(new Error('forwardRequests publishAll: invalid feedId', secretOwner))

    pull(
      pull.values(recps.map(recp => ({ secretOwner, recp }))),
      pull.asyncMap(buildForwardRequest(server)),
      pull.collect((err, forwardRequests) => {
        if (err) return callback(err)

        publishAll(forwardRequests)
      })
    )

    function publishAll (forwardRequests) {
      pull(
        pull.values(forwardRequests),
        pull.asyncMap(publish(server)),
        pull.collect(callback)
      )
    }
  }
}

function validRecps (recps) {
  return recps.every(isFeed)
}