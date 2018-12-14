const { isRitual, isRoot, isShard, isForward } = require('ssb-dark-crystal-schema')
const isRequest = require('./isRequest')
const isReply = require('./isReply')

module.exports = {
  recover: {
    async: {
      recombine: require('./recover/async/recombine'),
      reply: require('./recover/async/reply'),
      request: require('./recover/async/request')
    },
    pull: {
      requests: require('./recover/pull/requests'),
      replies: require('./recover/pull/replies')
    }
  },
  root: {
    async: {
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
  forward: {
    async: {
      publish: require('./forward/async/publish')
    },
    pull: {
      fromOthers: require('./forward/pull/from-others'),
      byRoot: require('./forward/pull/by-root')
    }
  },
  sync: {
    isRitual: () => isRitual,
    isRoot: () => isRoot,
    isShard: () => isShard,
    isForward: () => isForward,
    isRequest: () => isRequest,
    isReply: () => isReply
  }
}
