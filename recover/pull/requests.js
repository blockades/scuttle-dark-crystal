const pull = require('pull-stream')
const next = require('pull-next-query')
const isInvite = require('scuttle-invite/isInvite')

module.exports = function (server) {
  return function requests (rootId, opts = {}) {
    const _opts = Object.assign({}, {
      limit: 100,
      query: [{
        $filter: {
          value: {
            timestamp: { $gt: 0 },
            content: {
              type: 'invite',
              root: rootId
            }
          }
        }
      }, {
        $filter: {
          value: {
            author: { $ne: server.id }
          }
        }
      }]
    }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(isInvite)
    )
  }
}
