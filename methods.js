const { isRitual, isRoot } = require('ssb-schema-definitions')

module.exports = {
  async: {
    get: {
      root: require('./darkcrystal/async/get/root'),
      ritual: require('./darkcrystal/async/get/ritual'),
      shard: require('./darkcrystal/async/get/shard')
    },
    publish: {
      root: require('./darkcrystal/async/publish/root'),
      ritual: require('./darkcrystal/async/publish/ritual'),
      shard: require('./darkcrystal/async/publish/shard')
    }
    share: require('./darkcrystal/async/share')
  },
  pull: {
    shards: require('./darkcrystal/pull/shards')
  },
  sync: {
    isRitual: () => isRitual,
    isRoot: () => isRoot,
    isShard: () => isShard
  }
}
