const pull = require('pull-stream')
const next = require('pull-next-query')
const { isForward } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function pullForwardsToOthers (opts = {}) {
    const query = [{
      $filter: {
        value: {
          author: server.id,
          timestamp: { $gt: 0 }, // needed for pull-next-query to stepOn on published timestamp
          content: { type: 'dark-crystal/forward' }
        }
      }
    }]

    const _opts = Object.assign({}, opts, { query, limit: 100 })

    return pull(
      next(server.query.read, _opts),
      pull.filter(isForward)
    )
  }

  function pullForwardsToOthers (rootAuthor, opts = {}) {
    const query = [{
      $filter: {
        value: {
          author: server.id,
          timestamp: { $gt: 0 }, // needed for pull-next-query to stepOn on published timestamp
          content: { type: 'dark-crystal/forward' }
        }
      }
    }]

    const _opts = Object.assign({}, opts, { query, limit: 100 })

    return pull(
      next(server.query.read, _opts),
      pull.filter(isForward)
    )
  }
}
