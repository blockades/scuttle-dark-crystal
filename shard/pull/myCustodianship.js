const pull = require('pull-stream')
const next = require('pull-next-query')
const { isShard } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function myCustodianship (opts = {}) {
    const query = [{
      $filter: {
        value: {
          author: {$ne: server.id},
          timestamp: {$gt: 0}, // needed for pull-next-query to stepOn on published timestamp
          content: { type: 'dark-crystal/shard' }
        }
      }
    }]

    const _opts = Object.assign({}, { query, limit: 100 }, opts)

    return pull(
      next(server.query.read, _opts),
      pull.filter(isShard)
    )
  }
}
