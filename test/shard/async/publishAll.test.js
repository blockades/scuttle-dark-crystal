const { describe } = require('tape-plus')
const secrets = require('secrets.js-grempe')
const { isShard } = require('ssb-dark-crystal-schema')

const PublishAll = require('../../../shard/async/publish-all')
const Server = require('../../testbot')

describe('shard.async.publishAll', context => {
  let server
  let publishAll
  let recps, secret, quorum, rootId
  let hexSecret, shards

  context.beforeEach(c => {
    server = Server()
    publishAll = PublishAll(server)
    recps = [
      server.createFeed().id,
      server.createFeed().id,
      server.createFeed().id
    ]
    secret = Math.random().toString(36)
    quorum = 3

    hexSecret = secrets.str2hex(secret)
    shards = secrets.share(hexSecret, recps.length, quorum)

    rootId = '%viiJnnnXjNkfCALivEZbrDe8UndkCCCNQ/CgBOWgJLw=.sha256'
  })

  context.afterEach(c => {
    server.close()
  })

  context('publishes all shards', (assert, next) => {
    publishAll({ shards, recps, rootId }, (err, publishedShards) => {
      console.log(publishedShards[0])
      console.log(publishedShards[0].value.content)
      assert.notOk(err, 'error is null')
      assert.ok(Array.isArray(publishedShards), 'returns some data')
      assert.equal(publishedShards.length, shards.length, 'publishes one message for each recipient')

      publishedShards.forEach((shardMessage) => {
        assert.ok(isShard(shardMessage), 'valid shard')
      })
      next()
    })
  })

  context('publishes no shards when a single shard is invalid', (assert, next) => {
    recps[1] = 'this is not a valid feedId'
    publishAll({ shards, recps, rootId }, (err, data) => {
      assert.ok(err, 'raises error')
      assert.notOk(data, 'data is undefined')
      next()
    })
  })
})
