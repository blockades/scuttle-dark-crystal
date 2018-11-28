const isFunction = require('./isFunction')

module.exports = function publish (server) {
  if (isFunction(server)) throw new Error('Must call lib/publish-msg with a server')

  return function (content, cb) {
    if (!content.recps) server.publish(content, cb)

    // newer sbot does this for us but we don't know what version of sbot our friends are using
    server.private.publish(content, content.recps, (err, msg) => {
      if (err) cb(err)
      else server.private.unbox(msg, cb)
    })
  }
}
