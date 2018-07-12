const Root = require('../../sync/build/root')

module.exports = function (server) {
  return function publish (params, callback) {
    var root = new Root(params)
    if (!root.valid) return callback(params.errors)
    server.publish(params, callback)
  }
}
