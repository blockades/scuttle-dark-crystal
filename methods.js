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
      get: require('./ritual/async/get'),
      publish: require('./ritual/async/publish')
    },
    pull: {
      mine: require('./ritual/pull/mine')
    }
  },
  shard: {
    async: {
      get: require('./shard/async/get'),
      publishAll: require('./shard/async/publishAll')
    },
    pull: {
      byRoot: require('./shard/pull/byRoot'),
      friends: require('./shard/pull/friends')
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
