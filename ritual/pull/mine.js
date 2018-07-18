const pull = require('pull-stream')
const next = require('pull-next-query')
const { isRitual } = require('ssb-dark-crystal-schemas')

module.exports = function (server) {
  return function mine (opts) {
    const _opts = Object.assign({}, {
      limit: 100,
      query: [{
        $filter: {
          value: {
            timestamp: { gt: 0 },
            author: server.id,
            content: {
              type: `dark-crystal/ritual`,
            }
          }
        }
      }]
    }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(isRitual)
    )
  }
}
