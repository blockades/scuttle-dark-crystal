const pull = require('pull-stream')
const next = require('pull-next-query')
const { isForward } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function pullForwardsFromOthers (opts = {}) {
    const query = [{
      $filter: {
        value: {
          timestamp: { $gt: 0 }, // needed for pull-next-query to stepOn on published timestamp
          content: { type: 'dark-crystal/forward' }
        }
      }
    }, {
      $filter: {
        value: {
          author: { $ne: server.id }
        }
      }
    }]
    // have filter author in second $filter to avoid triggering the author-based index D:

    const _opts = Object.assign({}, opts, { query, limit: 100 })

    return pull(
      next(server.query.read, _opts),
      pull.filter(isForward)
    )
  }
}
