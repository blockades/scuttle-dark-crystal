// const { isRoot } = require('ssb-dark-crystal-schema')

module.exports = function (server) {
  return function get (rootId, cb) {
    return server.get(rootId, cb)
  }
}
