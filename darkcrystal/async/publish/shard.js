const Shard = require('../../sync/build/shard')

module.exports = function (server) {
  return function publish (params, callback) {
    var shard = new Shard(params)
    if (!shard.valid) return callback(params.errors)
    server.publish(params, callback)
  }
}
