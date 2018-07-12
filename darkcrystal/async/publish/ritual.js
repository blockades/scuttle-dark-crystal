const Ritual = require('../../sync/build/ritual')

module.exports = function (server) {
  return function publish (params, callback) {
    var root = new Ritual(params)
    if (!root.valid) return callback(params.errors)
    server.publish(params, callback)
  }
}
