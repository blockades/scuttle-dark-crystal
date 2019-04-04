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
      publish: require('./root/async/publish'),
      get: require('./root/async/getAsync')
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
      toOthers: require('./forward/pull/to-others'),
      fromOthersByRoot: require('./forward/pull/from-others-by-root')
    }
  },
  forwardRequest: {
    async: {
      publish: require('./forward-request/async/publish')
    },
    pull: {
      fromSelf: require('./forward/pull/from-self')
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
