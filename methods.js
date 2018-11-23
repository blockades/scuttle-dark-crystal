const { isRitual, isRoot, isShard } = require('ssb-dark-crystal-schema')

module.exports = {
  recover: {
    async: {
      recombine: require('./recover/async/recombine'),
      reply: require('./recover/async/reply'),
      request: require('./recover/async/request')
    },
    pull: {
      requests: require('./recover/pull/requests')
    }
  },
  root: {
    async: {
      get: require('./root/async/get'),
      publish: require('./root/async/publish')
    },
    pull: {
      mine: require('./root/pull/mine'),
      backlinks: require('./root/pull/backlinks')
    }
  },
  ritual: {
    async: {
      publish: require('./ritual/async/publish')
    },
    pull: {
      byRoot: require('./ritual/pull/by-root')
    }
  },
  shard: {
    async: {
      get: require('./shard/async/get'),
      publishAll: require('./shard/async/publish-all')
    },
    pull: {
      byRoot: require('./shard/pull/by-root'),
      fromOthers: require('./shard/pull/from-others')
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
