const pull = require('pull-stream')
const { isRoot } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function pullRoots (opts = {}) {
    const query = [{
      $filter: {
        value: {
          author: server.id,
          timestamp: { $gt: 0 }, // needed for how I set up /query page
          content: { type: 'dark-crystal/root' }
        }
      }
    }]

    const _opts = Object.assign({}, { query }, opts)
    // NOTE - this could benefit from a deeper merge?

    return pull(
      server.query.read(_opts),
      pull.filter(isRoot)
    )
  }
}
