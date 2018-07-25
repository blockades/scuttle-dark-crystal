const { isRitual, isRoot, isShard } = require('ssb-dark-crystal-schema')

module.exports = {
  root: {
    async: {
      get: require('./root/async/get'),
      publish: require('./root/async/publish')
    },
    pull: {
      roots: require('./root/pull/roots'),
      backlinks: require('./root/pull/backlinks')
    }
  },
  ritual: {
    async: {
      get: require('./ritual/async/get'),
      publish: require('./ritual/async/publish')
    }
  },
  shard: {
    async: {
      get: require('./shard/async/get'),
      publishAll: require('./shard/async/publishAll')
    }
  },
  share: {
    async: {
      share: require('./share/async/share')
    }
  },
  sync: {
    isRitual: () => isRitual,
    isRoot: () => isRoot,
    isShard: () => isShard
  }
}
