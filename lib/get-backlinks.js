const pull = require('pull-stream')

module.exports = function getBacklinks (server) {
  return function (rootId, cb) {
    const query = [{
      $filter: {
        dest: rootId,
        value: {
          content: { root: rootId }
        }
      }
    }]

    pull(
      server.backlinks.read({ query }),
      pull.collect(cb)
    )
  }
}
