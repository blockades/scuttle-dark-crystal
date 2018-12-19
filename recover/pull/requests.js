const pull = require('pull-stream')
const next = require('pull-next-query')
const { isRequest } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function requests (rootId, opts = {}) {
    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 },
          content: rootId
            ? { type: 'invite', root: rootId }
            : { type: 'invite' }
        }
      }
    }, {
      $filter: {
        value: {
          author: { $ne: server.id }
        }
      }
    }]

    const _opts = Object.assign({ limit: 100 }, opts, { query })

    return pull(
      next(server.query.read, _opts),
      pull.filter(isRequest)
    )
  }
}
