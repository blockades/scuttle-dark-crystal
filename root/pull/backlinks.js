const pull = require('pull-stream')

module.exports = function (server) {
  return function pullRootBacklinks (key, opts = {}) {
    const query = [{
      $filter: { dest: key }
      // index: 'DTA' // don't think this is needed?
    }]

    return pull(
      server.backlinks.read(Object.assign({}, opts, { query }))
      // pull.filter(m => isShard(m) || isRitual(m))
    )
  }
}

